import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const IST_OFFSET_MS = 330 * 60 * 1000;
const istNow = () => new Date(Date.now() + IST_OFFSET_MS); // use getUTC* for IST fields

interface PickupSettings {
  booking_days: number[]; pickup_day: number; pickup_start_time: string;
  pickup_end_time: string; cutoff_time: string; refund_policy: string; delivery_enabled?: boolean;
}

async function getSettings(sb: any): Promise<PickupSettings> {
  const { data } = await sb.from("admin_settings").select("value").eq("key", "chicken_pickup_settings").maybeSingle();
  const d = { booking_days: [1, 2, 3, 4, 5, 6], pickup_day: 0, pickup_start_time: "06:00", pickup_end_time: "10:00", cutoff_time: "10:00", refund_policy: "" };
  try { return { ...d, ...(data?.value ? JSON.parse(data.value) : {}) }; } catch { return d; }
}

/** Next pickup-day at cutoff (IST) as a UTC Date. */
function pickupDeadline(s: PickupSettings): Date {
  const n = istNow();
  let add = (s.pickup_day - n.getUTCDay() + 7) % 7;
  const [h, m] = (s.cutoff_time || "10:00").split(":").map(Number);
  const cand = Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate() + add, h, m || 0) - IST_OFFSET_MS;
  if (cand <= Date.now()) add += 7;
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate() + add, h, m || 0) - IST_OFFSET_MS);
}

function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return "CHKN-" + Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

async function hmacHex(secret: string, msg: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await admin.auth.getUser(token);
    const user = userData?.user;
    if (!user) return json({ error: "Please sign in" }, 401);

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "");

    const hasRole = async (role: string) => {
      const { data } = await admin.from("user_roles").select("id").eq("user_id", user.id).eq("role", role).maybeSingle();
      return !!data;
    };

    // ---------- CREATE ----------
    if (action === "create") {
      const items = Array.isArray(body.items) ? body.items.slice(0, 20) : [];
      const fulfillment = body.fulfillment === "pickup" ? "pickup" : "delivery";
      const phone = String(body.phone || "").replace(/\D/g, "");
      if (!items.length) return json({ error: "Select at least one product" }, 400);
      if (!/^\d{10}$/.test(phone)) return json({ error: "Enter a valid 10-digit phone number" }, 400);

      const settings = await getSettings(admin);
      const today = istNow().getUTCDay();
      if (!settings.booking_days.includes(today)) return json({ error: "Chicken booking is closed today. Please book on an allowed booking day." }, 400);

      const ids = items.map((i: any) => String(i.productId));
      const { data: prods } = await admin.from("chicken_products").select("*").in("id", ids);
      let total = 0;
      const lines: any[] = [];
      for (const it of items) {
        const p = prods?.find((x: any) => x.id === it.productId);
        const qty = Math.floor(Number(it.quantity));
        if (!p || !p.active || !p.available || p.archived) return json({ error: "A selected product is no longer available" }, 400);
        if (!(qty >= 1 && qty <= 50)) return json({ error: "Invalid quantity" }, 400);
        const unit = Number(p.offer_price && p.offer_price > 0 ? p.offer_price : p.price);
        total += unit * qty;
        lines.push({ name: `Chicken - ${p.name}${p.weight ? ` (${p.weight})` : ""}`, productId: p.id, quantity: qty, price: unit, weight: p.weight, isOneTime: true });
      }
      total = Math.round(total * 100) / 100;

      let community = "", address = "", centerId: string | null = null;
      if (fulfillment === "pickup") {
        const { data: c } = await admin.from("chicken_pickup_centers").select("*").eq("id", String(body.pickupCenterId || "")).maybeSingle();
        if (!c || !c.active) return json({ error: "Selected pickup center is unavailable" }, 400);
        centerId = c.id; community = "Pickup: " + c.name; address = c.address || c.name;
      } else {
        if (settings.delivery_enabled === false) return json({ error: "Chicken delivery is not available right now" }, 400);
        community = String(body.community || "").slice(0, 200);
        address = String(body.address || "").slice(0, 500);
        if (!community || !address) return json({ error: "Select a delivery address" }, 400);
      }

      const { data: profile } = await admin.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      const { data: order, error } = await admin.from("orders").insert({
        user_id: user.id, business: "chicken", fulfillment_type: fulfillment, pickup_center_id: centerId,
        community, address, phone, customer_name: profile?.full_name || user.email?.split("@")[0] || "Customer",
        items: lines, total_amount: total, payment_status: "pending", order_status: "pending",
        delivery_slot: fulfillment === "pickup" ? "Pickup" : "Weekly chicken delivery",
      }).select().single();
      if (error) throw error;

      const kid = Deno.env.get("RAZORPAY_KEY_ID")!, ks = Deno.env.get("RAZORPAY_KEY_SECRET")!;
      const r = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Basic ${btoa(`${kid}:${ks}`)}` },
        body: JSON.stringify({ amount: Math.round(total * 100), currency: "INR", receipt: order.id }),
      });
      const rz = await r.json();
      if (!r.ok) return json({ error: rz?.error?.description || "Payment could not be started" }, 502);
      return json({ orderId: order.id, razorpayOrderId: rz.id, amount: rz.amount, currency: rz.currency, keyId: kid, total });
    }

    // ---------- CONFIRM (after payment) ----------
    if (action === "confirm") {
      const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
      const expected = await hmacHex(Deno.env.get("RAZORPAY_KEY_SECRET")!, `${razorpay_order_id}|${razorpay_payment_id}`);
      if (expected !== razorpay_signature) return json({ error: "Payment verification failed" }, 400);
      const { data: order } = await admin.from("orders").select("*").eq("id", orderId).eq("user_id", user.id).maybeSingle();
      if (!order || order.business !== "chicken") return json({ error: "Order not found" }, 404);

      if (order.payment_status !== "completed") {
        await admin.from("orders").update({ payment_status: "completed", order_status: "confirmed", payment_id: razorpay_payment_id }).eq("id", order.id);
      }
      let pickup: any = null;
      if (order.fulfillment_type === "pickup" && order.pickup_center_id) {
        const { data: existing } = await admin.from("chicken_pickup_verifications").select("*").eq("order_id", order.id).maybeSingle();
        pickup = existing;
        if (!pickup) {
          const settings = await getSettings(admin);
          for (let i = 0; i < 5 && !pickup; i++) {
            const { data, error } = await admin.from("chicken_pickup_verifications").insert({
              order_id: order.id, customer_id: user.id, pickup_center_id: order.pickup_center_id,
              pickup_code: genCode(), expires_at: pickupDeadline(settings).toISOString(),
            }).select().single();
            if (!error) pickup = data;
          }
        }
      }
      // Admin WhatsApp alert (best effort, reuses existing function)
      try {
        await admin.functions.invoke("twilio-whatsapp-order", {
          body: { orderId: order.id, customerName: `[CHICKEN] ${order.customer_name}`, phone: order.phone, community: order.community, address: order.address, items: order.items, totalAmount: order.total_amount, deliverySlot: order.delivery_slot },
        });
      } catch (_) { /* ignore */ }
      return json({ ok: true, pickup });
    }

    // ---------- STAFF: VERIFY / HANDOVER ----------
    if (action === "verify" || action === "handover") {
      const isAdmin = await hasRole("admin");
      const isStaff = await hasRole("chicken_staff");
      if (!isAdmin && !isStaff) return json({ error: "Not authorized" }, 403);
      const code = String(body.code || "").trim().toUpperCase();
      if (!/^CHKN-[A-Z0-9]{6}$/.test(code)) return json({ result: "INVALID" });

      let staffCenter: string | null = null;
      if (!isAdmin) {
        const { data: sc } = await admin.from("staff_centers").select("pickup_center_id").eq("user_id", user.id).maybeSingle();
        staffCenter = sc?.pickup_center_id || null;
        if (!staffCenter) return json({ error: "No pickup center assigned to your account" }, 403);
      }
      const selectedCenter = isAdmin ? (body.centerId ? String(body.centerId) : null) : staffCenter;

      const { data: v } = await admin.from("chicken_pickup_verifications").select("*").eq("pickup_code", code).maybeSingle();
      if (!v) return json({ result: "INVALID" });
      const { data: order } = await admin.from("orders").select("*").eq("id", v.order_id).maybeSingle();
      if (!order || order.business !== "chicken" || order.fulfillment_type !== "pickup" || order.payment_status !== "completed") return json({ result: "INVALID" });
      const { data: center } = await admin.from("chicken_pickup_centers").select("id,name").eq("id", v.pickup_center_id).maybeSingle();

      if (selectedCenter && selectedCenter !== v.pickup_center_id) return json({ result: "WRONG_CENTER", correctCenter: center?.name || "" });
      if (v.pickup_status === "HANDED_OVER") return json({ result: "ALREADY_COLLECTED" });
      if (v.pickup_status === "CANCELLED") return json({ result: "INVALID" });
      if (v.pickup_status === "EXPIRED" || (v.expires_at && new Date(v.expires_at) < new Date())) {
        if (v.pickup_status !== "EXPIRED") await admin.from("chicken_pickup_verifications").update({ pickup_status: "EXPIRED" }).eq("id", v.id);
        return json({ result: "EXPIRED" });
      }

      const now = new Date().toISOString();
      if (action === "verify") {
        await admin.from("chicken_pickup_verifications").update({ pickup_status: "VERIFIED", verified_at: now, verified_by: user.id, verification_center_id: selectedCenter || v.pickup_center_id }).eq("id", v.id);
      } else {
        if (v.pickup_status !== "VERIFIED") return json({ error: "Verify the code before confirming handover" }, 400);
        await admin.from("chicken_pickup_verifications").update({ pickup_status: "HANDED_OVER", handed_over_at: now, handed_over_by: user.id }).eq("id", v.id);
        await admin.from("orders").update({ order_status: "delivered" }).eq("id", order.id);
        await admin.from("admin_audit_log").insert({ actor_id: user.id, entity: "chicken_pickup", entity_id: v.id, action: "handover", details: { code, center: v.pickup_center_id } });
      }
      return json({
        result: action === "verify" ? "VERIFIED" : "HANDED_OVER",
        details: { customerName: order.customer_name, orderId: order.id, items: order.items, center: center?.name, code },
      });
    }

    // ---------- EXPIRE (admin) ----------
    if (action === "expire") {
      if (!(await hasRole("admin"))) return json({ error: "Not authorized" }, 403);
      const { data } = await admin.from("chicken_pickup_verifications").update({ pickup_status: "EXPIRED" })
        .lt("expires_at", new Date().toISOString()).in("pickup_status", ["PENDING_PICKUP", "READY_FOR_PICKUP", "VERIFIED"]).select("id");
      return json({ expired: data?.length || 0 });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e: any) {
    console.error("chicken-order error", e);
    return json({ error: e?.message || "Something went wrong" }, 500);
  }
});

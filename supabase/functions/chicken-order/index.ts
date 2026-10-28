import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { chickenBookingOpen, chickenSupplyDeadline, canManageChicken } from "../_shared/chickenSchedule.ts";
import { chickenCouponDiscount, couponPhoneStatus } from "../_shared/chickenCoupon.ts";
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const IST_OFFSET_MS = 330 * 60 * 1000;
const istNow = () => new Date(Date.now() + IST_OFFSET_MS); // use getUTC* for IST fields

interface PickupSettings {
  booking_days: number[]; pickup_day: number; pickup_start_time: string;
    pickup_end_time: string; cutoff_time: string; refund_policy: string; delivery_enabled?: boolean; sunday_evening_start?: string;
}

async function getSettings(sb: any): Promise<PickupSettings> {
  const { data } = await sb.from("admin_settings").select("value").eq("key", "chicken_pickup_settings").maybeSingle();
  const d = { booking_days: [1, 2, 3, 4, 5, 6], pickup_day: 0, pickup_start_time: "06:00", pickup_end_time: "10:00", cutoff_time: "10:00", refund_policy: "" };
  try { return { ...d, ...(data?.value ? JSON.parse(data.value) : {}) }; } catch { return d; }
}

/** Next pickup-day at cutoff (IST) as a UTC Date. */
function pickupDeadline(s: PickupSettings): Date {
  return chickenSupplyDeadline(s);
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
    let action = String(body.action || "");

    const hasRole = async (role: string) => {
      const { data } = await admin.from("user_roles").select("id").eq("user_id", user.id).eq("role", role).maybeSingle();
      return !!data;
    };

    if (action === "outlet-list" || action === "outlet-done") {
      const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id);
      if (!canManageChicken((roles || []).map((r: any) => r.role))) return json({ error: "Admin or merchant access required" }, 403);
      if (action === "outlet-done") {
        const parsed = z.object({ orderId: z.string().uuid(), outletId: z.string().uuid() }).safeParse(body);
        if (!parsed.success) return json({ error: "Select a valid order and outlet" }, 400);
        const caller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY") || "", { global: { headers: { Authorization: authHeader } } });
        const { data, error } = await caller.rpc("complete_chicken_outlet_order", { p_order_id: parsed.data.orderId, p_outlet_id: parsed.data.outletId });
        if (error) return json({ error: error.message }, 400);
        return json(data);
      }
      const parsed = z.object({ week: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), outletId: z.string().uuid().optional() }).safeParse(body);
      if (!parsed.success) return json({ error: "Select a valid supply date and outlet" }, 400);
      const start = new Date(`${parsed.data.week}T00:00:00+05:30`);
      if (!Number.isFinite(start.getTime())) return json({ error: "Invalid supply date" }, 400);
      const end = new Date(start.getTime() + 86400000);
      const settings = await getSettings(admin);
      const { data: centers, error: centerError } = await admin.from("chicken_pickup_centers").select("id,name,active").order("display_order");
      if (centerError) throw centerError;
      const all: any[] = [];
      for (let from = 0; ; from += 500) {
        let query = admin.from("orders").select("id,customer_name,phone,items,total_amount,order_status,pickup_center_id,chicken_supply_at,created_at").eq("business", "chicken").eq("fulfillment_type", "pickup").eq("payment_status", "completed")
          .or(`and(chicken_supply_at.gte.${start.toISOString()},chicken_supply_at.lt.${end.toISOString()}),and(chicken_supply_at.is.null,created_at.gte.${new Date(start.getTime()-7*86400000).toISOString()},created_at.lt.${end.toISOString()})`).order("created_at").order("id").range(from, from + 499);
        if (parsed.data.outletId) query = query.eq("pickup_center_id", parsed.data.outletId);
        const { data, error } = await query;
        if (error) throw error;
        all.push(...(data || []));
        if ((data || []).length < 500) break;
      }
      const orders = all.filter(o => {
        const supply = o.chicken_supply_at ? new Date(o.chicken_supply_at) : chickenSupplyDeadline(settings, new Date(o.created_at));
        return supply >= start && supply < end;
      });
      const pickups: any[] = [];
      for (let i = 0; i < orders.length; i += 100) {
        const { data, error } = await admin.from("chicken_pickup_verifications").select("order_id,pickup_code,pickup_status,handed_over_at,expires_at").in("order_id", orders.slice(i,i+100).map(o => o.id));
        if (error) throw error;
        pickups.push(...(data || []));
      }
      return json({ centers: centers || [], orders: orders.map(o => ({ ...o, pickup: pickups.find(p => p.order_id === o.id) || null })) });
    }

    // ---------- CREATE ----------
    if (action === "create" || action === "quote") {
      const parsed = z.object({ items: z.array(z.object({ productId: z.string().uuid(), quantity: z.number().int().min(1).max(50) })).min(1).max(20), phone: z.string().regex(/^\d{10}$/), customerName: z.string().trim().min(2).max(100), couponCode: z.string().trim().max(80).optional(), fulfillment: z.enum(['pickup','delivery']).optional() }).safeParse(body);
      if (!parsed.success) {
        const field = parsed.error.issues[0]?.path[0];
        const error = field === 'phone' ? 'Enter a valid 10-digit phone number' : field === 'customerName' ? 'Enter your full name (2–100 characters)' : field === 'items' ? 'Select a product with a valid quantity' : field === 'couponCode' ? 'Enter a valid coupon code' : 'Select delivery or pickup';
        return json({error,field},400);
      }
      const items = parsed.data.items;
      if (new Set(items.map(i => i.productId)).size !== items.length) return json({error:'Duplicate product selection'},400);
      const fulfillment = body.fulfillment === "pickup" ? "pickup" : "delivery";
      // Always use the signed-in account's verified phone — never a client-typed number —
      // so coupons can't be claimed with invented numbers.
      const { data: profile } = await admin.from("profiles").select("phone").eq("id", user.id).maybeSingle();
      const phone = String(profile?.phone || "").replace(/\D/g, "").slice(-10);
      if (!items.length) return json({ error: "Select at least one product" }, 400);
      if (!/^\d{10}$/.test(phone)) return json({ error: "Your account needs a valid 10-digit phone number. Update it in your profile and try again." }, 400);

      const settings = await getSettings(admin);
      if (!chickenBookingOpen(settings)) return json({ error: "Chicken booking is closed. Sunday evening bookings open at " + (settings.sunday_evening_start || "18:00") + " IST for the following week." }, 400);

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

      let discount = 0;
      let offer: any = null;
      const couponCode = (parsed.data.couponCode || '').toUpperCase();
      if (couponCode) {
        const {data: offers, error: offerError} = await admin.from('offers').select('*').eq('is_active',true).in('business',['chicken','all']).ilike('code',couponCode);
        if (offerError) throw offerError;
        offer = offers?.find((o: any) => String(o.code).toUpperCase() === couponCode && (!o.valid_from || new Date(o.valid_from).getTime() <= Date.now()) && (!o.valid_until || new Date(o.valid_until).getTime() >= Date.now()));
        if (!offer) return json({error:'Coupon is invalid or expired'},400);
        // One coupon per account AND per phone number — check both so neither can be reused.
        const {data: redemption, error: redemptionError} = await admin.from('chicken_coupon_redemptions').select('user_id,order_id').eq('phone',phone).maybeSingle();
        if (redemptionError) throw redemptionError;
        const {data: accountRedemption, error: accountRedemptionError} = await admin.from('chicken_coupon_redemptions').select('user_id,order_id').eq('user_id',user.id).maybeSingle();
        if (accountRedemptionError) throw accountRedemptionError;
        const priorRedemption = redemption || accountRedemption;
        if (priorRedemption) {
          const {data: prior} = await admin.from('orders').select('payment_status').eq('id',priorRedemption.order_id).maybeSingle();
          const paid = prior?.payment_status === 'completed';
          if (accountRedemption && paid) return json({error:'This account has already used the chicken coupon'},400);
          if (redemption && paid && redemption.user_id !== user.id) return json({error:'This phone number has already used the chicken coupon'},400);
          const status = couponPhoneStatus(priorRedemption.user_id,user.id,paid);
          if (status !== 'resume') return json({error: status === 'used' ? 'This phone number has already used the chicken coupon' : 'This phone number already has a coupon order in progress'},400);
        }
        try {
          discount = chickenCouponDiscount(lines,Number(offer.discount_percentage || 0),offer.product_id);
        } catch (error) {
          return json({error: error instanceof Error ? error.message : 'This coupon does not apply to the selected product', field: 'couponCode'},400);
        }
        if (discount <= 0) return json({error:'This coupon does not apply to the selected products'},400);
      }
      const subtotal = total;
      total = Math.round((subtotal-discount)*100)/100;
      if (action === 'quote') return json({subtotal,discount,total,couponCode});

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

      const { data: newOrder, error } = await admin.from("orders").insert({
        user_id: user.id, business: "chicken", fulfillment_type: fulfillment, pickup_center_id: centerId,
        community, address, phone, customer_name: parsed.data.customerName,
        items: lines, total_amount: total, payment_status: "pending", order_status: "pending",
        delivery_slot: fulfillment === "pickup" ? "Pickup" : "Weekly chicken delivery",
        chicken_supply_at: pickupDeadline(settings).toISOString(),
      }).select().single();
      if (error) throw error;
      let order = newOrder;
      if (offer) {
        const {data: reserved,error: reserveError} = await admin.rpc('reserve_chicken_coupon',{p_phone:phone,p_offer_id:offer.id,p_order_id:order.id,p_user_id:user.id,p_discount:discount});
        if (reserveError) throw reserveError;
        if (reserved?.error || reserved?.existingOrderId) {
          await admin.from('orders').update({order_status:'cancelled',payment_status:'failed'}).eq('id',order.id);
          if (reserved?.error) return json({error:reserved.error},400);
          const {data: existing,error: existingError} = await admin.from('orders').select('*').eq('id',reserved.existingOrderId).maybeSingle();
          if (existingError) throw existingError;
          if (!existing || existing.user_id !== user.id) return json({error:'This phone number already has a coupon order in progress on another account', field:'couponCode'},400);
          const sameCheckout = JSON.stringify(existing.items) === JSON.stringify(lines) && existing.pickup_center_id === centerId && Number(existing.total_amount) === total && existing.customer_name === parsed.data.customerName;
          if (sameCheckout) {
            order = existing;
          } else {
            // Customer changed the cart: release the unpaid earlier checkout and move the coupon to this order.
            let stillPayable = existing.payment_status === 'completed';
            if (!stillPayable && existing.payment_id?.startsWith('order_')) {
              const auth = btoa(`${Deno.env.get("RAZORPAY_KEY_ID")}:${Deno.env.get("RAZORPAY_KEY_SECRET")}`);
              const rz = await fetch(`https://api.razorpay.com/v1/orders/${existing.payment_id}`,{headers:{Authorization:`Basic ${auth}`}});
              const rzOrder = rz.ok ? await rz.json() : null;
              stillPayable = !rzOrder || rzOrder.status === 'paid' || Number(rzOrder.amount_paid || 0) > 0;
            }
            if (stillPayable) return json({error:'Your earlier coupon payment is still being processed. Please wait a minute and check your Orders.'},400);
            const {error: moveError} = await admin.from('chicken_coupon_redemptions').update({order_id:newOrder.id,discount_amount:discount,razorpay_order_id:null}).eq('order_id',existing.id);
            if (moveError) throw moveError;
            await admin.from('orders').update({order_status:'cancelled',payment_status:'failed'}).eq('id',existing.id).neq('payment_status','completed');
            const {data: revived,error: reviveError} = await admin.from('orders').update({order_status:'pending',payment_status:'pending'}).eq('id',newOrder.id).select().maybeSingle();
            if (reviveError) throw reviveError;
            if (!revived) return json({error:'Could not start checkout. Please try again.'},400);
            order = revived;
          }
        }
      }

      const kid = Deno.env.get("RAZORPAY_KEY_ID")!, ks = Deno.env.get("RAZORPAY_KEY_SECRET")!;
      if (total === 0 && offer) {
        body.orderId = order.id;
        action = 'confirm';
      } else {
      if (order.payment_id?.startsWith('order_')) return json({orderId:order.id,razorpayOrderId:order.payment_id,amount:Math.round(total*100),currency:'INR',keyId:kid,total});
      const r = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Basic ${btoa(`${kid}:${ks}`)}` },
        body: JSON.stringify({ amount: Math.round(total * 100), currency: "INR", receipt: order.id }),
      });
      const rz = await r.json();
      if (!r.ok) return json({ error: rz?.error?.description || "Payment could not be started" }, 502);
      const {error: saveError} = await admin.from('orders').update({payment_id:rz.id}).eq('id',order.id).eq('payment_status','pending');
      if (saveError) throw saveError;
      return json({ orderId: order.id, razorpayOrderId: rz.id, amount: rz.amount, currency: rz.currency, keyId: kid, total });
      }
    }

    // ---------- CONFIRM (after payment) ----------
    if (action === "confirm") {
      const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
      const { data: order } = await admin.from("orders").select("*").eq("id", orderId).eq("user_id", user.id).maybeSingle();
      if (!order || order.business !== "chicken") return json({ error: "Order not found" }, 404);
      if (Number(order.total_amount) === 0) {
        const {data: reservation} = await admin.from('chicken_coupon_redemptions').select('order_id').eq('order_id',order.id).eq('user_id',user.id).maybeSingle();
        if (!reservation) return json({error:'Free order coupon could not be verified'},400);
      } else if (order.payment_status !== 'completed') {
        const expected = await hmacHex(Deno.env.get('RAZORPAY_KEY_SECRET')!,`${razorpay_order_id}|${razorpay_payment_id}`);
        if (expected !== razorpay_signature || order.payment_id !== razorpay_order_id) return json({error:'Payment verification failed'},400);
        const paymentResponse = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(razorpay_payment_id)}`,{headers:{Authorization:`Basic ${btoa(`${Deno.env.get('RAZORPAY_KEY_ID')}:${Deno.env.get('RAZORPAY_KEY_SECRET')}`)}`}});
        const payment = await paymentResponse.json();
        if (!paymentResponse.ok || payment.order_id !== razorpay_order_id || payment.amount !== Math.round(Number(order.total_amount)*100) || payment.currency !== 'INR' || payment.status !== 'captured') return json({error:'Payment has not been captured for this order yet'},400);
      }

      if (order.payment_status !== "completed") {
        const {error: completeError} = await admin.from("orders").update({ payment_status: "completed", order_status: "confirmed", payment_id: razorpay_payment_id || `coupon:${order.id}` }).eq("id", order.id);
        if (completeError) throw completeError;
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
              pickup_code: genCode(), expires_at: order.chicken_supply_at || chickenSupplyDeadline(settings, new Date(order.created_at)).toISOString(),
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
      return json({ ok: true, pickup, orderId:order.id, freeOrder:Number(order.total_amount) === 0 });
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

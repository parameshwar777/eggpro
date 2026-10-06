import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

function normalizePhone(input: string): string {
  let p = String(input || "").trim().replace(/[\s\-()]/g, "");
  if (!p) return "";
  if (!p.startsWith("+")) {
    const digits = p.replace(/\D/g, "");
    if (digits.length === 10) p = "+91" + digits;
    else p = "+" + digits;
  }
  return p;
}

interface WhatsAppMessagePayload {
  To: string;
  From: string;
  Body?: string;
  ContentSid?: string;
  ContentVariables?: string;
}

async function sendWhatsAppMessage(toPhone: string, templateSid: string, variables: Record<string, string>) {
  const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const FROM = Deno.env.get("TWILIO_WHATSAPP_FROM");

  if (!TWILIO_API_KEY || !LOVABLE_API_KEY || !FROM) {
    throw new Error("Twilio WhatsApp not configured");
  }

  const payload: WhatsAppMessagePayload = {
    To: `whatsapp:${toPhone}`,
    From: `whatsapp:${FROM}`,
    ContentSid: templateSid,
    ContentVariables: JSON.stringify(variables),
  };

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined) params.append(key, value);
  }

  const res = await fetch("https://connector-gateway.lovable.dev/twilio/Messages.json", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": TWILIO_API_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  const responseBody = await res.text();
  if (!res.ok) {
    console.error("Twilio order WA error:", res.status, responseBody);
    throw new Error(`Twilio [${res.status}]: ${responseBody}`);
  }
  const data = JSON.parse(responseBody);
  if (data.error_code || ["failed", "undelivered"].includes(data.status)) {
    throw new Error(`Twilio delivery failed: ${data.error_code || data.status}`);
  }
  console.log("Twilio order WA accepted, sid:", data?.sid, "status:", data?.status);
  return data;
}


serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) throw new Error("Order alerts are not configured");
    const supabase = createClient(url, serviceKey);
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    if (token !== serviceKey) {
      const { data } = await supabase.auth.getUser(token);
      const { data: role } = data.user ? await supabase.from("user_roles").select("id").eq("user_id", data.user.id).eq("role", "admin").maybeSingle() : { data: null };
      if (!role) return new Response(JSON.stringify({ error: "Not authorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const input = await req.json();
    if (typeof input.orderId !== "string" || !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(input.orderId)) {
      return new Response(JSON.stringify({ error: "A valid order ID is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: order, error: orderError } = await supabase.from("orders").select("*").eq("id", input.orderId).maybeSingle();
    if (orderError) throw orderError;
    if (!order || order.payment_status !== "completed") return new Response(JSON.stringify({ error: "Paid order not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const orderId = order.id;
    const { customer_name: customerName, phone, community, address, items, total_amount: totalAmount, delivery_slot: deliverySlot } = order;
    const { data: templateSetting } = await supabase.from("admin_settings").select("value").eq("key", "twilio_order_template_sid").maybeSingle();
    const templateSid = templateSetting?.value;
    if (!templateSid || !/^HX[0-9a-f]{32}$/i.test(templateSid)) throw new Error("Configure an approved WhatsApp order template");
    const approvalResponse = await fetch(`https://connector-gateway.lovable.dev/twilio/content/v1/Content/${templateSid}/ApprovalRequests`, {
      headers: { Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`, "X-Connection-Api-Key": Deno.env.get("TWILIO_API_KEY") || "" },
    });
    const approvalText = await approvalResponse.text();
    if (!approvalResponse.ok) throw new Error(`Twilio [${approvalResponse.status}]: ${approvalText}`);
    const approval = JSON.parse(approvalText);
    if (approval.whatsapp?.status !== "approved") {
      console.warn("Order WhatsApp alert blocked by template review:", approval.whatsapp?.status);
      return new Response(JSON.stringify({ ok: false, sent: 0, error: "WhatsApp order template is awaiting approval", templateStatus: approval.whatsapp?.status }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Collect admin phone numbers
    const recipients = new Set<string>();
    const { data: setting } = await supabase
      .from("admin_settings").select("value").eq("key", "admin_whatsapp").maybeSingle();
    if (setting?.value) {
      String(setting.value)
        .split(/[,;\s]+/)
        .map((p) => p.trim())
        .filter(Boolean)
        .forEach((p) => recipients.add(normalizePhone(p)));
    }

    const { data: adminRoles } = await supabase
      .from("user_roles").select("user_id").eq("role", "admin");
    if (adminRoles?.length) {
      const ids = adminRoles.map((r) => r.user_id);
      const { data: profs } = await supabase
        .from("profiles").select("phone").in("id", ids);
      profs?.forEach((p) => { if (p.phone) recipients.add(normalizePhone(p.phone)); });
    }

    if (recipients.size === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0, note: "No admin phones" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const itemsList = (items || []).map((i: any) => {
      const pack = i.packSize ? ` - ${i.packSize} eggs` : "";
      return `• ${i.name}${pack} × ${i.quantity} = ₹${i.price * i.quantity}`;
    }).join("\n");
    const addressWithSlot = deliverySlot ? `${address}\n*Delivery Slot:* ${deliverySlot}` : address;
    const orderTime = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    // WhatsApp template variables cannot contain newlines or tabs.
    const clean = (value: unknown) => String(value ?? "Not provided").replace(/\s+/g, " ").trim().slice(0, 1000) || "Not provided";
    const variables = { "1": `${order.business === "chicken" ? "CHICKEN" : "EGGS"}-${String(orderId).slice(0, 8)}`, "2": clean(customerName), "3": clean(phone), "4": clean(community), "5": clean(addressWithSlot), "6": clean(itemsList), "7": clean(totalAmount), "8": clean(orderTime) };

    let sent = 0;
    const errors: string[] = [];
    for (const to of recipients) {
       try { await sendWhatsAppMessage(to, templateSid, variables); sent++; }
      catch (e: any) { errors.push(`${to}: ${e.message}`); }
    }


    return new Response(JSON.stringify({ ok: errors.length === 0, accepted: sent, sent, errors, note: "Accepted messages are not confirmed delivered" }), {
      status: errors.length ? 502 : 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("twilio-whatsapp-order error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

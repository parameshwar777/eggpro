import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

async function sendWhatsAppMessage(toPhone: string, body: string, contentVariables?: Record<string, string>) {
  const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const FROM = Deno.env.get("TWILIO_WHATSAPP_FROM");
  const CONTENT_SID = Deno.env.get("TWILIO_WA_ORDER_CONTENT_SID");

  if (!TWILIO_API_KEY || !LOVABLE_API_KEY || !FROM) {
    throw new Error("Twilio WhatsApp not configured");
  }

  const payload: WhatsAppMessagePayload = {
    To: `whatsapp:${toPhone}`,
    From: `whatsapp:${FROM}`,
  };

  if (CONTENT_SID) {
    payload.ContentSid = CONTENT_SID;
    if (contentVariables) {
      payload.ContentVariables = JSON.stringify(contentVariables);
    }
  } else {
    payload.Body = body;
  }

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
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Twilio order WA error:", res.status, data);
    throw new Error(data?.message || `Twilio error ${res.status}`);
  }
  console.log("Twilio order WA sent, sid:", data?.sid, "to:", toPhone);
  return data;
}


serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { orderId, customerName, phone, community, address, items, totalAmount } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Collect admin phone numbers
    const recipients = new Set<string>();
    const { data: setting } = await supabase
      .from("admin_settings").select("value").eq("key", "admin_whatsapp").maybeSingle();
    if (setting?.value) recipients.add(normalizePhone(setting.value));

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

    const itemsList = (items || []).map((i: any) =>
      `• ${i.name} x${i.quantity} = ₹${i.price * i.quantity}`).join("\n");
    const body = `🥚 *New EggPro Order!*\n\n*Order:* ${String(orderId).slice(0, 8)}\n*Customer:* ${customerName}\n*Phone:* ${phone}\n*Community:* ${community}\n*Address:* ${address}\n\n*Items:*\n${itemsList}\n\n*Total:* ₹${totalAmount}\n\n_${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}_`;

    const contentVariables: Record<string, string> = {
      "1": String(orderId).slice(0, 8),
      "2": customerName || "Customer",
      "3": phone || "",
      "4": community || "",
      "5": address || "",
      "6": itemsList || "No items",
      "7": String(totalAmount || 0),
      "8": new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    };

    let sent = 0;
    const errors: string[] = [];
    for (const to of recipients) {
      try { await sendWhatsAppMessage(to, body, contentVariables); sent++; }
      catch (e: any) { errors.push(`${to}: ${e.message}`); }
    }


    return new Response(JSON.stringify({ ok: true, sent, errors }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("twilio-whatsapp-order error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

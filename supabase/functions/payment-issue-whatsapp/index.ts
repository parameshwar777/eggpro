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

async function sendWhatsAppMessage(toPhone: string, body: string) {
  const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const FROM = Deno.env.get("TWILIO_WHATSAPP_FROM");
  if (!TWILIO_API_KEY || !LOVABLE_API_KEY || !FROM) {
    throw new Error("Twilio WhatsApp not configured");
  }
  const params = new URLSearchParams({
    To: `whatsapp:${toPhone}`,
    From: `whatsapp:${FROM}`,
    Body: body,
  });
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
    console.error("Twilio ticket WA error:", res.status, data);
    throw new Error(data?.message || `Twilio error ${res.status}`);
  }
  return data;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { ticketNumber, customerName, phone, email, amount, transactionId, description, paymentScreenshotUrl, orderScreenshotUrl } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const recipients = new Set<string>();
    const { data: setting } = await supabase
      .from("admin_settings").select("value").eq("key", "admin_whatsapp").maybeSingle();
    if (setting?.value) {
      String(setting.value).split(/[,;\s]+/).map((p) => p.trim()).filter(Boolean)
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

    const lines = [
      `🎫 *New Payment Issue Ticket*`,
      ``,
      `*Ticket:* ${ticketNumber || "—"}`,
      `*Customer:* ${customerName || "—"}`,
      `*Phone:* ${phone || "—"}`,
      email ? `*Email:* ${email}` : null,
      amount != null ? `*Amount:* ₹${amount}` : null,
      transactionId ? `*Txn ID:* ${transactionId}` : null,
      description ? `*Issue:* ${description}` : null,
      paymentScreenshotUrl ? `*Payment Screenshot:* ${paymentScreenshotUrl}` : null,
      orderScreenshotUrl ? `*Order Screenshot:* ${orderScreenshotUrl}` : null,
      ``,
      `_${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}_`,
    ].filter(Boolean);
    const body = lines.join("\n");

    let sent = 0;
    const errors: string[] = [];
    for (const to of recipients) {
      try { await sendWhatsAppMessage(to, body); sent++; }
      catch (e: any) { errors.push(`${to}: ${e.message}`); }
    }

    return new Response(JSON.stringify({ ok: true, sent, errors }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("payment-issue-whatsapp error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

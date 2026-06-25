import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function hashOTP(otp: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Normalize phone to E.164 with leading +
function normalizePhone(input: string): string {
  let p = String(input || "").trim().replace(/[\s\-()]/g, "");
  if (!p) return "";
  if (!p.startsWith("+")) {
    // If 10 digits, assume India
    const digits = p.replace(/\D/g, "");
    if (digits.length === 10) p = "+91" + digits;
    else p = "+" + digits;
  }
  return p;
}

// Synthetic email used to back the auth.users record for a phone-only signup
function phoneToEmail(phone: string): string {
  return `${phone.replace(/\D/g, "")}@phone.eggpro.app`;
}

async function sendWhatsAppOtp(toPhone: string, code: string) {
  const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const FROM = Deno.env.get("TWILIO_WHATSAPP_FROM");
  const CONTENT_SID = Deno.env.get("TWILIO_WA_OTP_CONTENT_SID");

  if (!TWILIO_API_KEY || !LOVABLE_API_KEY) throw new Error("Twilio not configured");
  if (!FROM) throw new Error("TWILIO_WHATSAPP_FROM not configured");
  if (!CONTENT_SID) throw new Error("TWILIO_WA_OTP_CONTENT_SID not configured");

  const body = new URLSearchParams({
    To: `whatsapp:${toPhone}`,
    From: `whatsapp:${FROM}`,
    ContentSid: CONTENT_SID,
    ContentVariables: JSON.stringify({ "1": code }),
  });

  const res = await fetch("https://connector-gateway.lovable.dev/twilio/Messages.json", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": TWILIO_API_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Twilio send error:", res.status, data);
    throw new Error(data?.message || `Twilio error ${res.status}`);
  }
  console.log("WhatsApp OTP sent, sid:", data?.sid);
  return data;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, phone: rawPhone, otp, fullName, password, newPassword } = await req.json();
    const phone = normalizePhone(rawPhone);
    if (!phone) {
      return new Response(JSON.stringify({ success: false, error: "Phone is required" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // ---- SEND OTP (signup or login) ----
    if (action === "send" || action === "reset-send") {
      const code = generateOTP();
      const otp_hash = await hashOTP(code);
      const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      const { error: upErr } = await supabase
        .from("phone_otps")
        .upsert({ phone, otp_hash, expires_at }, { onConflict: "phone" });
      if (upErr) throw upErr;

      try {
        await sendWhatsAppOtp(phone, code);
      } catch (e: any) {
        await supabase.from("phone_otps").delete().eq("phone", phone);
        return new Response(
          JSON.stringify({ success: false, error: e?.message || "Failed to send WhatsApp OTP" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      return new Response(JSON.stringify({ success: true, message: "OTP sent on WhatsApp" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // ---- VERIFY OTP ----
    if (action === "verify" || action === "reset-verify") {
      if (!otp) {
        return new Response(JSON.stringify({ success: false, error: "OTP is required" }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const { data: stored } = await supabase
        .from("phone_otps")
        .select("*")
        .eq("phone", phone)
        .maybeSingle();

      if (!stored) {
        return new Response(
          JSON.stringify({ success: false, error: "OTP not found. Please request a new one." }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (new Date(stored.expires_at) < new Date()) {
        await supabase.from("phone_otps").delete().eq("phone", phone);
        return new Response(
          JSON.stringify({ success: false, error: "OTP expired. Please request a new one." }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const otp_hash = await hashOTP(otp);
      if (stored.otp_hash !== otp_hash) {
        return new Response(JSON.stringify({ success: false, error: "Invalid OTP" }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      await supabase.from("phone_otps").delete().eq("phone", phone);

      const email = phoneToEmail(phone);

      // Find existing user by phone or synthetic email
      const { data: existing } = await supabase.auth.admin.listUsers();
      const existingUser = existing?.users?.find(
        (u: any) => u.email?.toLowerCase() === email || u.phone === phone.replace(/^\+/, "")
      );

      // RESET FLOW: update password for existing user
      if (action === "reset-verify") {
        if (!existingUser) {
          return new Response(
            JSON.stringify({ success: false, error: "No account found with this phone" }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
        if (!newPassword || String(newPassword).length < 6) {
          return new Response(
            JSON.stringify({ success: false, error: "Password must be at least 6 characters" }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
        const { error: updErr } = await supabase.auth.admin.updateUserById(existingUser.id, {
          password: String(newPassword),
        });
        if (updErr) throw updErr;
        return new Response(
          JSON.stringify({ success: true, email, message: "Password updated" }),
          { headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // SIGNUP/LOGIN FLOW
      if (existingUser) {
        // existing account – nothing to create. Frontend will sign in using password if provided.
        return new Response(
          JSON.stringify({ success: true, email, userId: existingUser.id, isNewUser: false }),
          { headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (!password || String(password).length < 6) {
        return new Response(
          JSON.stringify({ success: false, error: "Password required (min 6 chars) to create account" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email,
        password: String(password),
        email_confirm: true,
        phone: phone.replace(/^\+/, ""),
        phone_confirm: true,
        user_metadata: { full_name: fullName || "", phone },
      });
      if (createErr) throw createErr;

      // Ensure profile has phone
      try {
        await supabase.from("profiles").update({ phone }).eq("id", newUser.user!.id);
      } catch (_) {}

      return new Response(
        JSON.stringify({ success: true, email, userId: newUser.user?.id, isNewUser: true }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(JSON.stringify({ success: false, error: "Invalid action" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e: any) {
    console.error("whatsapp-otp error:", e);
    return new Response(JSON.stringify({ success: false, error: e?.message || "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

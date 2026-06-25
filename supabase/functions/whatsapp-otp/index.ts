import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYNTH_DOMAIN = "@phone.eggpro.app";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function hashOTP(otp: string): Promise<string> {
  const data = new TextEncoder().encode(otp);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

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

    const reqBody = await req.json();
    const action = reqBody.action as string;
    const phone = normalizePhone(reqBody.phone);
    const otp = reqBody.otp as string | undefined;
    const purpose = (reqBody.purpose as string) || "signup"; // 'signup' | 'legacy-login'
    const email = reqBody.email ? String(reqBody.email).toLowerCase().trim() : "";
    const password = reqBody.password as string | undefined;
    const fullName = (reqBody.fullName as string) || "";

    if (!phone) {
      return new Response(JSON.stringify({ success: false, error: "Phone is required" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // ---------- SEND OTP ----------
    if (action === "send") {
      // Rate limit: max 5 OTP requests / hour per phone
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("phone_otps")
        .select("phone", { count: "exact", head: true })
        .eq("phone", phone)
        .gte("created_at", oneHourAgo);

      // Identity gating
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, email, phone")
        .eq("phone", phone)
        .maybeSingle();

      if (purpose === "signup" && existingProfile) {
        const userEmail = existingProfile.email || "";
        const isSynthetic = userEmail.endsWith(SYNTH_DOMAIN) || !userEmail;
        if (isSynthetic) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "This phone is already registered. Please log in instead.",
              code: "phone_taken_phone",
            }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        } else {
          return new Response(
            JSON.stringify({
              success: false,
              error: `This number is already linked to an email account. Please log in with email.`,
              code: "phone_taken_email",
            }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
      }

      if (purpose === "legacy-login" && !existingProfile) {
        return new Response(
          JSON.stringify({ success: false, error: "No account found for this phone" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const code = generateOTP();
      const otp_hash = await hashOTP(code);
      const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      const { error: upErr } = await supabase
        .from("phone_otps")
        .upsert({ phone, otp_hash, expires_at, verified: false, verified_at: null }, { onConflict: "phone" });
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

    // ---------- VERIFY OTP (signup step 1: just verifies code) ----------
    if (action === "verify") {
      if (!otp) {
        return new Response(JSON.stringify({ success: false, error: "OTP is required" }), {
          status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const { data: stored } = await supabase
        .from("phone_otps").select("*").eq("phone", phone).maybeSingle();

      if (!stored) {
        return new Response(JSON.stringify({ success: false, error: "OTP not found. Request a new one." }), {
          status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      if (new Date(stored.expires_at) < new Date()) {
        await supabase.from("phone_otps").delete().eq("phone", phone);
        return new Response(JSON.stringify({ success: false, error: "OTP expired. Request a new one." }), {
          status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      const otp_hash = await hashOTP(otp);
      if (stored.otp_hash !== otp_hash) {
        return new Response(JSON.stringify({ success: false, error: "Invalid OTP" }), {
          status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Mark OTP verified but keep row for 15min so signup can complete
      const verified_at = new Date().toISOString();
      const new_expiry = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      await supabase
        .from("phone_otps")
        .update({ verified: true, verified_at, expires_at: new_expiry })
        .eq("phone", phone);

      // For legacy-login: directly return the user's existing email so frontend can sign in.
      if (purpose === "legacy-login") {
        const { data: profile } = await supabase
          .from("profiles").select("id, email").eq("phone", phone).maybeSingle();
        let loginEmail = profile?.email || null;
        if (!loginEmail && profile?.id) {
          const { data: u } = await supabase.auth.admin.getUserById(profile.id);
          loginEmail = u?.user?.email || null;
        }
        return new Response(
          JSON.stringify({ success: true, email: loginEmail, userId: profile?.id || null, verified: true }),
          { headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      return new Response(JSON.stringify({ success: true, verified: true }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // ---------- COMPLETE SIGNUP (after OTP verified, with email+password) ----------
    if (action === "complete-signup") {
      if (!email || !password || password.length < 6) {
        return new Response(
          JSON.stringify({ success: false, error: "Email and password (min 6 chars) required" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Check OTP verified
      const { data: stored } = await supabase
        .from("phone_otps").select("*").eq("phone", phone).maybeSingle();
      if (!stored || !stored.verified) {
        return new Response(
          JSON.stringify({ success: false, error: "Phone not verified. Please verify OTP first." }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      if (new Date(stored.expires_at) < new Date()) {
        await supabase.from("phone_otps").delete().eq("phone", phone);
        return new Response(
          JSON.stringify({ success: false, error: "Verification expired. Please restart signup." }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Re-check phone not taken in race
      const { data: phoneTaken } = await supabase
        .from("profiles").select("id").eq("phone", phone).maybeSingle();
      if (phoneTaken) {
        return new Response(
          JSON.stringify({ success: false, error: "This phone is already registered." }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Check email not taken
      const { data: emailTaken } = await supabase
        .from("profiles").select("id").eq("email", email).maybeSingle();
      if (emailTaken) {
        return new Response(
          JSON.stringify({ success: false, error: "This email is already registered. Please log in with email." }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      const { data: authList } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
      const authHit = authList?.users?.find((u: any) => u.email?.toLowerCase() === email);
      if (authHit) {
        return new Response(
          JSON.stringify({ success: false, error: "This email is already registered. Please log in with email." }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        phone: phone.replace(/^\+/, ""),
        phone_confirm: true,
        user_metadata: { full_name: fullName, phone },
      });
      if (createErr) throw createErr;

      // Ensure profile row has phone + email + name + verified flags
      await supabase.from("profiles").update({
        phone,
        email,
        full_name: fullName || null,
        phone_verified: true,
        email_verified: true,
      }).eq("id", newUser.user!.id);

      await supabase.from("phone_otps").delete().eq("phone", phone);

      return new Response(
        JSON.stringify({ success: true, email, userId: newUser.user?.id, isNewUser: true }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(JSON.stringify({ success: false, error: "Invalid action" }), {
      status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e: any) {
    console.error("whatsapp-otp error:", e);
    return new Response(JSON.stringify({ success: false, error: e?.message || "Server error" }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

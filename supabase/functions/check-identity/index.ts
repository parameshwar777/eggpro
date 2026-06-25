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

function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "";
  const [user, domain] = email.split("@");
  if (user.length <= 2) return user[0] + "***@" + domain;
  return user.slice(0, 2) + "***@" + domain;
}

const SYNTH_DOMAIN = "@phone.eggpro.app";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const phone = body.phone ? normalizePhone(body.phone) : "";
    const email = body.email ? String(body.email).toLowerCase().trim() : "";

    const result: any = {
      success: true,
      phone_status: "free",
      email_status: "free",
      phone_account_kind: null, // 'email' | 'phone' | null
      masked_email: null,
    };

    // Check phone
    if (phone) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, email, phone")
        .eq("phone", phone)
        .maybeSingle();

      if (profile) {
        result.phone_status = "taken";
        const userEmail = profile.email || "";
        const isSynthetic = userEmail.endsWith(SYNTH_DOMAIN) || !userEmail;
        result.phone_account_kind = isSynthetic ? "phone" : "email";
        result.masked_email = userEmail && !isSynthetic ? maskEmail(userEmail) : null;
      }
    }

    // Check email
    if (email) {
      // Use admin listing? Faster: scan profiles by email
      const { data: prof } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      if (prof) {
        result.email_status = "taken";
      } else {
        // also check auth.users directly via admin
        const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
        const hit = list?.users?.find((u: any) => u.email?.toLowerCase() === email);
        if (hit) result.email_status = "taken";
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e: any) {
    console.error("check-identity error", e);
    return new Response(JSON.stringify({ success: false, error: e?.message || "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

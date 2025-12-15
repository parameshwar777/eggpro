import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const otpStore = new Map<string, { otp: string; expires: number; email: string; fullName?: string; password?: string }>();

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const { action, email, otp, fullName, password } = await req.json();
    
    if (action === "send") {
      const generatedOtp = generateOTP();
      const expires = Date.now() + 10 * 60 * 1000;
      
      otpStore.set(email, { otp: generatedOtp, expires, email, fullName, password });
      
      await resend.emails.send({
        from: "EggPro <onboarding@resend.dev>",
        to: [email],
        subject: "Your EggPro Verification Code",
        html: `<div style="font-family:Arial;padding:20px;"><h1 style="color:#FF6B35;">EggPro</h1><p>Your verification code is:</p><div style="background:#FF6B35;color:white;font-size:32px;padding:20px;border-radius:12px;text-align:center;letter-spacing:8px;">${generatedOtp}</div><p style="color:#999;">This code expires in 10 minutes.</p></div>`,
      });
      
      return new Response(JSON.stringify({ success: true, message: "OTP sent" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } 
    
    if (action === "verify") {
      const stored = otpStore.get(email);
      
      if (!stored || Date.now() > stored.expires) {
        otpStore.delete(email);
        return new Response(JSON.stringify({ success: false, error: "OTP expired" }), {
          status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      if (stored.otp !== otp) {
        return new Response(JSON.stringify({ success: false, error: "Invalid OTP" }), {
          status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      const storedData = { ...stored };
      otpStore.delete(email);
      
      const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: storedData.email,
        password: storedData.password,
        email_confirm: true,
        user_metadata: { full_name: storedData.fullName }
      });
      
      if (createError) throw createError;
      
      return new Response(JSON.stringify({ success: true, userId: newUser.user?.id }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

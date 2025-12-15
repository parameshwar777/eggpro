import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Simple hash function for OTP (not cryptographically secure but sufficient for short-lived OTPs)
async function hashOTP(otp: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req: Request) => {
  console.log("Email OTP function called:", req.method);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      throw new Error("Email service not configured");
    }
    
    const resend = new Resend(resendApiKey);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const body = await req.json();
    const { action, email, otp, fullName, password } = body;
    
    console.log("Action:", action, "Email:", email);
    
    if (action === "send") {
      if (!email) {
        return new Response(JSON.stringify({ success: false, error: "Email is required" }), {
          status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      const generatedOtp = generateOTP();
      const otpHash = await hashOTP(generatedOtp);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes
      
      // Store OTP in database (upsert to handle re-sends)
      const { error: dbError } = await supabase
        .from("email_otps")
        .upsert({
          email: email.toLowerCase().trim(),
          otp_hash: otpHash,
          expires_at: expiresAt,
        }, { onConflict: "email" });
      
      if (dbError) {
        console.error("Database error storing OTP:", dbError);
        throw new Error("Failed to store OTP");
      }
      
      console.log("Sending OTP email to:", email);
      
      const emailResult = await resend.emails.send({
        from: "EggPro <onboarding@resend.dev>",
        to: [email],
        subject: "Your EggPro Verification Code",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #FF6B35; font-size: 28px; margin: 0;">EggPro</h1>
              <p style="color: #666; margin-top: 8px;">Fresh Eggs Delivered Daily</p>
            </div>
            <div style="background: linear-gradient(135deg, #FF6B35, #FF8C5A); border-radius: 16px; padding: 32px; text-align: center;">
              <p style="color: white; margin: 0 0 16px 0; font-size: 16px;">Your verification code is:</p>
              <div style="background: white; color: #FF6B35; font-size: 36px; font-weight: bold; padding: 16px 24px; border-radius: 12px; letter-spacing: 8px; display: inline-block;">
                ${generatedOtp}
              </div>
            </div>
            <p style="color: #999; text-align: center; margin-top: 24px; font-size: 14px;">
              This code expires in 10 minutes. Don't share it with anyone.
            </p>
          </div>
        `,
      });
      
      console.log("Email send result:", emailResult);
      
      return new Response(JSON.stringify({ success: true, message: "OTP sent" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } 
    
    if (action === "verify") {
      if (!email || !otp) {
        return new Response(JSON.stringify({ success: false, error: "Email and OTP are required" }), {
          status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      const otpHash = await hashOTP(otp);
      
      // Fetch stored OTP
      const { data: stored, error: fetchError } = await supabase
        .from("email_otps")
        .select("*")
        .eq("email", email.toLowerCase().trim())
        .single();
      
      if (fetchError || !stored) {
        console.error("OTP not found for email:", email);
        return new Response(JSON.stringify({ success: false, error: "OTP not found. Please request a new one." }), {
          status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      // Check expiration
      if (new Date(stored.expires_at) < new Date()) {
        // Clean up expired OTP
        await supabase.from("email_otps").delete().eq("email", email.toLowerCase().trim());
        return new Response(JSON.stringify({ success: false, error: "OTP expired. Please request a new one." }), {
          status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      // Verify OTP hash
      if (stored.otp_hash !== otpHash) {
        console.error("Invalid OTP for email:", email);
        return new Response(JSON.stringify({ success: false, error: "Invalid OTP" }), {
          status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      // OTP is valid - delete it
      await supabase.from("email_otps").delete().eq("email", email.toLowerCase().trim());
      
      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase().trim());
      
      if (existingUser) {
        console.log("User already exists:", email);
        return new Response(JSON.stringify({ 
          success: true, 
          userId: existingUser.id,
          message: "Email verified. User already exists."
        }), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      // Create new user (password should be passed from frontend during signup flow)
      if (!password) {
        return new Response(JSON.stringify({ success: false, error: "Password required for new user" }), {
          status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email.toLowerCase().trim(),
        password: password,
        email_confirm: true,
        user_metadata: { full_name: fullName || "" }
      });
      
      if (createError) {
        console.error("Error creating user:", createError);
        throw createError;
      }
      
      console.log("User created successfully:", newUser.user?.id);
      
      return new Response(JSON.stringify({ success: true, userId: newUser.user?.id }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Email OTP error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

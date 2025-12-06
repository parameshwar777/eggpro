import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory OTP store (for demo - in production use Redis/DB)
const otpStore = new Map<string, { otp: string; expires: number }>();

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, phone, otp } = await req.json();
    
    if (action === "send") {
      // Generate OTP
      const generatedOtp = generateOTP();
      const expires = Date.now() + 5 * 60 * 1000; // 5 minutes
      
      // Store OTP
      otpStore.set(phone, { otp: generatedOtp, expires });
      
      console.log(`OTP generated for ${phone}: ${generatedOtp}`);
      
      // Create WhatsApp message with OTP
      const message = `🥚 *EggPro Verification*\n\nYour OTP is: *${generatedOtp}*\n\nThis code expires in 5 minutes.\n\n_Do not share this code with anyone._`;
      
      // WhatsApp URL to send OTP - user will open WhatsApp to themselves
      // In production, you'd use WhatsApp Business API to send automatically
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: "OTP generated. Please verify via WhatsApp.",
        otp: generatedOtp, // Return OTP for display (since we can't auto-send via WhatsApp without Business API)
        whatsappUrl
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } 
    
    if (action === "verify") {
      const stored = otpStore.get(phone);
      
      if (!stored) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "OTP not found or expired. Please request a new one." 
        }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      if (Date.now() > stored.expires) {
        otpStore.delete(phone);
        return new Response(JSON.stringify({ 
          success: false, 
          error: "OTP expired. Please request a new one." 
        }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      if (stored.otp !== otp) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Invalid OTP. Please try again." 
        }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      // OTP verified - clean up
      otpStore.delete(phone);
      
      // Create or sign in user with Supabase
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Check if user exists with this phone
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("phone", phone)
        .single();
      
      if (existingUser) {
        // User exists - generate a magic link token for them
        const { data: authData, error: authError } = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email: `${phone.replace("+", "")}@phone.eggpro.app`,
        });
        
        if (authError) {
          console.error("Auth error:", authError);
          throw authError;
        }
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: "OTP verified successfully",
          isNewUser: false,
          userId: existingUser.id,
          token: authData?.properties?.hashed_token
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      // New user - create account
      const email = `${phone.replace("+", "").replace(/\D/g, "")}@phone.eggpro.app`;
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        phone,
        email_confirm: true,
        phone_confirm: true,
        user_metadata: { phone }
      });
      
      if (createError) {
        console.error("Create user error:", createError);
        throw createError;
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Account created and verified",
        isNewUser: true,
        userId: newUser.user?.id
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in WhatsApp OTP:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

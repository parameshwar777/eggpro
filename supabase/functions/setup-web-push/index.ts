import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function base64urlEncode(buffer: Uint8Array): string {
  let binary = '';
  for (const byte of buffer) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if keys already exist
    const { data: existing } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "vapid_public_key")
      .single();

    if (existing?.value) {
      return new Response(JSON.stringify({ publicKey: existing.value, message: "VAPID keys already configured" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Generate ECDSA P-256 key pair for VAPID
    const keyPair = await crypto.subtle.generateKey(
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["sign", "verify"]
    );

    const publicKeyRaw = new Uint8Array(await crypto.subtle.exportKey("raw", keyPair.publicKey));
    const privateKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
    const publicKeyB64 = base64urlEncode(publicKeyRaw);

    // Store both keys in admin_settings
    await supabase.from("admin_settings").upsert([
      { key: "vapid_public_key", value: publicKeyB64, updated_at: new Date().toISOString() },
      { key: "vapid_private_key", value: JSON.stringify(privateKeyJwk), updated_at: new Date().toISOString() },
    ], { onConflict: "key" });

    console.log("VAPID keys generated and stored successfully");

    return new Response(JSON.stringify({ publicKey: publicKeyB64, message: "VAPID keys generated!" }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
});

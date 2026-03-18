import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// --- Web Push Crypto Utilities (RFC 8291) ---

function base64urlEncode(buffer: Uint8Array): string {
  let binary = '';
  for (const byte of buffer) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const binary = atob(str);
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const prkKey = await crypto.subtle.importKey("raw", salt, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const prk = new Uint8Array(await crypto.subtle.sign("HMAC", prkKey, ikm));
  const expandKey = await crypto.subtle.importKey("raw", prk, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const infoCounter = new Uint8Array(info.length + 1);
  infoCounter.set(info);
  infoCounter[info.length] = 1;
  const okm = new Uint8Array(await crypto.subtle.sign("HMAC", expandKey, infoCounter));
  return okm.slice(0, length);
}

function derToRaw(der: Uint8Array): Uint8Array {
  let offset = 2;
  if (der[offset] !== 0x02) throw new Error("Invalid DER signature");
  offset++;
  const rLen = der[offset++];
  let r = der.slice(offset, offset + rLen);
  offset += rLen;
  if (der[offset] !== 0x02) throw new Error("Invalid DER signature");
  offset++;
  const sLen = der[offset++];
  let s = der.slice(offset, offset + sLen);
  if (r.length > 32) r = r.slice(r.length - 32);
  if (s.length > 32) s = s.slice(s.length - 32);
  const raw = new Uint8Array(64);
  raw.set(r, 32 - r.length);
  raw.set(s, 64 - s.length);
  return raw;
}

async function encryptPayload(
  payload: string,
  subscriptionKeys: { p256dh: string; auth: string }
): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Generate ephemeral ECDH key pair
  const asKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]
  );

  // Import subscriber's public key
  const uaPublicKeyBytes = base64urlDecode(subscriptionKeys.p256dh);
  const uaPublicKey = await crypto.subtle.importKey(
    "raw", uaPublicKeyBytes, { name: "ECDH", namedCurve: "P-256" }, false, []
  );

  // ECDH shared secret
  const ecdhSecret = new Uint8Array(
    await crypto.subtle.deriveBits({ name: "ECDH", public: uaPublicKey }, asKeyPair.privateKey, 256)
  );

  // Export ephemeral public key
  const asPublicKeyBytes = new Uint8Array(await crypto.subtle.exportKey("raw", asKeyPair.publicKey));
  const authSecret = base64urlDecode(subscriptionKeys.auth);

  // IKM derivation (RFC 8291 Section 3.3)
  const keyInfo = new Uint8Array([
    ...encoder.encode("WebPush: info\0"),
    ...uaPublicKeyBytes,
    ...asPublicKeyBytes,
  ]);
  const ikm = await hkdf(authSecret, ecdhSecret, keyInfo, 32);

  // Content encryption key (16 bytes) and nonce (12 bytes)
  const cek = await hkdf(salt, ikm, encoder.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, encoder.encode("Content-Encoding: nonce\0"), 12);

  // Encrypt with AES-128-GCM
  const importedCek = await crypto.subtle.importKey("raw", cek, { name: "AES-GCM" }, false, ["encrypt"]);
  const payloadBytes = encoder.encode(payload);
  const record = new Uint8Array(payloadBytes.length + 1);
  record.set(payloadBytes);
  record[payloadBytes.length] = 2; // Final record delimiter

  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, importedCek, record)
  );

  // Build aes128gcm body: header (86 bytes) + ciphertext
  const header = new Uint8Array(86);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, 4096, false); // record size
  header[20] = 65; // key length
  header.set(asPublicKeyBytes, 21);

  const body = new Uint8Array(header.length + encrypted.length);
  body.set(header);
  body.set(encrypted, header.length);

  return body;
}

async function createVapidAuth(
  endpoint: string,
  vapidPublicKeyBytes: Uint8Array,
  vapidPrivateKey: CryptoKey
): Promise<string> {
  const encoder = new TextEncoder();
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const expiration = Math.floor(Date.now() / 1000) + 12 * 3600;

  const jwtHeader = base64urlEncode(encoder.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const jwtPayload = base64urlEncode(encoder.encode(JSON.stringify({
    aud: audience, exp: expiration, sub: "mailto:eggproindia@gmail.com"
  })));

  const signatureInput = encoder.encode(`${jwtHeader}.${jwtPayload}`);
  const derSig = new Uint8Array(
    await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, vapidPrivateKey, signatureInput)
  );
  const rawSig = derToRaw(derSig);

  return `vapid t=${jwtHeader}.${jwtPayload}.${base64urlEncode(rawSig)}, k=${base64urlEncode(vapidPublicKeyBytes)}`;
}

// --- Main Handler ---

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, body: messageBody } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get VAPID keys
    const { data: vapidSettings } = await supabase
      .from("admin_settings")
      .select("key, value")
      .in("key", ["vapid_public_key", "vapid_private_key"]);

    const vapidPublicKeyB64 = vapidSettings?.find(s => s.key === "vapid_public_key")?.value;
    const vapidPrivateKeyJwk = vapidSettings?.find(s => s.key === "vapid_private_key")?.value;

    if (!vapidPublicKeyB64 || !vapidPrivateKeyJwk) {
      console.log("VAPID keys not configured, skipping push notifications");
      return new Response(JSON.stringify({ message: "VAPID keys not configured" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const vapidPublicKeyBytes = base64urlDecode(vapidPublicKeyB64);
    const vapidPrivateKey = await crypto.subtle.importKey(
      "jwk", JSON.parse(vapidPrivateKeyJwk),
      { name: "ECDSA", namedCurve: "P-256" },
      false, ["sign"]
    );

    // Get all push subscriptions
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("*");

    if (!subscriptions || subscriptions.length === 0) {
      console.log("No push subscriptions found");
      return new Response(JSON.stringify({ message: "No subscriptions", sent: 0 }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const payload = JSON.stringify({
      title: title || "🥚 New Order!",
      body: messageBody || "You have a new order",
      icon: "/favicon.ico"
    });

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      try {
        const encryptedBody = await encryptPayload(payload, {
          p256dh: sub.p256dh,
          auth: sub.auth,
        });

        const authHeader = await createVapidAuth(sub.endpoint, vapidPublicKeyBytes, vapidPrivateKey);

        const pushRes = await fetch(sub.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            "Content-Encoding": "aes128gcm",
            "TTL": "86400",
            "Authorization": authHeader,
          },
          body: encryptedBody,
        });

        if (pushRes.status === 201 || pushRes.status === 200) {
          sent++;
          console.log(`Push sent to subscription ${sub.id}`);
        } else if (pushRes.status === 410 || pushRes.status === 404) {
          // Subscription expired, clean up
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          console.log(`Removed expired subscription ${sub.id}`);
          failed++;
        } else {
          const errText = await pushRes.text();
          console.error(`Push failed for ${sub.id}: ${pushRes.status} - ${errText}`);
          failed++;
        }
      } catch (e) {
        console.error(`Push error for ${sub.id}:`, e);
        failed++;
      }
    }

    console.log(`Push notifications: ${sent} sent, ${failed} failed`);

    return new Response(JSON.stringify({ sent, failed }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error: any) {
    console.error("Send push notification error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
});

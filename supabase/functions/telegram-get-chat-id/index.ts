import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TELEGRAM_GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");
    if (!TELEGRAM_API_KEY) throw new Error("TELEGRAM_API_KEY is not configured");

    // Get recent updates to find chat IDs
    const response = await fetch(`${TELEGRAM_GATEWAY_URL}/getUpdates`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TELEGRAM_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ limit: 20 }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Telegram API failed [${response.status}]: ${JSON.stringify(data)}`);
    }

    // Extract unique chat IDs with info
    const chats = new Map();
    for (const update of (data.result || [])) {
      const msg = update.message || update.my_chat_member?.chat;
      if (msg?.chat) {
        const chat = msg.chat;
        chats.set(chat.id, {
          id: chat.id,
          title: chat.title || chat.first_name || chat.username || "Unknown",
          type: chat.type,
        });
      }
    }

    return new Response(JSON.stringify({
      chats: Array.from(chats.values()),
      instructions: "Add the bot to a group, send a message there, then call this again to see the chat ID. Save the chat ID(s) in admin settings with key 'telegram_chat_ids' (comma-separated)."
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

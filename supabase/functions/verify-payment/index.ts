import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentVerification {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  orderId: string;
  community: string;
  address: string;
  phone: string;
  customerName: string;
  items: any[];
  totalAmount: number;
  subscriptionEndDate?: string;
  deliverySlot?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
      community,
      address,
      phone,
      customerName,
      items,
      totalAmount,
      subscriptionEndDate,
      deliverySlot
    } = await req.json() as PaymentVerification;

    // Helper to format item lines like: "White Eggs - 30 eggs × 2 = ₹500"
    const formatItem = (i: any) => {
      const pack = i.packSize ? `${i.packSize} eggs` : "";
      const parts = [i.name, pack].filter(Boolean).join(" - ");
      return `• ${parts} × ${i.quantity} = ₹${i.price * i.quantity}`;
    };
    // Slot is folded into the Address block; Time line uses the actual order timestamp.
    const addressWithSlot = deliverySlot ? `${address}\n*Delivery Slot:* ${deliverySlot}` : address;
    const slotLine = "";

    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!RAZORPAY_KEY_SECRET) throw new Error("Razorpay secret not configured");

    // Verify signature
    const encoder = new TextEncoder();
    const data = encoder.encode(`${razorpay_order_id}|${razorpay_payment_id}`);
    const key = encoder.encode(RAZORPAY_KEY_SECRET);
    const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, data);
    const expectedSignature = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, "0")).join("");

    if (expectedSignature !== razorpay_signature) throw new Error("Invalid payment signature");

    console.log("Payment verified:", razorpay_payment_id);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const updateData: any = { payment_id: razorpay_payment_id, payment_status: "completed", order_status: "confirmed" };
    if (subscriptionEndDate) updateData.subscription_end_date = subscriptionEndDate;

    // Get user_id from the order
    const { data: orderRow } = await supabase.from("orders").select("user_id").eq("id", orderId).single();
    await supabase.from("orders").update(updateData).eq("id", orderId);

    // Handle referral reward: check if this user has a pending referral
    if (orderRow?.user_id) {
      const userId = orderRow.user_id;
      const { data: pendingReferral } = await supabase
        .from("referrals")
        .select("*")
        .eq("referred_id", userId)
        .eq("status", "pending")
        .maybeSingle();

      if (pendingReferral) {
        console.log("Processing referral reward for referral:", pendingReferral.id);
        
        // Mark referral as completed
        await supabase
          .from("referrals")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("id", pendingReferral.id);

        // Credit referrer wallet: ₹20
        const { data: referrerProfile } = await supabase
          .from("profiles")
          .select("wallet_balance")
          .eq("id", pendingReferral.referrer_id)
          .single();
        
        const referrerNewBalance = (referrerProfile?.wallet_balance || 0) + 20;
        await supabase
          .from("profiles")
          .update({ wallet_balance: referrerNewBalance })
          .eq("id", pendingReferral.referrer_id);

        await supabase.from("wallet_transactions").insert({
          user_id: pendingReferral.referrer_id,
          amount: 20,
          type: "credit",
          description: "Referral reward - friend's first order"
        });

        // Credit referred user wallet: ₹40
        const { data: referredProfile } = await supabase
          .from("profiles")
          .select("wallet_balance")
          .eq("id", userId)
          .single();
        
        const referredNewBalance = (referredProfile?.wallet_balance || 0) + 40;
        await supabase
          .from("profiles")
          .update({ wallet_balance: referredNewBalance })
          .eq("id", userId);

        await supabase.from("wallet_transactions").insert({
          user_id: userId,
          amount: 40,
          type: "credit",
          description: "Welcome referral bonus"
        });

        console.log("Referral rewards credited successfully");
      }
    }

    // Insert in-app notification for admins
    try {
      const itemsSummary = items.map((i: any) => `${i.name} x${i.quantity}`).join(", ");
      await supabase.from("notifications").insert({
        title: `🥚 New Order #${orderId.slice(0, 8)} - ₹${totalAmount}`,
        message: `${customerName} ordered: ${itemsSummary}. Community: ${community}. Phone: ${phone}.`,
        is_active: true
      });
    } catch (e) {
      console.error("In-app notification error:", e);
    }

    // Insert user-specific notification for the customer
    if (orderRow?.user_id) {
      try {
        const itemsSummary = items.map((i: any) => `${i.name} x${i.quantity}`).join(", ");
        await supabase.from("user_notifications").insert({
          user_id: orderRow.user_id,
          title: "Order Confirmed! 🥚",
          message: `Your order #${orderId.slice(0, 8)} for ₹${totalAmount} has been confirmed. Items: ${itemsSummary}`,
          type: "order",
          reference_id: orderId
        });
      } catch (e) {
        console.error("User notification insert error:", e);
      }
    }

    // Send WhatsApp notifications via WATI
    try {
      const WATI_ACCESS_TOKEN = Deno.env.get("WATI_ACCESS_TOKEN");
      const WATI_API_ENDPOINT = Deno.env.get("WATI_API_ENDPOINT");

      if (WATI_ACCESS_TOKEN && WATI_API_ENDPOINT) {
        const baseUrl = WATI_API_ENDPOINT.replace(/\/$/, "");
        const itemsList = items.map(formatItem).join("\n");

        // --- 1. Send ORDER CONFIRMATION to CUSTOMER ---
        try {
          const cleanCustomerPhone = phone.replace(/^\+/, "");
          
          // Try template message first (works outside 24hr window)
          const custTemplateRes = await fetch(
            `${baseUrl}/api/v1/sendTemplateMessage/${cleanCustomerPhone}`,
            {
              method: "POST",
              headers: {
                "Authorization": WATI_ACCESS_TOKEN,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                template_name: "order_notification",
                broadcast_name: "order_confirmation",
                parameters: [
                  { name: "customer_name", value: customerName },
                  { name: "order_id", value: orderId.slice(0, 8) },
                  { name: "total_amount", value: `₹${totalAmount}` },
                  { name: "community", value: community },
                ],
              }),
            }
          );
          const custResult = await custTemplateRes.json();
          console.log("Customer WhatsApp template response:", JSON.stringify(custResult));
          
          // Fallback: session message
          if (!custTemplateRes.ok || custResult?.result === false) {
            const customerItemsSummary = items.map((i: any) => `🛍️ ${i.name} x${i.quantity}`).join("\n");
            const customerMessage = `Hi ${customerName}! 🥚\n\nThank you for shopping with EggPro! Your order #${orderId.slice(0, 8)} has been confirmed.\n\n${customerItemsSummary}\n\n*Total: ₹${totalAmount}*\n\nYour order will be delivered soon to ${community}.\n\nThanks for choosing EggPro! 🙏`;
            
            await fetch(
              `${baseUrl}/api/v1/sendSessionMessage/${cleanCustomerPhone}?messageText=${encodeURIComponent(customerMessage)}`,
              { method: "POST", headers: { "Authorization": WATI_ACCESS_TOKEN, "Content-Type": "application/json" } }
            );
            console.log("Customer session message fallback sent to:", cleanCustomerPhone);
          }
        } catch (e) {
          console.error("Customer WhatsApp error:", e);
        }

        // --- 2. Send ORDER ALERT to ALL ADMINS & MERCHANTS ---
        try {
          // Get both admin and merchant roles
          const { data: adminRoles } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
          const { data: merchantRoles } = await supabase.from("user_roles").select("user_id").eq("role", "merchant");

          const allRecipientIds = new Set<string>();
          if (adminRoles) adminRoles.forEach(r => allRecipientIds.add(r.user_id));
          if (merchantRoles) merchantRoles.forEach(r => allRecipientIds.add(r.user_id));

          if (allRecipientIds.size > 0) {
            const { data: recipientProfiles } = await supabase.from("profiles").select("phone, full_name").in("id", Array.from(allRecipientIds));
            const { data: settingsData } = await supabase.from("admin_settings").select("value").eq("key", "admin_whatsapp").single();

            const recipientPhones = new Set<string>();
            if (settingsData?.value) recipientPhones.add(settingsData.value);
            if (recipientProfiles) { for (const p of recipientProfiles) { if (p.phone) recipientPhones.add(p.phone); } }

            const adminMessage = `🥚 *New Order Received!*\n\n*Order ID:* ${orderId.slice(0, 8)}\n*Customer:* ${customerName}\n*Phone:* ${phone}\n*Community:* ${community}\n*Address:* ${address}${slotLine}\n\n*Items:*\n${itemsList}\n\n*Total:* ₹${totalAmount}\n\n_${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}_`;

            for (const recipientPhone of recipientPhones) {
              try {
                const cleanPhone = recipientPhone.replace(/^\+/, "");
                const res = await fetch(
                  `${baseUrl}/api/v1/sendSessionMessage/${cleanPhone}?messageText=${encodeURIComponent(adminMessage)}`,
                  { method: "POST", headers: { "Authorization": WATI_ACCESS_TOKEN, "Content-Type": "application/json" } }
                );
                const result = await res.json();
                if (!res.ok || result?.result === false) {
                  const tplRes = await fetch(`${baseUrl}/api/v1/sendTemplateMessage/${cleanPhone}`, {
                    method: "POST",
                    headers: { "Authorization": WATI_ACCESS_TOKEN, "Content-Type": "application/json" },
                    body: JSON.stringify({
                      template_name: "order_notification", broadcast_name: "order_alert",
                      parameters: [
                        { name: "customer_name", value: customerName },
                        { name: "order_id", value: orderId.slice(0, 8) },
                        { name: "total_amount", value: `₹${totalAmount}` },
                        { name: "community", value: community },
                      ],
                    }),
                  });
                  console.log("Template response:", cleanPhone, JSON.stringify(await tplRes.json()));
                } else {
                  console.log("Session msg sent to:", cleanPhone);
                }
              } catch (e) { console.error("WhatsApp error for", recipientPhone, e); }
            }
          }
        } catch (e) { console.error("Admin/Merchant WhatsApp notification error:", e); }
      } else {
        console.log("WATI credentials not configured, skipping WhatsApp");
      }
    } catch (e) {
      console.error("WhatsApp notification error:", e);
    }

    // Global items list for downstream messages (Telegram etc.)
    const itemsList = items.map(formatItem).join("\n");

    // --- Twilio WhatsApp order alert to admin (free-form text) ---
    try {
      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/twilio-whatsapp-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ orderId, customerName, phone, community, address, items, totalAmount, deliverySlot }),
      });
      console.log("Twilio WhatsApp order alert dispatched");
    } catch (e) {
      console.error("Twilio WhatsApp order alert error:", e);
    }

    // --- 3. Send Telegram notification ---
    try {
      const TELEGRAM_GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");

      if (LOVABLE_API_KEY && TELEGRAM_API_KEY) {
        // Get telegram chat IDs from admin_settings
        const { data: telegramSettings } = await supabase
          .from("admin_settings")
          .select("value")
          .eq("key", "telegram_chat_ids")
          .single();

        const chatIds: string[] = telegramSettings?.value
          ? telegramSettings.value.split(",").map((id: string) => id.trim()).filter(Boolean)
          : [];

        if (chatIds.length > 0) {
          const telegramMessage = `🥚 *New Order Received!*\n\n*Order ID:* ${orderId.slice(0, 8)}\n*Customer:* ${customerName}\n*Phone:* ${phone}\n*Community:* ${community}\n*Address:* ${address}${slotLine}\n\n*Items:*\n${itemsList}\n\n*Total:* ₹${totalAmount}\n\n_${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}_`;

          for (const chatId of chatIds) {
            try {
              const res = await fetch(`${TELEGRAM_GATEWAY_URL}/sendMessage`, {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${LOVABLE_API_KEY}`,
                  "X-Connection-Api-Key": TELEGRAM_API_KEY,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  chat_id: chatId,
                  text: telegramMessage,
                  parse_mode: "Markdown",
                }),
              });
              const result = await res.json();
              console.log("Telegram notification sent to chat:", chatId, result.ok);
            } catch (e) {
              console.error("Telegram error for chat:", chatId, e);
            }
          }
        } else {
          console.log("No Telegram chat IDs configured, skipping");
        }
      } else {
        console.log("Telegram credentials not configured, skipping");
      }
    } catch (e) {
      console.error("Telegram notification error:", e);
    }

    // Send admin email via Resend API to all admin emails
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const adminEmail = Deno.env.get("ADMIN_EMAIL");
    
    const adminEmails = [
      adminEmail,
      "eggproindia@gmail.com"
    ].filter(Boolean) as string[];
    
    console.log("Sending notification to admin emails:", adminEmails);
    
    if (resendApiKey && adminEmails.length > 0) {
      try {
        const emailItemsList = items.map((i: any) => `${i.name} x ${i.quantity} - ₹${i.price * i.quantity}`).join("<br>");
        const emailHtml = `<div style="font-family:Arial;max-width:600px;margin:0 auto"><div style="background:linear-gradient(135deg,#F59E0B,#EA580C);padding:20px;border-radius:10px 10px 0 0"><h1 style="color:white;margin:0">🥚 New Order!</h1></div><div style="background:#fff8e7;padding:20px;border:1px solid #f3d4a0"><p><b>Order ID:</b> ${orderId}</p><p><b>Payment ID:</b> ${razorpay_payment_id}</p><p><b>Customer:</b> ${customerName}</p><p><b>Phone:</b> ${phone}</p><p><b>Community:</b> ${community}</p><p><b>Address:</b> ${address}</p>${subscriptionEndDate ? `<p><b>Ends:</b> ${new Date(subscriptionEndDate).toLocaleDateString()}</p>` : ""}<h3>Items</h3><div style="background:white;padding:15px;border-radius:8px">${emailItemsList}</div><div style="background:#fde68a;padding:15px;border-radius:8px;margin-top:20px"><h2 style="color:#92400e;margin:0">Total: ₹${totalAmount}</h2></div></div></div>`;
        
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Authorization": `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ 
            from: "EggPro <onboarding@resend.dev>", 
            to: adminEmails, 
            subject: `New Order #${orderId.slice(0, 8)} - ₹${totalAmount}`, 
            html: emailHtml 
          })
        });
        
        const emailResult = await emailResponse.json();
        console.log("Admin email response:", emailResult);
      } catch (e) { 
        console.error("Email error:", e); 
      }
    }

    // Send browser push notifications
    try {
      const itemsSummaryPush = items.map((i: any) => `${i.name} x${i.quantity}`).join(", ");
      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-push-notification`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `🥚 New Order #${orderId.slice(0, 8)} - ₹${totalAmount}`,
          body: `${customerName} from ${community}: ${itemsSummaryPush}`,
        }),
      });
      console.log("Browser push notifications triggered");
    } catch (e) {
      console.error("Push notification error:", e);
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
});

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
      subscriptionEndDate
    } = await req.json() as PaymentVerification;

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

    // Send WhatsApp notification via WATI to ALL admin phone numbers
    try {
      const WATI_ACCESS_TOKEN = Deno.env.get("WATI_ACCESS_TOKEN");
      const WATI_API_ENDPOINT = Deno.env.get("WATI_API_ENDPOINT");

      if (WATI_ACCESS_TOKEN && WATI_API_ENDPOINT) {
        // Fetch all admin user IDs
        const { data: adminRoles } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", "admin");

        if (adminRoles && adminRoles.length > 0) {
          const adminUserIds = adminRoles.map(r => r.user_id);
          const { data: adminProfiles } = await supabase
            .from("profiles")
            .select("phone, full_name")
            .in("id", adminUserIds);

          // Also get admin_whatsapp from settings as fallback
          const { data: settingsData } = await supabase
            .from("admin_settings")
            .select("value")
            .eq("key", "admin_whatsapp")
            .single();

          const adminPhones = new Set<string>();
          if (settingsData?.value) adminPhones.add(settingsData.value);
          if (adminProfiles) {
            for (const p of adminProfiles) {
              if (p.phone) adminPhones.add(p.phone);
            }
          }

          console.log("Sending WATI WhatsApp to admin phones:", Array.from(adminPhones));

          const itemsList = items.map((i: any) => `• ${i.name} x${i.quantity} = ₹${i.price * i.quantity}`).join("\n");
          const message = `🥚 *New Order Received!*\n\n*Order ID:* ${orderId.slice(0, 8)}\n*Customer:* ${customerName}\n*Phone:* ${phone}\n*Community:* ${community}\n*Address:* ${address}\n\n*Items:*\n${itemsList}\n\n*Total:* ₹${totalAmount}\n\n_${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}_`;

          const baseUrl = WATI_API_ENDPOINT.replace(/\/$/, "");

          for (const adminPhone of adminPhones) {
            try {
              // Clean phone number - remove + prefix if present
              const cleanPhone = adminPhone.replace(/^\+/, "");
              
              // Try sending session message via WATI API
              const response = await fetch(
                `${baseUrl}/api/v1/sendSessionMessage/${cleanPhone}?messageText=${encodeURIComponent(message)}`,
                {
                  method: "POST",
                  headers: {
                    "Authorization": WATI_ACCESS_TOKEN,
                    "Content-Type": "application/json",
                  },
                }
              );

              const result = await response.json();
              
              if (!response.ok || result?.result === false) {
                console.log("Session message failed, trying template message for:", cleanPhone);
                // Fallback: try sending as interactive template message
                const templateResponse = await fetch(
                  `${baseUrl}/api/v1/sendTemplateMessage/${cleanPhone}`,
                  {
                    method: "POST",
                    headers: {
                      "Authorization": WATI_ACCESS_TOKEN,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      template_name: "order_notification",
                      broadcast_name: "order_alert",
                      parameters: [
                        { name: "order_id", value: orderId.slice(0, 8) },
                        { name: "customer_name", value: customerName },
                        { name: "total_amount", value: `₹${totalAmount}` },
                        { name: "community", value: community },
                      ],
                    }),
                  }
                );
                const templateResult = await templateResponse.json();
                console.log("WATI template response for", cleanPhone, ":", JSON.stringify(templateResult));
              } else {
                console.log("WATI session message sent to:", cleanPhone, JSON.stringify(result));
              }
            } catch (e) {
              console.error("WATI WhatsApp send error for", adminPhone, e);
            }
          }
        }
      } else {
        console.log("WATI credentials not configured, skipping WhatsApp notification");
      }
    } catch (e) {
      console.error("WhatsApp notification error:", e);
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

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
});

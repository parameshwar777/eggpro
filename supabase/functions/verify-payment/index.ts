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

    await supabase.from("orders").update(updateData).eq("id", orderId);

    // Send admin email via Resend API to all admin emails
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const adminEmail = Deno.env.get("ADMIN_EMAIL");
    
    // List of all admin emails to notify
    const adminEmails = [
      adminEmail,
      "eggproindia@gmail.com"
    ].filter(Boolean) as string[];
    
    console.log("Sending notification to admin emails:", adminEmails);
    
    if (resendApiKey && adminEmails.length > 0) {
      try {
        const itemsList = items.map((i: any) => `${i.name} x ${i.quantity} - ₹${i.price * i.quantity}`).join("<br>");
        const emailHtml = `<div style="font-family:Arial;max-width:600px;margin:0 auto"><div style="background:linear-gradient(135deg,#F59E0B,#EA580C);padding:20px;border-radius:10px 10px 0 0"><h1 style="color:white;margin:0">🥚 New Order!</h1></div><div style="background:#fff8e7;padding:20px;border:1px solid #f3d4a0"><p><b>Order ID:</b> ${orderId}</p><p><b>Payment ID:</b> ${razorpay_payment_id}</p><p><b>Customer:</b> ${customerName}</p><p><b>Phone:</b> ${phone}</p><p><b>Community:</b> ${community}</p><p><b>Address:</b> ${address}</p>${subscriptionEndDate ? `<p><b>Ends:</b> ${new Date(subscriptionEndDate).toLocaleDateString()}</p>` : ""}<h3>Items</h3><div style="background:white;padding:15px;border-radius:8px">${itemsList}</div><div style="background:#fde68a;padding:15px;border-radius:8px;margin-top:20px"><h2 style="color:#92400e;margin:0">Total: ₹${totalAmount}</h2></div></div></div>`;
        
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
        
        if (!emailResponse.ok) {
          console.error("Email API error:", emailResult);
        } else {
          console.log("Admin emails sent successfully to:", adminEmails);
        }
      } catch (e) { 
        console.error("Email error:", e); 
      }
    } else {
      console.log("Email not sent - missing resendApiKey or adminEmails:", { hasResendKey: !!resendApiKey, adminEmailsCount: adminEmails.length });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
});

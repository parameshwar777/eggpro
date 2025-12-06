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
      totalAmount
    } = await req.json() as PaymentVerification;

    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay secret not configured");
    }

    // Verify signature
    const encoder = new TextEncoder();
    const data = encoder.encode(`${razorpay_order_id}|${razorpay_payment_id}`);
    const key = encoder.encode(RAZORPAY_KEY_SECRET);
    
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      key,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, data);
    const expectedSignature = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    if (expectedSignature !== razorpay_signature) {
      throw new Error("Invalid payment signature");
    }

    console.log("Payment verified successfully:", razorpay_payment_id);

    // Update order in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        payment_id: razorpay_payment_id,
        payment_status: "paid",
        order_status: "confirmed"
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Error updating order:", updateError);
    }

    // Prepare WhatsApp notification to admin
    const adminPhone = "919440229378"; // Admin WhatsApp number
    const itemsList = items.map((i: any) => `• ${i.name} x${i.quantity} = ₹${i.price * i.quantity}`).join("\n");
    
    const message = `🥚 *New Order Received!*

*Order ID:* ${razorpay_payment_id}

*Customer Details:*
Name: ${customerName}
Phone: ${phone}

*Delivery Location:*
Community: ${community}
Address: ${address}

*Order Items:*
${itemsList}

*Total Amount:* ₹${totalAmount}

_Order placed at ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}_`;

    const whatsappUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`;
    
    console.log("WhatsApp notification prepared for admin:", adminPhone);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Payment verified successfully",
      whatsappUrl,
      adminPhone
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error verifying payment:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
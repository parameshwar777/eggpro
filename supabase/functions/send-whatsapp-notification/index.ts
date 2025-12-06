import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  adminPhone: string;
  customerName: string;
  customerPhone: string;
  community: string;
  address: string;
  items: { name: string; quantity: number; price: number }[];
  totalAmount: number;
  paymentId: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: NotificationPayload = await req.json();
    
    const {
      adminPhone,
      customerName,
      customerPhone,
      community,
      address,
      items,
      totalAmount,
      paymentId
    } = payload;

    console.log("Sending WhatsApp notification for order:", paymentId);

    // Format items list
    const itemsList = items.map((i) => `• ${i.name} x${i.quantity} = ₹${i.price * i.quantity}`).join("\n");

    // Create WhatsApp message
    const message = `🥚 *New Order Received!*

*Order ID:* ${paymentId}

*Customer Details:*
Name: ${customerName}
Phone: ${customerPhone}

*Delivery Location:*
Community: ${community}
Address: ${address}

*Order Items:*
${itemsList}

*Total Amount:* ₹${totalAmount}

_Order placed at ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}_`;

    // WhatsApp API URL (using wa.me for direct message)
    // Format: https://wa.me/{phone}?text={urlEncodedMessage}
    const whatsappUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`;

    console.log("WhatsApp notification prepared for:", adminPhone);

    return new Response(JSON.stringify({ 
      success: true, 
      whatsappUrl,
      message: "Notification prepared successfully"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error preparing WhatsApp notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

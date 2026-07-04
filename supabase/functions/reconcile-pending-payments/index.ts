import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Reconciles pending orders by asking Razorpay whether the payment actually
 * succeeded. This catches the case where the customer paid successfully but
 * the app closed / network dropped before verify-payment ran, leaving the
 * order stuck as "pending" and hidden from the customer + admin lists.
 *
 * Called on OrdersPage mount for the authenticated user; admin cron can
 * hit it with a service-role token to reconcile all pending orders too.
 */
serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) throw new Error("Razorpay not configured");
    const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Identify caller (optional — if no user token, we scope to all recent pending)
    const authHeader = req.headers.get("Authorization") || "";
    let userId: string | null = null;
    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const authed = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data: userRes } = await authed.auth.getUser();
      userId = userRes?.user?.id || null;
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Look at pending orders created in last 48 hours
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    let query = admin.from("orders").select("id, user_id, community, address, phone, customer_name, items, total_amount, subscription_end_date")
      .eq("payment_status", "pending")
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(50);
    if (userId) query = query.eq("user_id", userId);
    const { data: pending, error } = await query;
    if (error) throw error;

    const results: any[] = [];
    for (const order of pending || []) {
      try {
        // Find the Razorpay order via receipt (we set receipt = our orderId when creating)
        const orderRes = await fetch(
          `https://api.razorpay.com/v1/orders?receipt=${encodeURIComponent(order.id)}`,
          { headers: { Authorization: `Basic ${auth}` } }
        );
        const orderJson = await orderRes.json();
        const rzpOrder = orderJson?.items?.[0];
        if (!rzpOrder) { results.push({ orderId: order.id, status: "no_razorpay_order" }); continue; }

        // Fetch payments on that Razorpay order
        const payRes = await fetch(
          `https://api.razorpay.com/v1/orders/${rzpOrder.id}/payments`,
          { headers: { Authorization: `Basic ${auth}` } }
        );
        const payJson = await payRes.json();
        const captured = (payJson?.items || []).find((p: any) => p.status === "captured" || p.status === "authorized");
        if (!captured) { results.push({ orderId: order.id, status: "not_paid" }); continue; }

        // Claim the row: only update if still pending, to avoid duplicate side effects
        const { data: claimed } = await admin.from("orders")
          .update({
            payment_id: captured.id,
            payment_status: "completed",
            order_status: "confirmed",
          })
          .eq("id", order.id)
          .eq("payment_status", "pending")
          .select("id");
        if (!claimed?.length) { results.push({ orderId: order.id, status: "already_processed" }); continue; }

        results.push({ orderId: order.id, status: "reconciled", paymentId: captured.id });

        // Fire notifications (best-effort, don't block on failures)
        try {
          const itemsSummary = (order.items || []).map((i: any) => `${i.name} x${i.quantity}`).join(", ");
          await admin.from("notifications").insert({
            title: `🥚 Recovered Order #${order.id.slice(0, 8)} - ₹${order.total_amount}`,
            message: `${order.customer_name || "Customer"} ordered: ${itemsSummary}. Community: ${order.community}. Phone: ${order.phone}.`,
            is_active: true,
          });
          if (order.user_id) {
            await admin.from("user_notifications").insert({
              user_id: order.user_id,
              title: "Order Confirmed! 🥚",
              message: `Your order #${order.id.slice(0, 8)} for ₹${order.total_amount} has been confirmed. Items: ${itemsSummary}`,
              type: "order",
              reference_id: order.id,
            });
          }
        } catch (e) { console.error("notify insert error:", e); }

        // Trigger WhatsApp admin alert via existing function
        try {
          await fetch(`${SUPABASE_URL}/functions/v1/twilio-whatsapp-order`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_ROLE}` },
            body: JSON.stringify({
              orderId: order.id,
              customerName: order.customer_name,
              phone: order.phone,
              community: order.community,
              address: order.address,
              items: order.items,
              totalAmount: order.total_amount,
            }),
          });
        } catch (e) { console.error("twilio dispatch error:", e); }
      } catch (e: any) {
        console.error("reconcile err for order", order.id, e);
        results.push({ orderId: order.id, status: "error", error: e.message });
      }
    }

    return new Response(JSON.stringify({ checked: pending?.length || 0, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("reconcile-pending-payments error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

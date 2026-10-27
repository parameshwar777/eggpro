import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { EggSpinner } from "@/components/EggSpinner";

const STATUS_LABEL: Record<string, string> = {
  PENDING_PICKUP: "Pending pickup", READY_FOR_PICKUP: "Ready for pickup", VERIFIED: "Verified",
  HANDED_OVER: "Collected", EXPIRED: "Expired", CANCELLED: "Cancelled",
};

const fmt = (d: string) => new Date(d).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

export const ChickenOrdersPage = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["chicken-orders-history"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data: orders } = await supabase.from("orders")
        .select("id, created_at, total_amount, items, fulfillment_type, chicken_supply_at")
        .eq("user_id", user.id).eq("business", "chicken").eq("payment_status", "completed")
        .order("created_at", { ascending: false });
      const ids = (orders || []).map((o) => o.id);
      const { data: codes } = ids.length
        ? await supabase.from("chicken_pickup_verifications").select("order_id, pickup_code, pickup_status").in("order_id", ids)
        : { data: [] as any[] };
      const byOrder = new Map((codes || []).map((c: any) => [c.order_id, c]));
      return (orders || []).map((o) => ({ ...o, code: byOrder.get(o.id) as any }));
    },
  });

  return (
    <div className="page-scroll bg-background w-full">
      <div className="max-w-lg mx-auto pb-12">
        <div className="gradient-hero text-accent-foreground px-5 pt-4 pb-5 safe-top">
          <Button variant="ghost" size="icon" onClick={() => navigate("/chicken/order")} className="h-12 w-12 -ml-2" aria-label="Back">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-extrabold mt-2">My Chicken Orders</h1>
          <p className="text-sm font-semibold opacity-90">Open an order and show the pickup code at the outlet</p>
        </div>
        <div className="px-5 pt-5 space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-10"><EggSpinner /></div>
          ) : !data?.length ? (
            <div className="text-center py-12">
              <Package className="w-10 h-10 mx-auto text-muted-foreground" />
              <p className="mt-3 font-bold">No chicken orders yet</p>
              <Button onClick={() => navigate("/chicken/order")} className="mt-4 h-12">Order chicken</Button>
            </div>
          ) : data.map((o: any) => {
            const items = Array.isArray(o.items) ? o.items : [];
            return (
              <button key={o.id} onClick={() => navigate(`/chicken/pickup/${o.id}`)}
                className="w-full text-left bg-card border-2 border-border rounded-2xl p-4 flex items-center gap-3 active:scale-[0.99] transition">
                <div className="flex-1 min-w-0">
                  {o.code?.pickup_code
                    ? <p className="text-xl font-black tracking-wider text-primary">{o.code.pickup_code}</p>
                    : <p className="font-bold">{o.fulfillment_type === "pickup" ? "Code being generated" : "Delivery order"}</p>}
                  <p className="text-xs font-bold text-muted-foreground mt-0.5">
                    {o.code ? (STATUS_LABEL[o.code.pickup_status] || o.code.pickup_status) + " • " : ""}{fmt(o.created_at)}
                  </p>
                  <p className="text-sm font-semibold mt-1 truncate">
                    {items.map((i: any) => `${i.name}${i.weight ? ` (${i.weight})` : ""} × ${i.quantity}`).join(", ")}
                  </p>
                  <p className="text-sm font-extrabold mt-1">₹{Number(o.total_amount)}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

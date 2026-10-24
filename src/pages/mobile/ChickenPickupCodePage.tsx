import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Copy, QrCode, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BrandLogo } from "@/components/BrandLogo";

const STATUS_LABEL: Record<string, string> = {
  PENDING_PICKUP: "Pending pickup", READY_FOR_PICKUP: "Ready for pickup", VERIFIED: "Verified",
  HANDED_OVER: "Collected", EXPIRED: "Expired", CANCELLED: "Cancelled",
};

export const ChickenPickupCodePage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [v, setV] = useState<any>(null);
  const [center, setCenter] = useState<string>("");
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    (async () => {
      if (!orderId) { setLoading(false); return; }
      const { data } = await supabase.from("chicken_pickup_verifications").select("*").eq("order_id", orderId).maybeSingle();
      setV(data);
      if (data?.pickup_center_id) {
        const { data: c } = await supabase.from("chicken_pickup_centers").select("name").eq("id", data.pickup_center_id).maybeSingle();
        setCenter(c?.name || "");
      }
      setLoading(false);
    })();
  }, [orderId]);

  const copy = async () => {
    try { await navigator.clipboard.writeText(v.pickup_code); toast({ title: "Code copied" }); } catch { /* ignore */ }
  };

  return (
    <div className="page-scroll bg-[#FFF8E7] w-full">
      <div className="max-w-lg mx-auto px-5 pb-12 safe-top">
        <div className="flex flex-col items-center pt-8">
          <BrandLogo size={72} />
          <CheckCircle2 className="w-10 h-10 text-green-600 mt-4" />
        </div>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : !v ? (
          <p className="text-center mt-6 font-semibold text-muted-foreground">Your pickup code is being generated. Please check your Orders tab in a moment.</p>
        ) : (
          <div className="mt-4 bg-card rounded-3xl shadow-xl p-6 text-center">
            <p className="text-xs font-extrabold tracking-widest text-muted-foreground">YOUR CHICKEN PICKUP CODE</p>
            <p className="mt-3 text-4xl font-black tracking-wider text-orange-700 select-all">{v.pickup_code}</p>
            <p className="mt-1 text-xs font-bold text-muted-foreground">{STATUS_LABEL[v.pickup_status] || v.pickup_status}</p>
            <Button variant="secondary" onClick={copy} className="mt-5 h-12 w-full"><Copy />COPY CODE</Button>
            <div className="mt-6 text-left space-y-2 text-sm">
              <p><span className="font-bold">Pickup Outlet: </span>{center || "—"}</p>
              <p className="break-all"><span className="font-bold">Order ID: </span>{orderId}</p>
              {v.expires_at && <p><span className="font-bold">Pickup Deadline: </span>{new Date(v.expires_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</p>}
            </div>
            <p className="mt-5 text-sm font-semibold text-foreground bg-amber-50 rounded-xl p-3">Give your name, phone number or order code at your selected outlet. The outlet will mark your order collected.</p>
          </div>
        )}
        <button onClick={() => navigate("/orders")} className="mt-6 w-full h-12 rounded-xl border-2 border-border font-bold">Go to My Orders</button>
      </div>
    </div>
  );
};

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BrandLogo } from "@/components/BrandLogo";
import { PickupVerificationPanel } from "@/pages/admin/AdminChicken";

/** Protected screen for chicken pickup staff (server re-checks every request). */
export const StaffPickupPage = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [centerName, setCenterName] = useState("");

  useEffect(() => {
    if (isLoading) return;
    if (!user) { navigate("/auth"); return; }
    (async () => {
      if (isAdmin) { setAllowed(true); return; }
      const { data } = await supabase.from("user_roles").select("id").eq("user_id", user.id).eq("role", "chicken_staff" as any).maybeSingle();
      setAllowed(!!data);
      if (data) {
        const { data: sc } = await supabase.from("staff_centers").select("pickup_center_id").eq("user_id", user.id).maybeSingle();
        if (sc?.pickup_center_id) {
          const { data: c } = await supabase.from("chicken_pickup_centers").select("name").eq("id", sc.pickup_center_id).maybeSingle();
          setCenterName(c?.name || "");
        }
      }
    })();
  }, [user, isAdmin, isLoading, navigate]);

  if (allowed === null) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (!allowed) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <BrandLogo size={72} />
      <p className="mt-4 font-bold">This screen is only for EggPro pickup staff.</p>
      <button onClick={() => navigate("/welcome")} className="mt-4 h-12 px-6 rounded-xl bg-primary text-primary-foreground font-bold">Go back</button>
    </div>
  );

  return (
    <div className="page-scroll bg-stone-900 w-full">
      <div className="px-4 pb-10 safe-top">
        <div className="flex items-center justify-between py-4 max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <BrandLogo size={44} />
            <div>
              <p className="text-white font-extrabold">EggPro Chicken</p>
              {centerName && <p className="text-xs text-stone-300 font-semibold">{centerName}</p>}
            </div>
          </div>
          <button onClick={async () => { await signOut(); navigate("/auth"); }} className="h-11 w-11 flex items-center justify-center text-stone-300" aria-label="Log out"><LogOut className="w-5 h-5" /></button>
        </div>
        <PickupVerificationPanel isAdmin={isAdmin} />
      </div>
    </div>
  );
};

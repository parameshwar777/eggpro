import { useNavigate } from "react-router-dom";
import { Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChickenSettings } from "@/lib/chickenSettings";

/** Full-screen block shown on chicken pages while admin has closed the chicken store. */
export const ChickenClosedNotice = () => {
  const { settings, loaded } = useChickenSettings();
  const navigate = useNavigate();
  if (!loaded || !settings.store_closed) return null;
  const title = settings.closed_title?.trim() || "Chicken Store Closed";
  const msg = settings.closed_message?.trim() || "EggPro Chicken is temporarily closed. We will be back soon!";
  return (
    <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center p-6 safe-top safe-bottom" role="alertdialog" aria-labelledby="chicken-closed-title">
      <div className="w-full max-w-sm rounded-2xl border-2 border-destructive bg-card p-6 text-center shadow-lg">
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4"><Store className="w-8 h-8 text-destructive" /></div>
        <h1 id="chicken-closed-title" className="text-2xl font-extrabold mb-3">{title}</h1>
        <p className="text-base font-semibold text-foreground whitespace-pre-line mb-6">{msg}</p>
        <Button className="w-full h-12 font-bold mb-3" onClick={() => navigate("/welcome", { replace: true })}>Back to Home</Button>
        <Button variant="outline" className="w-full h-12 font-bold" onClick={() => navigate("/chicken/orders")}>My Chicken Orders</Button>
      </div>
    </div>
  );
};

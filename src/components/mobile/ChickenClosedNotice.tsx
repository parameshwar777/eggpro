import { useNavigate } from "react-router-dom";
import { Bird, Home } from "lucide-react";
import { useChickenSettings } from "@/lib/chickenSettings";

/** Full-screen block shown on chicken pages while admin has closed the chicken store. */
export const ChickenClosedNotice = () => {
  const { settings, loaded } = useChickenSettings();
  const navigate = useNavigate();
  if (!loaded || !settings.store_closed) return null;
  const title = settings.closed_title?.trim() || "Chicken Store Closed";
  const msg = settings.closed_message?.trim() || "EggPro Chicken is temporarily closed. We will be back soon!";
  return (
    <div
      className="fixed inset-0 z-[100] gradient-warm flex items-center justify-center p-6 safe-top safe-bottom"
      role="alertdialog"
      aria-labelledby="chicken-closed-title"
    >
      {/* Soft decorative circles */}
      <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-20 -left-14 w-64 h-64 rounded-full bg-white/10" aria-hidden="true" />
      <div className="pointer-events-none absolute top-1/3 -left-20 w-40 h-40 rounded-full bg-white/5" aria-hidden="true" />

      <div className="relative w-full max-w-sm rounded-3xl bg-card p-8 text-center shadow-2xl">
        <div className="mx-auto w-24 h-24 rounded-full gradient-hero flex items-center justify-center mb-5 shadow-lg">
          <Bird className="w-12 h-12 text-primary-foreground" strokeWidth={2.2} />
        </div>
        <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-muted-foreground mb-2">Egg Pro Chicken</p>
        <h1 id="chicken-closed-title" className="text-3xl font-extrabold leading-tight mb-3">{title}</h1>
        <p className="text-base font-semibold text-muted-foreground whitespace-pre-line mb-8">{msg}</p>
        <button
          onClick={() => navigate("/welcome", { replace: true })}
          className="w-full h-14 rounded-2xl gradient-hero text-primary-foreground font-bold text-base flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform"
        >
          <Home className="w-5 h-5" />
          Back to Home
        </button>
      </div>
    </div>
  );
};

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Egg, Drumstick, Coffee, ChevronRight } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { timeLeft } from "@/lib/cafeOpening";

const cards = [
  {
    key: "eggs",
    title: "EGGPRO",
    subtitle: ["Fresh Eggs Delivered Daily"],
    cta: "SHOP EGGS",
    icon: Egg,
    tone: "welcome-eggs",
  },
  {
    key: "chicken",
    title: "EGGPRO CHICKEN",
    subtitle: ["Slow-Growing Broiler", "Tasty • Quality • Naturally Raised"],
    cta: "EXPLORE CHICKEN",
    icon: Drumstick,
    tone: "welcome-chicken",
  },
  {
    key: "cafe",
    title: "EGGPRO CAFÉ",
    subtitle: ["High-Protein Food • Fresh Ingredients"],
    cta: "COMING SOON",
    icon: Coffee,
    tone: "welcome-cafe",
    soon: true,
  },
];

export const WelcomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [now, setNow] = useState(Date.now());
  const cafeComingSoon = timeLeft(now) !== null;

  useEffect(() => {
    if (!cafeComingSoon) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [cafeComingSoon]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    void supabase.from("profiles").select("community").eq("id", user.id).single()
      .then(({ data }) => {
        if (!cancelled && data?.community) {
          localStorage.setItem("selectedCommunity", data.community);
        }
      });
    return () => { cancelled = true; };
  }, [user?.id]);

  const open = (key: string) => {
    localStorage.setItem("selectedBusiness", key);
    if (key === "eggs") {
      navigate(localStorage.getItem("selectedCommunity") ? "/home" : "/community");
    } else if (key === "chicken") navigate("/chicken");
    else navigate("/cafe");
  };

  return (
    <div className="page-scroll bg-secondary w-full animate-[fade-in_0.8s_ease-out]">
      <div className="max-w-lg mx-auto px-4 pb-10 safe-top">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center pt-8 pb-6"
        >
          <BrandLogo size={112} />
          <h1 className="mt-4 text-2xl font-extrabold tracking-normal text-foreground">Welcome to EggPro</h1>
          <p className="text-sm font-semibold text-muted-foreground mt-1">Choose what you'd like today</p>
        </motion.div>

        <div className="grid grid-cols-2 gap-3">
          {cards.map((c, i) => (
            <motion.div
              key={c.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              whileTap={{ scale: 0.98 }}
                            className={`min-w-0 text-left rounded-lg p-4 ${c.tone} text-accent-foreground shadow-card relative overflow-hidden flex flex-col ${c.key === "cafe" ? "col-span-2 min-h-44" : "min-h-64"}`}
            >
              <c.icon className="absolute -right-4 -bottom-4 w-32 h-32 opacity-15" />
              {c.soon && cafeComingSoon && (
                <span className="absolute top-4 right-4 text-[10px] font-extrabold tracking-widest bg-background/20 px-2.5 py-1 rounded-full">
                  COMING SOON
                </span>
              )}
              <div className="w-11 h-11 rounded-2xl bg-background/20 flex items-center justify-center mb-3">
                <c.icon className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-extrabold tracking-normal leading-tight min-h-12">{c.title}</h2>
              {c.subtitle.map((s) => (
                <p key={s} className="text-[13px] font-semibold opacity-90 leading-snug mt-1">{s}</p>
              ))}
              <Button variant="secondary" onClick={() => open(c.key)} className="mt-auto pt-2 h-12 w-full min-w-0 px-2 text-[12px] whitespace-normal leading-tight font-extrabold relative z-10">
                {c.key === "cafe" && !cafeComingSoon ? "EXPLORE CAFÉ" : c.cta}
                {(!c.soon || !cafeComingSoon) && <ChevronRight className="w-4 h-4 shrink-0" />}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

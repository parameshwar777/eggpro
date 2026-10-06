import { motion } from "framer-motion";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Egg, Drumstick, Coffee, ChevronRight } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const cards = [
  {
    key: "eggs",
    title: "EGGPRO",
    subtitle: ["Fresh Eggs Delivered Daily"],
    cta: "SHOP EGGS",
    icon: Egg,
    tone: "from-amber-400 to-orange-500",
  },
  {
    key: "chicken",
    title: "EGGPRO CHICKEN",
    subtitle: ["Slow-Growing Broiler", "Tasty • Quality • Naturally Raised"],
    cta: "EXPLORE CHICKEN",
    icon: Drumstick,
    tone: "from-orange-500 to-red-600",
  },
  {
    key: "cafe",
    title: "EGGPRO CAFÉ",
    subtitle: ["High-Protein Food • Fresh Ingredients"],
    cta: "COMING SOON",
    icon: Coffee,
    tone: "from-stone-700 to-stone-900",
    soon: true,
  },
];

export const WelcomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

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
    <div className="page-scroll bg-[#FFF8E7] w-full">
      <div className="max-w-lg mx-auto px-5 pb-10 safe-top">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center pt-8 pb-6"
        >
          <BrandLogo size={112} />
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-foreground">Welcome to EggPro</h1>
          <p className="text-sm font-semibold text-muted-foreground mt-1">Choose what you'd like today</p>
        </motion.div>

        <div className="space-y-4">
          {cards.map((c, i) => (
            <motion.button
              key={c.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => open(c.key)}
              className={`w-full text-left rounded-3xl p-5 bg-gradient-to-br ${c.tone} text-white shadow-xl relative overflow-hidden`}
            >
              <c.icon className="absolute -right-4 -bottom-4 w-32 h-32 opacity-15" />
              {c.soon && (
                <span className="absolute top-4 right-4 text-[10px] font-extrabold tracking-widest bg-white/20 px-2.5 py-1 rounded-full">
                  COMING SOON
                </span>
              )}
              <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center mb-3">
                <c.icon className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-extrabold tracking-wide">{c.title}</h2>
              {c.subtitle.map((s) => (
                <p key={s} className="text-sm font-semibold opacity-90 leading-snug">{s}</p>
              ))}
              <div className="mt-4 inline-flex items-center gap-1 bg-white text-stone-900 font-extrabold text-sm px-4 h-11 rounded-xl">
                {c.cta}
                {!c.soon && <ChevronRight className="w-4 h-4" />}
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

import { useState, useEffect } from "react";
import { Home, ClipboardList, Gift, User, ShoppingCart } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";

export const BottomNav = () => {
  const location = useLocation();
  const { totalItems } = useCart();
  const [showReferral, setShowReferral] = useState(false);

  useEffect(() => {
    const fetchSetting = async () => {
      const { data } = await supabase
        .from("admin_settings")
        .select("value")
        .eq("key", "show_referral")
        .maybeSingle();
      setShowReferral(data?.value === "true");
    };
    fetchSetting();
  }, []);

  const navItems = [
    { to: "/home", icon: Home, label: "Home" },
    { to: "/orders", icon: ClipboardList, label: "Orders" },
    { to: "/cart", icon: ShoppingCart, label: "Cart" },
    ...(showReferral ? [{ to: "/refer", icon: Gift, label: "Refer" }] : []),
    { to: "/account", icon: User, label: "Account" },
  ];

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border"
    >
      <div className="mx-auto flex items-center justify-around py-2 px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="relative flex flex-col items-center py-2 px-2 sm:px-4 min-w-0 flex-1"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "p-2 rounded-xl transition-all duration-200",
                  isActive ? "bg-primary/10" : "bg-transparent"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-200",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
                {item.to === "/cart" && totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-accent-foreground text-[10px] rounded-full flex items-center justify-center font-bold">
                    {totalItems}
                  </span>
                )}
              </motion.div>
              <span
                className={cn(
                  "text-xs mt-1 font-medium transition-colors duration-200",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </NavLink>
          );
        })}
      </div>
    </motion.nav>
  );
};

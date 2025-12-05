import { Home, ClipboardList, Gift, User } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/home", icon: Home, label: "Home" },
  { to: "/orders", icon: ClipboardList, label: "Orders" },
  { to: "/refer", icon: Gift, label: "Refer" },
  { to: "/account", icon: User, label: "Account" },
];

export const BottomNav = () => {
  const location = useLocation();

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg z-50 bg-card/95 backdrop-blur-xl border-t border-border shadow-elevated safe-area-pb"
    >
      <div className="flex items-center justify-around py-2 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="relative flex flex-col items-center py-1.5 px-3 min-w-[60px]"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "p-2 rounded-xl transition-all duration-300",
                  isActive ? "bg-primary/10" : "bg-transparent"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 transition-colors duration-300",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
              </motion.div>
              <span
                className={cn(
                  "text-[10px] mt-0.5 font-medium transition-colors duration-300",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary"
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

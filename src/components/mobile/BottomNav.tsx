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
      className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border"
    >
      <div className="max-w-lg mx-auto flex items-center justify-around py-2 px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="relative flex flex-col items-center py-2 px-4 min-w-[64px]"
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
                    "w-6 h-6 transition-colors duration-200",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
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

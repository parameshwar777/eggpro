import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { motion } from "framer-motion";

interface MobileLayoutProps {
  children: ReactNode;
  hideNav?: boolean;
}

export const MobileLayout = ({ children, hideNav = false }: MobileLayoutProps) => {
  return (
    <div className="app-shell bg-background">
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex-1 overflow-y-auto overscroll-contain"
      >
        <div className={hideNav ? "" : "pb-24"}>
          {children}
        </div>
      </motion.main>
      {!hideNav && <BottomNav />}
    </div>
  );
};

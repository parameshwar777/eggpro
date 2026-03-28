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
      <div className="mx-auto min-h-full relative">
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={hideNav ? "" : "pb-24"}
        >
          {children}
        </motion.main>
        {!hideNav && <BottomNav />}
      </div>
    </div>
  );
};

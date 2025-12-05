import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { motion } from "framer-motion";

interface MobileLayoutProps {
  children: ReactNode;
  hideNav?: boolean;
}

export const MobileLayout = ({ children, hideNav = false }: MobileLayoutProps) => {
  return (
    <div className="min-h-screen bg-background w-full">
      <div className="max-w-lg mx-auto relative min-h-screen">
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={hideNav ? "" : "pb-20"}
        >
          {children}
        </motion.main>
        {!hideNav && <BottomNav />}
      </div>
    </div>
  );
};

import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { motion } from "framer-motion";

interface MobileLayoutProps {
  children: ReactNode;
  hideNav?: boolean;
}

export const MobileLayout = ({ children, hideNav = false }: MobileLayoutProps) => {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-background">
      <div className="max-w-lg mx-auto min-h-screen min-h-[100dvh] relative">
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

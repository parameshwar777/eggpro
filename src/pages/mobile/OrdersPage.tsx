import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MobileLayout } from "@/components/mobile/MobileLayout";

const tabs = ["Ongoing", "Completed"];

export const OrdersPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const orders: any[] = [];

  return (
    <MobileLayout>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="gradient-warm px-4 pt-6 pb-12 rounded-b-3xl"
      >
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-xl font-bold text-foreground"
        >
          My Orders
        </motion.h1>
        <motion.p
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-foreground/70 text-sm"
        >
          Track your orders and subscriptions
        </motion.p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mx-4 -mt-5 bg-card rounded-2xl p-1.5 shadow-elevated flex"
      >
        {tabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
              activeTab === i
                ? "bg-foreground text-background"
                : "text-muted-foreground"
            }`}
          >
            {tab} (0)
          </button>
        ))}
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="px-4 py-6"
        >
          {orders.length === 0 ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-card rounded-2xl p-8 shadow-card flex flex-col items-center"
            >
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-6xl mb-4"
              >
                📦
              </motion.div>
              <p className="text-muted-foreground text-sm">
                No {activeTab === 0 ? "ongoing" : "completed"} orders
              </p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {/* Order cards would go here */}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </MobileLayout>
  );
};

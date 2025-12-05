import { motion } from "framer-motion";
import {
  MapPin,
  Wallet,
  RefreshCw,
  CreditCard,
  Bell,
  HelpCircle,
  ChevronRight,
  Star,
} from "lucide-react";
import { MobileLayout } from "@/components/mobile/MobileLayout";
import { useNavigate } from "react-router-dom";

const menuItems = [
  { icon: MapPin, label: "Delivery Addresses", desc: "Add your addresses", to: "/addresses", color: "bg-blue-100 text-blue-600" },
  { icon: Wallet, label: "Wallet", desc: "₹0 available", to: "/wallet", color: "bg-green-100 text-green-600" },
  { icon: RefreshCw, label: "My Subscriptions", desc: "No active subscriptions", to: "#", color: "bg-purple-100 text-purple-600" },
  { icon: CreditCard, label: "Subscription Billing", desc: "Manage billing & payments", to: "#", color: "bg-orange-100 text-orange-600" },
  { icon: Bell, label: "Notifications & Offers", desc: "View announcements & offers", to: "#", color: "bg-red-100 text-red-600" },
  { icon: HelpCircle, label: "Help & Support", desc: "Get help or contact us", to: "#", color: "bg-cyan-100 text-cyan-600" },
];

export const AccountPage = () => {
  const navigate = useNavigate();

  return (
    <MobileLayout>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="gradient-warm px-4 pt-6 pb-16 rounded-b-3xl"
      >
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-xl font-bold text-foreground"
        >
          My Account
        </motion.h1>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mx-4 -mt-10 bg-card rounded-2xl p-5 shadow-elevated"
      >
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="w-14 h-14 rounded-full bg-primary flex items-center justify-center flex-shrink-0"
          >
            <span className="text-xl font-bold text-primary-foreground">P</span>
          </motion.div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-foreground">Guest User</h2>
            <p className="text-sm text-muted-foreground truncate">guest@example.com</p>
            <div className="flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span className="text-xs text-primary truncate">My Home Bhooja</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">₹0</p>
            <p className="text-xs text-muted-foreground">Wallet</p>
          </div>
          <div className="text-center border-x border-border">
            <p className="text-lg font-bold text-foreground">0</p>
            <p className="text-xs text-muted-foreground">Subscriptions</p>
          </div>
          <div className="text-center flex flex-col items-center">
            <div className="flex items-center gap-0.5">
              <Star className="w-4 h-4 fill-primary text-primary" />
              <span className="text-lg font-bold text-foreground">4.8</span>
            </div>
            <p className="text-xs text-muted-foreground">Rating</p>
          </div>
        </div>
      </motion.div>

      {/* Menu Items */}
      <div className="px-4 py-4 space-y-2">
        {menuItems.map((item, i) => (
          <motion.button
            key={item.label}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(item.to)}
            className="w-full bg-card rounded-xl p-4 shadow-card flex items-center gap-3"
          >
            <div className={`p-3 rounded-xl ${item.color} flex-shrink-0`}>
              <item.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="font-medium text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          </motion.button>
        ))}
      </div>
    </MobileLayout>
  );
};

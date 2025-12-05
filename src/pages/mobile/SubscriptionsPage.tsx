import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RefreshCw, Calendar, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface Subscription {
  id: string;
  items: any;
  total_amount: number;
  order_status: string | null;
  created_at: string;
  address: string;
  community: string;
}

export const SubscriptionsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSubscriptions();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchSubscriptions = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .eq("order_status", "subscription_active")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setSubscriptions(data as Subscription[]);
    }
    setIsLoading(false);
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case "daily": return "Daily";
      case "alternate": return "Alternate Days";
      case "weekly": return "Weekly";
      default: return "One Time";
    }
  };

  return (
    <div className="min-h-screen bg-background w-full">
      <div className="max-w-lg mx-auto pb-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card px-4 py-4 flex items-center gap-3 border-b border-border sticky top-0 z-10"
        >
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-secondary"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <h1 className="text-lg font-semibold text-foreground">My Subscriptions</h1>
        </motion.div>

        {!user ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-4"
          >
            <div className="bg-card rounded-2xl p-8 shadow-card flex flex-col items-center">
              <RefreshCw className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4 text-center">Please login to view your subscriptions</p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/auth")}
                className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium"
              >
                Login
              </motion.button>
            </div>
          </motion.div>
        ) : isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : subscriptions.length === 0 ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-4"
          >
            <div className="bg-card rounded-2xl p-8 shadow-card flex flex-col items-center">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              >
                <RefreshCw className="w-16 h-16 text-muted-foreground mb-4" />
              </motion.div>
              <p className="text-lg font-medium text-foreground mb-2">No Active Subscriptions</p>
              <p className="text-muted-foreground mb-4 text-center">Start a subscription to get fresh eggs delivered regularly</p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/home")}
                className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium"
              >
                Browse Products
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <div className="p-4 space-y-4">
            {subscriptions.map((sub, i) => (
              <motion.div
                key={sub.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-2xl p-4 shadow-card"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-100 rounded-xl">
                      <Package className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {sub.items?.[0]?.name || "Eggs Subscription"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {sub.items?.[0]?.packSize} eggs × {sub.items?.[0]?.quantity || 1}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700">Active</Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <RefreshCw className="w-4 h-4" />
                    <span>{getFrequencyLabel(sub.items?.[0]?.frequency || "daily")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Started: {new Date(sub.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                  <p className="text-lg font-bold text-primary">₹{sub.total_amount}</p>
                  <p className="text-xs text-muted-foreground">per delivery</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

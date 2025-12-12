import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MobileLayout } from "@/components/mobile/MobileLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Package, RefreshCw, MapPin, Phone, Calendar, Truck, CheckCircle, Clock, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Order {
  id: string;
  items: any;
  total_amount: number;
  order_status: string | null;
  payment_status: string | null;
  created_at: string;
  community: string;
  address: string;
  phone: string;
  subscription_end_date: string | null;
}

const tabs = ["Ongoing", "Completed"];

const orderSteps = [
  { status: "pending", label: "Order Placed", icon: Clock },
  { status: "confirmed", label: "Confirmed", icon: CheckCircle },
  { status: "subscription_active", label: "Active", icon: RefreshCw },
  { status: "delivered", label: "Delivered", icon: Truck },
];

export const OrdersPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchOrders();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrders(data as Order[]);
    }
    setIsLoading(false);
  };

  const ongoingOrders = orders.filter(o => 
    o.order_status && !["delivered", "cancelled", "completed", "inactive"].includes(o.order_status)
  );
  
  const completedOrders = orders.filter(o => 
    o.order_status && ["delivered", "cancelled", "completed", "inactive"].includes(o.order_status)
  );

  const currentOrders = activeTab === 0 ? ongoingOrders : completedOrders;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-700";
      case "confirmed": return "bg-blue-100 text-blue-700";
      case "subscription_active": return "bg-purple-100 text-purple-700";
      case "delivered": return "bg-green-100 text-green-700";
      case "cancelled": return "bg-red-100 text-red-700";
      case "inactive": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "subscription_active": return "Active Subscription";
      case "inactive": return "Subscription Ended";
      default: return status?.charAt(0).toUpperCase() + status?.slice(1);
    }
  };

  const getOrderStepIndex = (status: string) => {
    const index = orderSteps.findIndex(s => s.status === status);
    return index >= 0 ? index : 0;
  };

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
            {tab} ({i === 0 ? ongoingOrders.length : completedOrders.length})
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
          {!user ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-card rounded-2xl p-8 shadow-card flex flex-col items-center"
            >
              <Package className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4 text-center">Please login to view your orders</p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/auth")}
                className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium"
              >
                Login
              </motion.button>
            </motion.div>
          ) : isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : currentOrders.length === 0 ? (
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
              {currentOrders.map((order, i) => (
                <motion.div
                  key={order.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card rounded-2xl shadow-card overflow-hidden"
                >
                  {/* Order Header */}
                  <div 
                    className="p-4 cursor-pointer"
                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-orange-100 rounded-xl">
                          <Package className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {order.items?.[0]?.name || "Order"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.items?.[0]?.packSize} eggs × {order.items?.[0]?.quantity || 1}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(order.order_status || "pending")}>
                        {getStatusLabel(order.order_status || "pending")}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-sm mb-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <RefreshCw className="w-4 h-4" />
                        <span>{order.items?.[0]?.frequency || "One Time"}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Ordered: {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-border flex items-center justify-between">
                      <p className="text-lg font-bold text-primary">₹{order.total_amount}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.payment_status === "completed" ? "Paid" : "Payment Pending"}
                      </p>
                    </div>
                  </div>

                  {/* Expanded Order Details */}
                  <AnimatePresence>
                    {expandedOrder === order.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-border overflow-hidden"
                      >
                        <div className="p-4 space-y-4 bg-secondary/30">
                          {/* Order Tracking */}
                          <div>
                            <p className="text-sm font-semibold text-foreground mb-3">Order Tracking</p>
                            <div className="flex items-center justify-between">
                              {orderSteps.map((step, idx) => {
                                const currentStep = getOrderStepIndex(order.order_status || "pending");
                                const isActive = idx <= currentStep;
                                const Icon = step.icon;
                                
                                return (
                                  <div key={step.status} className="flex flex-col items-center flex-1">
                                    <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                                      isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                                    }`}>
                                      <Icon className="w-4 h-4" />
                                    </div>
                                    <p className={`text-xs mt-1 text-center ${isActive ? "text-primary font-medium" : "text-muted-foreground"}`}>
                                      {step.label}
                                    </p>
                                    {idx < orderSteps.length - 1 && (
                                      <div className={`absolute h-0.5 w-full top-4 left-1/2 ${
                                        idx < currentStep ? "bg-primary" : "bg-secondary"
                                      }`} />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Delivery Details */}
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-foreground">Delivery Details</p>
                            <div className="flex items-start gap-2 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span>{order.address}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="w-4 h-4" />
                              <span>{order.phone}</span>
                            </div>
                            {order.subscription_end_date && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                <span>Ends: {new Date(order.subscription_end_date).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>

                          {/* Order ID */}
                          <p className="text-xs text-muted-foreground">
                            Order ID: {order.id.slice(0, 8).toUpperCase()}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </MobileLayout>
  );
};

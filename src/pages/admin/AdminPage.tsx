import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Package, ShoppingCart, MapPin, TrendingUp, Bell, ArrowLeft, ChevronRight,
  LayoutDashboard, Tag, Settings
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const AdminPage = () => {
  const navigate = useNavigate();
  const { isAdmin, isLoading } = useAuth();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalCommunities: 0,
    activeSubscriptions: 0
  });

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate("/account");
    }
  }, [isAdmin, isLoading, navigate]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [productsRes, ordersRes, communitiesRes] = await Promise.all([
      supabase.from("products").select("id", { count: "exact" }),
      supabase.from("orders").select("id", { count: "exact" }),
      supabase.from("communities").select("id", { count: "exact" })
    ]);

    setStats({
      totalProducts: productsRes.count || 0,
      totalOrders: ordersRes.count || 0,
      totalCommunities: communitiesRes.count || 0,
      activeSubscriptions: 0
    });
  };

  const statCards = [
    { label: "Total Products", value: stats.totalProducts, icon: Package, color: "bg-blue-100 text-blue-600" },
    { label: "Total Orders", value: stats.totalOrders, icon: ShoppingCart, color: "bg-green-100 text-green-600" },
    { label: "Communities", value: stats.totalCommunities, icon: MapPin, color: "bg-purple-100 text-purple-600" },
    { label: "Active Subs", value: stats.activeSubscriptions, icon: TrendingUp, color: "bg-orange-100 text-orange-600" },
  ];

  const quickActions = [
    { label: "Products", desc: `${stats.totalProducts} total`, icon: Package, to: "/admin/products", color: "bg-blue-50 text-blue-600" },
    { label: "Orders", desc: `${stats.totalOrders} total`, icon: ShoppingCart, to: "/admin/orders", color: "bg-green-50 text-green-600" },
    { label: "Communities", desc: `${stats.totalCommunities} total`, icon: MapPin, to: "/admin/communities", color: "bg-purple-50 text-purple-600" },
    { label: "Subscriptions", desc: `${stats.activeSubscriptions} total`, icon: TrendingUp, to: "#", color: "bg-orange-50 text-orange-600" },
    { label: "Announcements", desc: "0 total", icon: Bell, to: "/admin/notifications", color: "bg-pink-50 text-pink-600" },
    { label: "Offers", desc: "Manage offers", icon: Tag, to: "/admin/offers", color: "bg-cyan-50 text-cyan-600" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 pt-6 pb-8 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate("/account")} className="p-2 rounded-full bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <Link to="/home" className="text-white/80 text-sm">Back to App</Link>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/10 rounded-xl">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-white/70 text-sm">Manage your egg shop</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-4 -mt-4">
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl p-4 shadow-sm"
            >
              <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-6">
        <h2 className="text-lg font-bold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, i) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              onClick={() => navigate(action.to)}
              className="bg-white rounded-2xl p-4 shadow-sm text-left flex items-start justify-between"
            >
              <div>
                <div className={`w-10 h-10 ${action.color} rounded-xl flex items-center justify-center mb-3`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <p className="font-semibold text-foreground">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.desc}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};
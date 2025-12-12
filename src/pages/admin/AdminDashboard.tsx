import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingCart, IndianRupee, Package, TrendingUp } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    pendingOrders: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [ordersRes, productsRes] = await Promise.all([
        supabase.from("orders").select("*"),
        supabase.from("products").select("id")
      ]);

      const orders = ordersRes.data || [];
      const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
      const pendingOrders = orders.filter(o => o.order_status === "pending").length;

      setStats({
        totalOrders: orders.length,
        totalRevenue,
        totalProducts: productsRes.data?.length || 0,
        pendingOrders
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const statCards = [
    { label: "Total Orders", value: stats.totalOrders, icon: ShoppingCart, color: "bg-amber-500" },
    { label: "Total Revenue", value: `₹${stats.totalRevenue.toLocaleString()}`, icon: IndianRupee, color: "bg-green-600" },
    { label: "Products", value: stats.totalProducts, icon: Package, color: "bg-amber-600" },
    { label: "Pending Orders", value: stats.pendingOrders, icon: TrendingUp, color: "bg-orange-500" },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-amber-900/50 rounded-xl p-6 border border-amber-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-300 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold text-amber-100 mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-amber-900/50 rounded-xl p-6 border border-amber-800">
          <h3 className="text-lg font-semibold text-amber-100 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link to="/admin/products" className="block p-4 bg-amber-800/50 rounded-lg hover:bg-amber-800 transition-colors">
              <p className="text-amber-100 font-medium">Manage Products</p>
              <p className="text-amber-300 text-sm">Add, edit or remove products</p>
            </Link>
            <Link to="/admin/orders" className="block p-4 bg-amber-800/50 rounded-lg hover:bg-amber-800 transition-colors">
              <p className="text-amber-100 font-medium">View Orders</p>
              <p className="text-amber-300 text-sm">Process pending orders</p>
            </Link>
            <Link to="/admin/notifications" className="block p-4 bg-amber-800/50 rounded-lg hover:bg-amber-800 transition-colors">
              <p className="text-amber-100 font-medium">Send Notification</p>
              <p className="text-amber-300 text-sm">Notify all users</p>
            </Link>
          </div>
        </div>

        <div className="bg-amber-900/50 rounded-xl p-6 border border-amber-800">
          <h3 className="text-lg font-semibold text-amber-100 mb-4">Recent Activity</h3>
          <div className="text-center py-8 text-amber-300">
            <p>No recent activity</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

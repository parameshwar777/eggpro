import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, Package, ShoppingCart, Bell, Tag, 
  LogOut, Menu, X, TrendingUp, Users, IndianRupee
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, isAdmin, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    pendingOrders: 0
  });

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate("/admin/login");
    }
  }, [isAdmin, isLoading, navigate]);

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

  const handleLogout = async () => {
    await signOut();
    navigate("/admin/login");
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
    { icon: Package, label: "Products", path: "/admin/products" },
    { icon: ShoppingCart, label: "Orders", path: "/admin/orders" },
    { icon: Bell, label: "Notifications", path: "/admin/notifications" },
    { icon: Tag, label: "Offers", path: "/admin/offers" },
  ];

  const statCards = [
    { label: "Total Orders", value: stats.totalOrders, icon: ShoppingCart, color: "bg-blue-500" },
    { label: "Total Revenue", value: `₹${stats.totalRevenue.toLocaleString()}`, icon: IndianRupee, color: "bg-green-500" },
    { label: "Products", value: stats.totalProducts, icon: Package, color: "bg-purple-500" },
    { label: "Pending Orders", value: stats.pendingOrders, icon: TrendingUp, color: "bg-orange-500" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-800 transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 transition-transform duration-200`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">EggPro Admin</h1>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400">
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive 
                      ? "bg-primary text-white" 
                      : "text-slate-400 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-700">
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-700"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        <header className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400">
            <Menu className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-semibold text-white">Dashboard</h2>
          <div className="w-6" />
        </header>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-800 rounded-xl p-6 border border-slate-700"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">{stat.label}</p>
                    <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link to="/admin/products" className="block p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
                  <p className="text-white font-medium">Manage Products</p>
                  <p className="text-slate-400 text-sm">Add, edit or remove products</p>
                </Link>
                <Link to="/admin/orders" className="block p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
                  <p className="text-white font-medium">View Orders</p>
                  <p className="text-slate-400 text-sm">Process pending orders</p>
                </Link>
                <Link to="/admin/notifications" className="block p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
                  <p className="text-white font-medium">Send Notification</p>
                  <p className="text-slate-400 text-sm">Notify all users</p>
                </Link>
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
              <div className="text-center py-8 text-slate-400">
                <p>No recent activity</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
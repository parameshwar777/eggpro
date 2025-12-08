import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Package, ShoppingCart, Bell, Tag, 
  LogOut, Menu, X, Eye, RefreshCw, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: string;
  community: string;
  address: string;
  phone: string;
  items: any;
  total_amount: number;
  payment_status: string | null;
  payment_id: string | null;
  order_status: string | null;
  created_at: string;
  customer_name: string | null;
  subscription_end_date: string | null;
  user_id: string;
}

export const AdminOrders = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { signOut, isAdmin, isLoading: authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate("/admin/login");
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ order_status: status })
        .eq("id", orderId);
      if (error) throw error;
      toast({ title: "Success", description: "Order status updated" });
      fetchOrders();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
    { icon: Users, label: "Communities", path: "/admin/communities" },
    { icon: Bell, label: "Notifications", path: "/admin/notifications" },
    { icon: Tag, label: "Offers", path: "/admin/offers" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500";
      case "confirmed": return "bg-blue-500";
      case "delivered": return "bg-green-500";
      case "cancelled": return "bg-red-500";
      case "subscription_active": return "bg-purple-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "subscription_active": return "Subscription Active";
      default: return status?.charAt(0).toUpperCase() + status?.slice(1);
    }
  };

  // Extract door number and pincode from address
  const parseAddress = (address: string) => {
    const parts = address.split(",").map(p => p.trim());
    const doorNumber = parts[0] || "";
    const pincodeMatch = address.match(/(\d{6})/);
    const pincode = pincodeMatch ? pincodeMatch[1] : "";
    return { doorNumber, pincode };
  };

  // Get subscription type and end date
  const getSubscriptionInfo = (items: any) => {
    if (!items || !items[0]) return { frequency: "N/A", startDate: "N/A", endDate: "N/A" };
    const item = items[0];
    const frequency = item.frequency || "one-time";
    const startDate = item.startDate || "N/A";
    
    // Calculate end date based on frequency (assume 30 days for monthly subscriptions)
    let endDate = "N/A";
    if (startDate !== "N/A") {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1); // Default 1 month subscription
      endDate = end.toLocaleDateString();
    }
    
    return { frequency, startDate, endDate };
  };

  // Count subscriptions
  const subscriptionCount = orders.filter(o => o.order_status === "subscription_active").length;

  if (authLoading) {
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
                <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? "bg-primary text-white" : "text-slate-400 hover:bg-slate-700 hover:text-white"}`}>
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-700">
            <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-700" onClick={handleLogout}>
              <LogOut className="w-5 h-5 mr-3" /> Logout
            </Button>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        <header className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400">
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-semibold text-white">Orders</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-purple-500/20 px-4 py-2 rounded-lg">
              <RefreshCw className="w-5 h-5 text-purple-400" />
              <span className="text-purple-400 font-medium">{subscriptionCount} Active Subscriptions</span>
            </div>
          </div>
        </header>

        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-slate-400">No orders yet</div>
          ) : (
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="text-left p-4 text-slate-300 font-medium">Order ID</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Customer</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Phone</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Door No.</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Community</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Pincode</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Product</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Subscription</th>
                    <th className="text-left p-4 text-slate-300 font-medium">End Date</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Amount</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Status</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const { doorNumber, pincode } = parseAddress(order.address);
                    const { frequency, endDate } = getSubscriptionInfo(order.items);
                    
                    return (
                      <tr key={order.id} className="border-t border-slate-700">
                        <td className="p-4 text-white font-mono text-sm">{order.id.slice(0, 8)}...</td>
                        <td className="p-4 text-slate-300">{order.customer_name || "—"}</td>
                        <td className="p-4 text-slate-300">{order.phone}</td>
                        <td className="p-4 text-slate-300">{doorNumber}</td>
                        <td className="p-4 text-slate-300">{order.community}</td>
                        <td className="p-4 text-slate-300">{pincode || "—"}</td>
                        <td className="p-4 text-slate-300">
                          {order.items?.[0]?.name || "—"}
                          <span className="text-xs text-slate-500 block">
                            {order.items?.[0]?.packSize} eggs × {order.items?.[0]?.quantity || 1}
                          </span>
                        </td>
                        <td className="p-4">
                          <Badge className={frequency === "daily" ? "bg-green-600" : frequency === "alternate" ? "bg-blue-600" : frequency === "weekly" ? "bg-purple-600" : "bg-gray-600"}>
                            {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
                          </Badge>
                        </td>
                        <td className="p-4 text-slate-300">{endDate}</td>
                        <td className="p-4 text-white">₹{order.total_amount}</td>
                        <td className="p-4">
                          <Badge className={getStatusColor(order.order_status || "pending")}>
                            {getStatusLabel(order.order_status || "pending")}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => setSelectedOrder(order)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Select defaultValue={order.order_status || "pending"} onValueChange={(value) => updateOrderStatus(order.id, value)}>
                              <SelectTrigger className="w-32 bg-slate-700 border-slate-600">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="subscription_active">Subscription Active</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-sm">Order ID</p>
                  <p className="text-white font-mono text-sm">{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Payment ID</p>
                  <p className="text-white font-mono text-sm">{selectedOrder.payment_id || "—"}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-sm">Customer Name</p>
                  <p className="text-white">{selectedOrder.customer_name || "—"}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Phone</p>
                  <p className="text-white">{selectedOrder.phone}</p>
                </div>
              </div>

              <div>
                <p className="text-slate-400 text-sm">Community</p>
                <p className="text-white">{selectedOrder.community}</p>
              </div>

              <div>
                <p className="text-slate-400 text-sm">Full Address</p>
                <p className="text-white">{selectedOrder.address}</p>
              </div>

              <div>
                <p className="text-slate-400 text-sm">Subscription Details</p>
                <div className="mt-2 space-y-1">
                  <p className="text-white">Frequency: {selectedOrder.items?.[0]?.frequency || "One-time"}</p>
                  <p className="text-white">Start Date: {selectedOrder.items?.[0]?.startDate || "—"}</p>
                  <p className="text-white">End Date: {getSubscriptionInfo(selectedOrder.items).endDate}</p>
                </div>
              </div>

              <div>
                <p className="text-slate-400 text-sm">Items</p>
                <div className="space-y-2 mt-2">
                  {selectedOrder.items?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-white bg-slate-700/50 p-2 rounded">
                      <span>{item.name} ({item.packSize} eggs) x{item.quantity}</span>
                      <span>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-700">
                <div className="flex justify-between text-white font-bold text-lg">
                  <span>Total</span>
                  <span>₹{selectedOrder.total_amount}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

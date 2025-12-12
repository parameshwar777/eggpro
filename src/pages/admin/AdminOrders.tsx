import { useState, useEffect } from "react";
import { Eye, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminLayout } from "@/components/admin/AdminLayout";
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
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
    // Check for expired subscriptions
    checkExpiredSubscriptions();
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

  const checkExpiredSubscriptions = async () => {
    try {
      const now = new Date().toISOString();
      // Update orders where subscription has ended
      const { error } = await supabase
        .from("orders")
        .update({ order_status: "inactive" })
        .eq("order_status", "confirmed")
        .lt("subscription_end_date", now);
      
      if (error) console.error("Error updating expired subscriptions:", error);
    } catch (error) {
      console.error("Error checking expired subscriptions:", error);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500";
      case "confirmed": return "bg-green-500";
      case "inactive": return "bg-gray-500";
      case "cancelled": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed": return "Active";
      case "inactive": return "Inactive";
      default: return status?.charAt(0).toUpperCase() + status?.slice(1);
    }
  };

  const parseAddress = (address: string) => {
    const parts = address.split(",").map(p => p.trim());
    const doorNumber = parts[0] || "";
    const pincodeMatch = address.match(/(\d{6})/);
    const pincode = pincodeMatch ? pincodeMatch[1] : "";
    return { doorNumber, pincode };
  };

  const getSubscriptionInfo = (items: any, endDate: string | null) => {
    if (!items || !items[0]) return { frequency: "N/A", startDate: "N/A", endDate: "N/A" };
    const item = items[0];
    const frequency = item.frequency || "one-time";
    const startDate = item.startDate || "N/A";
    
    return { 
      frequency, 
      startDate,
      endDate: endDate ? new Date(endDate).toLocaleDateString() : "N/A"
    };
  };

  const activeCount = orders.filter(o => o.order_status === "confirmed").length;

  const headerActions = (
    <div className="flex items-center gap-2 bg-green-600/20 px-4 py-2 rounded-lg">
      <RefreshCw className="w-5 h-5 text-green-400" />
      <span className="text-green-400 font-medium">{activeCount} Active Subscriptions</span>
    </div>
  );

  return (
    <AdminLayout title="Orders" headerActions={headerActions}>
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-amber-300">No orders yet</div>
      ) : (
        <div className="bg-amber-900/50 rounded-xl border border-amber-800 overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-amber-800/50">
              <tr>
                <th className="text-left p-4 text-amber-200 font-medium">Order ID</th>
                <th className="text-left p-4 text-amber-200 font-medium">Customer</th>
                <th className="text-left p-4 text-amber-200 font-medium">Phone</th>
                <th className="text-left p-4 text-amber-200 font-medium">Door No.</th>
                <th className="text-left p-4 text-amber-200 font-medium">Community</th>
                <th className="text-left p-4 text-amber-200 font-medium">Pincode</th>
                <th className="text-left p-4 text-amber-200 font-medium">Product</th>
                <th className="text-left p-4 text-amber-200 font-medium">Subscription</th>
                <th className="text-left p-4 text-amber-200 font-medium">End Date</th>
                <th className="text-left p-4 text-amber-200 font-medium">Amount</th>
                <th className="text-left p-4 text-amber-200 font-medium">Status</th>
                <th className="text-left p-4 text-amber-200 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const { doorNumber, pincode } = parseAddress(order.address);
                const { frequency, endDate } = getSubscriptionInfo(order.items, order.subscription_end_date);
                
                return (
                  <tr key={order.id} className="border-t border-amber-800">
                    <td className="p-4 text-amber-100 font-mono text-sm">{order.id.slice(0, 8)}...</td>
                    <td className="p-4 text-amber-200">{order.customer_name || "—"}</td>
                    <td className="p-4 text-amber-200">{order.phone}</td>
                    <td className="p-4 text-amber-200">{doorNumber}</td>
                    <td className="p-4 text-amber-200">{order.community}</td>
                    <td className="p-4 text-amber-200">{pincode || "—"}</td>
                    <td className="p-4 text-amber-200">
                      {order.items?.[0]?.name || "—"}
                      <span className="text-xs text-amber-400 block">
                        {order.items?.[0]?.packSize} eggs × {order.items?.[0]?.quantity || 1}
                      </span>
                    </td>
                    <td className="p-4">
                      <Badge className={frequency === "daily" ? "bg-green-600" : frequency === "alternate" ? "bg-blue-600" : frequency === "weekly" ? "bg-purple-600" : "bg-gray-600"}>
                        {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
                      </Badge>
                    </td>
                    <td className="p-4 text-amber-200">{endDate}</td>
                    <td className="p-4 text-amber-100">₹{order.total_amount}</td>
                    <td className="p-4">
                      <Badge className={getStatusColor(order.order_status || "pending")}>
                        {getStatusLabel(order.order_status || "pending")}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" className="text-amber-300 hover:text-amber-100 hover:bg-amber-800" onClick={() => setSelectedOrder(order)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Select defaultValue={order.order_status || "pending"} onValueChange={(value) => updateOrderStatus(order.id, value)}>
                          <SelectTrigger className="w-28 bg-amber-800 border-amber-700 text-amber-100 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-amber-900 border-amber-700">
                            <SelectItem value="pending" className="text-amber-100">Pending</SelectItem>
                            <SelectItem value="confirmed" className="text-amber-100">Active</SelectItem>
                            <SelectItem value="inactive" className="text-amber-100">Inactive</SelectItem>
                            <SelectItem value="cancelled" className="text-amber-100">Cancelled</SelectItem>
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

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="bg-amber-900 border-amber-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-amber-100">Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-amber-400 text-sm">Order ID</p>
                  <p className="text-amber-100 font-mono text-sm">{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-amber-400 text-sm">Payment ID</p>
                  <p className="text-amber-100 font-mono text-sm">{selectedOrder.payment_id || "—"}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-amber-400 text-sm">Customer Name</p>
                  <p className="text-amber-100">{selectedOrder.customer_name || "—"}</p>
                </div>
                <div>
                  <p className="text-amber-400 text-sm">Phone</p>
                  <p className="text-amber-100">{selectedOrder.phone}</p>
                </div>
              </div>

              <div>
                <p className="text-amber-400 text-sm">Community</p>
                <p className="text-amber-100">{selectedOrder.community}</p>
              </div>

              <div>
                <p className="text-amber-400 text-sm">Full Address</p>
                <p className="text-amber-100">{selectedOrder.address}</p>
              </div>

              <div>
                <p className="text-amber-400 text-sm">Subscription Details</p>
                <div className="mt-2 space-y-1">
                  <p className="text-amber-100">Frequency: {selectedOrder.items?.[0]?.frequency || "One-time"}</p>
                  <p className="text-amber-100">Start Date: {selectedOrder.items?.[0]?.startDate || "—"}</p>
                  <p className="text-amber-100">End Date: {selectedOrder.subscription_end_date ? new Date(selectedOrder.subscription_end_date).toLocaleDateString() : "—"}</p>
                </div>
              </div>

              <div>
                <p className="text-amber-400 text-sm">Items</p>
                <div className="space-y-2 mt-2">
                  {selectedOrder.items?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-amber-100 bg-amber-800/50 p-2 rounded">
                      <span>{item.name} ({item.packSize} eggs) x{item.quantity}</span>
                      <span>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-amber-700">
                <div className="flex justify-between text-amber-100 font-bold text-lg">
                  <span>Total</span>
                  <span>₹{selectedOrder.total_amount}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

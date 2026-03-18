import { useState, useEffect } from "react";
import { Eye, RefreshCw, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MerchantLayout } from "@/components/merchant/MerchantLayout";
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

export const MerchantOrders = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [adminWhatsapp, setAdminWhatsapp] = useState("919440229378");

  useEffect(() => {
    fetchOrders();
    fetchAdminWhatsapp();
  }, []);

  const fetchAdminWhatsapp = async () => {
    try {
      const { data } = await supabase
        .from("admin_settings")
        .select("value")
        .eq("key", "admin_whatsapp")
        .single();
      if (data) setAdminWhatsapp(data.value);
    } catch (error) {
      console.error("Error fetching admin WhatsApp:", error);
    }
  };

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

  const sendWhatsAppNotification = (order: Order) => {
    const itemsList = order.items?.map((i: any) => `${i.name} (${i.packSize} eggs) x${i.quantity}`).join("\n") || "";
    const frequency = order.items?.[0]?.frequency || "one-time";
    const endDate = order.subscription_end_date ? new Date(order.subscription_end_date).toLocaleDateString() : "N/A";

    const message = `🥚 *Order - EggPro*\n\n📋 *Order ID:* ${order.id.slice(0, 8).toUpperCase()}\n👤 *Customer:* ${order.customer_name || "N/A"}\n📞 *Phone:* ${order.phone}\n🏠 *Address:* ${order.address}\n📍 *Community:* ${order.community}\n\n📦 *Items:*\n${itemsList}\n\n🔄 *Frequency:* ${frequency}\n📅 *End Date:* ${endDate}\n💰 *Total:* ₹${order.total_amount}`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${adminWhatsapp}?text=${encodedMessage}`, "_blank");
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
    return { doorNumber: parts[0] || "" };
  };

  const activeCount = orders.filter(o => o.order_status === "confirmed").length;

  const headerActions = (
    <div className="flex items-center gap-2 bg-green-600/20 px-4 py-2 rounded-lg">
      <RefreshCw className="w-5 h-5 text-green-400" />
      <span className="text-green-400 font-medium">{activeCount} Active</span>
    </div>
  );

  return (
    <MerchantLayout title="Orders" headerActions={headerActions}>
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-slate-300">No orders yet</div>
      ) : (
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="text-left p-4 text-slate-200 font-medium">Order ID</th>
                <th className="text-left p-4 text-slate-200 font-medium">Customer</th>
                <th className="text-left p-4 text-slate-200 font-medium">Phone</th>
                <th className="text-left p-4 text-slate-200 font-medium">Door No.</th>
                <th className="text-left p-4 text-slate-200 font-medium">Community</th>
                <th className="text-left p-4 text-slate-200 font-medium">Product</th>
                <th className="text-left p-4 text-slate-200 font-medium">Amount</th>
                <th className="text-left p-4 text-slate-200 font-medium">Status</th>
                <th className="text-left p-4 text-slate-200 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const { doorNumber } = parseAddress(order.address);
                const frequency = order.items?.[0]?.frequency || "one-time";

                return (
                  <tr key={order.id} className="border-t border-slate-800">
                    <td className="p-4 text-slate-100 font-mono text-sm">{order.id.slice(0, 8)}...</td>
                    <td className="p-4 text-slate-200">{order.customer_name || "—"}</td>
                    <td className="p-4 text-slate-200">{order.phone}</td>
                    <td className="p-4 text-slate-200">{doorNumber}</td>
                    <td className="p-4 text-slate-200">{order.community}</td>
                    <td className="p-4 text-slate-200">
                      {order.items?.[0]?.name || "—"}
                      <span className="text-xs text-slate-400 block">
                        {order.items?.[0]?.packSize} eggs × {order.items?.[0]?.quantity || 1}
                      </span>
                    </td>
                    <td className="p-4 text-slate-100 font-bold">₹{order.total_amount}</td>
                    <td className="p-4">
                      <Badge className={getStatusColor(order.order_status || "pending")}>
                        {getStatusLabel(order.order_status || "pending")}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-slate-300 hover:text-slate-100 hover:bg-slate-800"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-green-400 hover:text-green-200 hover:bg-green-800/50"
                          onClick={() => sendWhatsAppNotification(order)}
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                        <Select defaultValue={order.order_status || "pending"} onValueChange={(value) => updateOrderStatus(order.id, value)}>
                          <SelectTrigger className="w-24 bg-slate-800 border-slate-700 text-slate-100 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-700">
                            <SelectItem value="pending" className="text-slate-100">Pending</SelectItem>
                            <SelectItem value="confirmed" className="text-slate-100">Active</SelectItem>
                            <SelectItem value="inactive" className="text-slate-100">Inactive</SelectItem>
                            <SelectItem value="cancelled" className="text-slate-100">Cancelled</SelectItem>
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
        <DialogContent className="bg-slate-900 border-slate-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-sm">Order ID</p>
                  <p className="text-slate-100 font-mono text-sm">{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Payment ID</p>
                  <p className="text-slate-100 font-mono text-sm break-all">{selectedOrder.payment_id || "—"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-sm">Customer</p>
                  <p className="text-slate-100">{selectedOrder.customer_name || "—"}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Phone</p>
                  <p className="text-slate-100">{selectedOrder.phone}</p>
                </div>
              </div>

              <div>
                <p className="text-slate-400 text-sm">Community</p>
                <p className="text-slate-100">{selectedOrder.community}</p>
              </div>

              <div>
                <p className="text-slate-400 text-sm">Full Address</p>
                <p className="text-slate-100">{selectedOrder.address}</p>
              </div>

              <div>
                <p className="text-slate-400 text-sm">Items</p>
                <div className="space-y-2 mt-2">
                  {selectedOrder.items?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-slate-100 bg-slate-800/50 p-2 rounded">
                      <span>{item.name} ({item.packSize} eggs) x{item.quantity}</span>
                      <span>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-700">
                <div className="flex justify-between text-slate-100 font-bold text-lg">
                  <span>Total</span>
                  <span>₹{selectedOrder.total_amount}</span>
                </div>
              </div>

              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={() => sendWhatsAppNotification(selectedOrder)}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Send to WhatsApp
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MerchantLayout>
  );
};

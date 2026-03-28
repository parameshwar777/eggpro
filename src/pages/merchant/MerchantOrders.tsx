import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Download, Printer, Search, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MerchantLayout } from "@/components/merchant/MerchantLayout";
import { MerchantOrderCard } from "@/components/merchant/MerchantOrderCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCapacitorOrderNotification } from "@/components/CapacitorNotificationManager";

export interface MerchantOrder {
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

const playNotificationSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    [0, 0.3, 0.6].forEach(delay => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = 880;
      osc.type = "sine";
      gain.gain.value = 0.3;
      osc.start(audioCtx.currentTime + delay);
      osc.stop(audioCtx.currentTime + delay + 0.15);
    });
  } catch (e) {
    console.log("Could not play notification sound:", e);
  }
};

const isToday = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
};

export const MerchantOrders = () => {
  const { toast } = useToast();
  const { notify } = useCapacitorOrderNotification();
  const [orders, setOrders] = useState<MerchantOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showTodayOnly, setShowTodayOnly] = useState(false);
  const [communityFilter, setCommunityFilter] = useState<string>("all");

  const fetchOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("payment_status", "completed")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching orders:", error);
      return [];
    }
  }, []);

  useEffect(() => {
    fetchOrders().then(data => {
      setOrders(data);
      setIsLoading(false);
    });

    const channel = supabase
      .channel("merchant-orders")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
        const newOrder = payload.new as any;
        if (newOrder?.payment_status === "completed") {
          playNotificationSound();
          notify("🥚 New Order Received!", `₹${newOrder.total_amount} from ${newOrder.customer_name || "Customer"}`);
          toast({ title: "🥚 New Order Received!", description: `₹${newOrder.total_amount} from ${newOrder.customer_name || "Customer"}` });
        }
        fetchOrders().then(setOrders);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, (payload) => {
        const updated = payload.new as any;
        const old = payload.old as any;
        if (old?.payment_status !== "completed" && updated?.payment_status === "completed") {
          playNotificationSound();
          notify("🥚 New Order Received!", `₹${updated.total_amount} from ${updated.customer_name || "Customer"}`);
          toast({ title: "🥚 New Order Received!", description: `₹${updated.total_amount} from ${updated.customer_name || "Customer"}` });
        }
        fetchOrders().then(setOrders);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchOrders, toast, notify]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ order_status: status })
        .eq("id", orderId);
      if (error) throw error;
      toast({ title: "✅ Status Updated", description: `Order marked as ${status}` });
      fetchOrders().then(setOrders);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Get unique communities
  const communities = [...new Set(orders.map(o => o.community))].sort();

  // Apply all filters
  const filteredOrders = orders.filter(o => {
    if (statusFilter !== "all" && o.order_status !== statusFilter) return false;
    if (showTodayOnly && !isToday(o.created_at)) return false;
    if (communityFilter !== "all" && o.community !== communityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        (o.customer_name || "").toLowerCase().includes(q) ||
        o.phone.includes(q) ||
        o.address.toLowerCase().includes(q) ||
        o.community.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const statusCounts = {
    all: orders.length,
    pending: orders.filter(o => o.order_status === "pending").length,
    confirmed: orders.filter(o => o.order_status === "confirmed").length,
    delivered: orders.filter(o => o.order_status === "delivered").length,
    cancelled: orders.filter(o => o.order_status === "cancelled").length,
  };

  const todayCount = orders.filter(o => isToday(o.created_at)).length;

  const handleDownloadCSV = () => {
    const headers = ["Order ID", "Customer", "Phone", "Community", "Address", "Items", "Amount", "Status", "Date"];
    const rows = filteredOrders.map(o => [
      o.id.slice(0, 8).toUpperCase(),
      o.customer_name || "N/A",
      o.phone,
      o.community,
      `"${o.address}"`,
      `"${o.items?.map((i: any) => `${i.name} (${i.packSize}eggs) x${i.quantity}`).join(", ") || ""}"`,
      `₹${o.total_amount}`,
      o.order_status || "pending",
      new Date(o.created_at).toLocaleDateString(),
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "📥 Downloaded", description: "Orders CSV file downloaded" });
  };

  const handlePrint = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>EggPro Orders - ${new Date().toLocaleDateString()}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #1a1a1a; }
        h1 { font-size: 22px; margin-bottom: 4px; }
        .subtitle { color: #666; margin-bottom: 20px; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f5f5f5; font-weight: 600; }
        .status { padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
        @media print { body { padding: 0; } }
      </style></head><body>
      <h1>🥚 EggPro - Delivery Orders</h1>
      <div class="subtitle">${new Date().toLocaleDateString()} · ${filteredOrders.length} orders</div>
      <table><thead><tr><th>#</th><th>Customer</th><th>Phone</th><th>Door/Address</th><th>Community</th><th>Items</th><th>Amount</th><th>Status</th></tr></thead>
      <tbody>${filteredOrders.map((o, i) => `<tr><td>${i + 1}</td><td>${o.customer_name || "N/A"}</td><td>${o.phone}</td><td>${o.address}</td><td>${o.community}</td><td>${o.items?.map((it: any) => `${it.name} (${it.packSize}) x${it.quantity}`).join(", ") || ""}</td><td>₹${o.total_amount}</td><td>${o.order_status || "pending"}</td></tr>`).join("")}</tbody></table></body></html>
    `);
    win.document.close();
    win.print();
  };

  const clearAllFilters = () => {
    setStatusFilter("all");
    setSearchQuery("");
    setShowTodayOnly(false);
    setCommunityFilter("all");
  };

  const hasActiveFilters = statusFilter !== "all" || searchQuery || showTodayOnly || communityFilter !== "all";

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800" onClick={handleDownloadCSV}>
        <Download className="w-4 h-4" />
      </Button>
      <Button size="sm" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800" onClick={handlePrint}>
        <Printer className="w-4 h-4" />
      </Button>
      <Button size="sm" variant="ghost" className="text-slate-300" onClick={() => { setIsLoading(true); fetchOrders().then(data => { setOrders(data); setIsLoading(false); }); }}>
        <RefreshCw className="w-4 h-4" />
      </Button>
    </div>
  );

  return (
    <MerchantLayout title="Orders" headerActions={headerActions}>
      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <Input
          placeholder="Search by name, phone, community..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-10 bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Filters Row */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setShowTodayOnly(!showTodayOnly)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
            showTodayOnly ? "bg-amber-500 text-amber-950" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
          }`}
        >
          <Calendar className="w-3 h-3" />
          Today ({todayCount})
        </button>

        {communities.length > 1 && communities.map(c => (
          <button
            key={c}
            onClick={() => setCommunityFilter(communityFilter === c ? "all" : c)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              communityFilter === c ? "bg-purple-500 text-purple-950" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            {c}
          </button>
        ))}

        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-red-500/20 text-red-400 hover:bg-red-500/30"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Status Filter Chips */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
        {(["all", "pending", "confirmed", "delivered", "cancelled"] as const).map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              statusFilter === status
                ? status === "all" ? "bg-primary text-primary-foreground"
                  : status === "pending" ? "bg-yellow-500 text-yellow-950"
                  : status === "confirmed" ? "bg-green-500 text-green-950"
                  : status === "delivered" ? "bg-blue-500 text-blue-950"
                  : "bg-red-500 text-red-950"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            {status === "all" ? "All" : status === "confirmed" ? "Active" : status.charAt(0).toUpperCase() + status.slice(1)}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusFilter === status ? "bg-white/20" : "bg-slate-700"}`}>
              {statusCounts[status]}
            </span>
          </button>
        ))}
      </div>

      {/* Results Summary */}
      {hasActiveFilters && (
        <p className="text-xs text-slate-500 mb-3">
          Showing {filteredOrders.length} of {orders.length} orders
        </p>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-4 bg-slate-800 rounded-full flex items-center justify-center">
            <Search className="w-10 h-10 text-slate-600" />
          </div>
          <p className="text-slate-400 text-lg">No orders found</p>
          {hasActiveFilters && (
            <button onClick={clearAllFilters} className="text-primary text-sm mt-2">Clear filters</button>
          )}
        </div>
      ) : (
        <div className="space-y-4 pb-8">
          {filteredOrders.map(order => (
            <MerchantOrderCard key={order.id} order={order} onStatusChange={updateOrderStatus} />
          ))}
        </div>
      )}
    </MerchantLayout>
  );
};

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Phone, MapPin, Package, Calendar, CreditCard, User, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { MerchantOrder } from "@/pages/merchant/MerchantOrders";

interface Props {
  order: MerchantOrder;
  onStatusChange: (orderId: string, status: string) => void;
}

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: "Pending", bg: "bg-yellow-500/20", text: "text-yellow-400" },
  confirmed: { label: "Active", bg: "bg-green-500/20", text: "text-green-400" },
  delivered: { label: "Delivered", bg: "bg-blue-500/20", text: "text-blue-400" },
  inactive: { label: "Inactive", bg: "bg-slate-500/20", text: "text-slate-400" },
  cancelled: { label: "Cancelled", bg: "bg-red-500/20", text: "text-red-400" },
};

export const MerchantOrderCard = ({ order, onStatusChange }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const status = order.order_status || "pending";
  const config = statusConfig[status] || statusConfig.pending;
  const doorNumber = order.address.split(",")[0]?.trim() || order.address;
  const frequency = order.items?.[0]?.frequency || "one-time";
  const endDate = order.subscription_end_date
    ? new Date(order.subscription_end_date).toLocaleDateString()
    : null;

  const sendWhatsApp = () => {
    const itemsList = order.items?.map((i: any) => `${i.name} (${i.packSize} eggs) x${i.quantity}`).join("\n") || "";
    const message = `🥚 *EggPro Order*\n\n📋 *ID:* ${order.id.slice(0, 8).toUpperCase()}\n👤 ${order.customer_name || "N/A"}\n📞 ${order.phone}\n🏠 ${order.address}\n📍 ${order.community}\n\n📦 *Items:*\n${itemsList}\n\n💰 *Total:* ₹${order.total_amount}`;
    window.open(`https://wa.me/${order.phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden"
    >
      {/* Compact Header */}
      <div
        className="p-4 cursor-pointer active:bg-slate-800/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-slate-100 truncate">
                {order.customer_name || "Unknown"}
              </span>
              <Badge className={`${config.bg} ${config.text} border-0 text-[11px] px-2 py-0.5`}>
                {config.label}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {doorNumber}
              </span>
              <span>•</span>
              <span>{order.community}</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              {order.items?.map((item: any, i: number) => (
                <span key={i} className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md">
                  {item.name} ({item.packSize}) ×{item.quantity || 1}
                </span>
              ))}
              <span className="font-bold text-primary text-sm ml-auto">₹{order.total_amount}</span>
            </div>
          </div>
          <div className="text-slate-500 mt-1">
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-slate-800 pt-3 space-y-3">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                <InfoItem icon={User} label="Customer" value={order.customer_name || "N/A"} />
                <InfoItem icon={Phone} label="Phone" value={order.phone} />
                <InfoItem icon={MapPin} label="Full Address" value={order.address} span2 />
                <InfoItem icon={Package} label="Frequency" value={frequency} />
                <InfoItem icon={Calendar} label="Order Date" value={new Date(order.created_at).toLocaleDateString()} />
                {endDate && <InfoItem icon={Calendar} label="End Date" value={endDate} />}
                {order.payment_id && <InfoItem icon={CreditCard} label="Payment ID" value={order.payment_id} span2 />}
              </div>

              {/* Items Breakdown */}
              <div className="bg-slate-800/50 rounded-xl p-3">
                <p className="text-xs font-medium text-slate-400 mb-2">ORDER ITEMS</p>
                {order.items?.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-center py-1.5 text-sm">
                    <span className="text-slate-200">
                      {item.name} <span className="text-slate-500">({item.packSize} eggs)</span> × {item.quantity || 1}
                    </span>
                    <span className="text-slate-100 font-semibold">₹{item.price * (item.quantity || 1)}</span>
                  </div>
                ))}
                <div className="border-t border-slate-700 mt-2 pt-2 flex justify-between font-bold text-base">
                  <span className="text-slate-200">Total</span>
                  <span className="text-primary">₹{order.total_amount}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                {status !== "delivered" && (
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                    onClick={() => onStatusChange(order.id, "delivered")}
                  >
                    ✅ Mark Delivered
                  </Button>
                )}
                {status === "pending" && (
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white flex-1"
                    onClick={() => onStatusChange(order.id, "confirmed")}
                  >
                    Confirm
                  </Button>
                )}
                {status === "delivered" && (
                  <Badge className="bg-blue-500/20 text-blue-400 border-0 py-2 px-4 text-sm">
                    ✅ Delivered
                  </Badge>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="border-green-700 text-green-400 hover:bg-green-900/30"
                  onClick={sendWhatsApp}
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  WhatsApp
                </Button>
                {status !== "cancelled" && status !== "delivered" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-400 hover:bg-red-900/30"
                    onClick={() => onStatusChange(order.id, "cancelled")}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const InfoItem = ({ icon: Icon, label, value, span2 }: { icon: any; label: string; value: string; span2?: boolean }) => (
  <div className={span2 ? "col-span-2" : ""}>
    <div className="flex items-center gap-1.5 text-slate-500 text-[11px] uppercase tracking-wide mb-0.5">
      <Icon className="w-3 h-3" />
      {label}
    </div>
    <p className="text-slate-200 text-sm break-all">{value}</p>
  </div>
);

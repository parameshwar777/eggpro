import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Bell, ShoppingBag, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const NotificationsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      markAllAsRead();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from("user_notifications")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setNotifications(data || []);
    setLoading(false);
  };

  const markAllAsRead = async () => {
    await supabase
      .from("user_notifications")
      .update({ is_read: true })
      .eq("user_id", user!.id)
      .eq("is_read", false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "order": return ShoppingBag;
      case "delivery": return Check;
      default: return Bell;
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="gradient-warm px-4 pt-6 pb-12 rounded-b-3xl">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-white/20"><ArrowLeft className="w-5 h-5 text-foreground" /></button>
          <h1 className="text-xl font-bold text-foreground">Notifications</h1>
        </div>
      </motion.div>

      <div className="px-4 py-4 -mt-4 space-y-3">
        {!user ? (
          <div className="bg-card rounded-2xl p-8 text-center">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Please login to see your notifications</p>
          </div>
        ) : loading ? (
          <div className="bg-card rounded-2xl p-8 text-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 text-center">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No notifications yet</p>
            <p className="text-xs text-muted-foreground mt-1">You'll get notified when you place an order or receive a delivery</p>
          </div>
        ) : (
          notifications.map((n, i) => {
            const Icon = getIcon(n.type);
            return (
              <motion.div key={n.id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.05 }} className={`bg-card rounded-xl p-4 shadow-card flex gap-3 ${!n.is_read ? 'border-l-4 border-primary' : ''}`}>
                <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0 h-fit">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm">{n.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">{new Date(n.created_at).toLocaleDateString()}</p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

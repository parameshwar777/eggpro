import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("notifications").select("*").eq("is_active", true).order("created_at", { ascending: false })
      .then(({ data }) => setNotifications(data || []));
  }, []);

  return (
    <div className="min-h-[100dvh] bg-background max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="gradient-warm px-4 pt-6 pb-12 rounded-b-3xl">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-white/20"><ArrowLeft className="w-5 h-5 text-foreground" /></button>
          <h1 className="text-xl font-bold text-foreground">Notifications</h1>
        </div>
      </motion.div>

      <div className="px-4 py-4 -mt-4 space-y-3">
        {notifications.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 text-center"><Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">No notifications yet</p></div>
        ) : (
          notifications.map((n, i) => (
            <motion.div key={n.id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.1 }} className="bg-card rounded-xl p-4 shadow-card">
              <h3 className="font-semibold text-foreground">{n.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
              <p className="text-xs text-muted-foreground mt-2">{new Date(n.created_at).toLocaleDateString()}</p>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
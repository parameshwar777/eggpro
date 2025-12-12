import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RefreshCw, Calendar, Package, Pause, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Subscription {
  id: string;
  items: any;
  total_amount: number;
  order_status: string | null;
  created_at: string;
  address: string;
  community: string;
  is_paused: boolean | null;
  paused_at: string | null;
  resume_at: string | null;
  subscription_end_date: string | null;
}

export const SubscriptionsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [resumeDate, setResumeDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (user) {
      fetchSubscriptions();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchSubscriptions = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .in("order_status", ["subscription_active", "confirmed"])
      .order("created_at", { ascending: false });

    if (!error && data) {
      setSubscriptions(data as Subscription[]);
    }
    setIsLoading(false);
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case "daily": return "Daily";
      case "alternate": return "Alternate Days";
      case "weekly": return "Weekly";
      default: return "One Time";
    }
  };

  const handlePauseSubscription = (sub: Subscription) => {
    setSelectedSubscription(sub);
    setResumeDate(undefined);
    setShowPauseDialog(true);
  };

  const confirmPause = async () => {
    if (!selectedSubscription || !resumeDate) {
      toast({ title: "Select resume date", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase
        .from("orders")
        .update({
          is_paused: true,
          paused_at: new Date().toISOString(),
          resume_at: resumeDate.toISOString()
        })
        .eq("id", selectedSubscription.id);

      if (error) throw error;

      toast({ title: "Subscription Paused", description: `Will resume on ${format(resumeDate, "dd MMM yyyy")}` });
      setShowPauseDialog(false);
      fetchSubscriptions();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleResumeSubscription = async (subId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          is_paused: false,
          paused_at: null,
          resume_at: null
        })
        .eq("id", subId);

      if (error) throw error;

      toast({ title: "Subscription Resumed" });
      fetchSubscriptions();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background w-full">
      <div className="max-w-lg mx-auto pb-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card px-4 py-4 flex items-center gap-3 border-b border-border sticky top-0 z-10"
        >
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-secondary"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <h1 className="text-lg font-semibold text-foreground">My Subscriptions</h1>
        </motion.div>

        {!user ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-4"
          >
            <div className="bg-card rounded-2xl p-8 shadow-card flex flex-col items-center">
              <RefreshCw className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4 text-center">Please login to view your subscriptions</p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/auth")}
                className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium"
              >
                Login
              </motion.button>
            </div>
          </motion.div>
        ) : isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : subscriptions.length === 0 ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-4"
          >
            <div className="bg-card rounded-2xl p-8 shadow-card flex flex-col items-center">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              >
                <RefreshCw className="w-16 h-16 text-muted-foreground mb-4" />
              </motion.div>
              <p className="text-lg font-medium text-foreground mb-2">No Active Subscriptions</p>
              <p className="text-muted-foreground mb-4 text-center">Start a subscription to get fresh eggs delivered regularly</p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/home")}
                className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium"
              >
                Browse Products
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <div className="p-4 space-y-4">
            {subscriptions.map((sub, i) => (
              <motion.div
                key={sub.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-2xl p-4 shadow-card"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-100 rounded-xl">
                      <Package className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {sub.items?.[0]?.name || "Eggs Subscription"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {sub.items?.[0]?.packSize} eggs × {sub.items?.[0]?.quantity || 1}
                      </p>
                    </div>
                  </div>
                  {sub.is_paused ? (
                    <Badge className="bg-yellow-100 text-yellow-700">Paused</Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-700">Active</Badge>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <RefreshCw className="w-4 h-4" />
                    <span>{getFrequencyLabel(sub.items?.[0]?.frequency || "daily")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Started: {new Date(sub.created_at).toLocaleDateString()}</span>
                  </div>
                  {sub.subscription_end_date && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Ends: {new Date(sub.subscription_end_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {sub.is_paused && sub.resume_at && (
                    <div className="flex items-center gap-2 text-yellow-600">
                      <Play className="w-4 h-4" />
                      <span>Resumes: {new Date(sub.resume_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                  <p className="text-lg font-bold text-primary">₹{sub.total_amount}</p>
                  {sub.is_paused ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResumeSubscription(sub.id)}
                      className="gap-1"
                    >
                      <Play className="w-4 h-4" />
                      Resume Now
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePauseSubscription(sub)}
                      className="gap-1"
                    >
                      <Pause className="w-4 h-4" />
                      Pause
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Pause Dialog */}
      <Dialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-sm mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Pause Subscription</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Select the date when you want to resume your subscription
            </p>
            <CalendarComponent
              mode="single"
              selected={resumeDate}
              onSelect={setResumeDate}
              disabled={(date) => date < new Date()}
              className="rounded-xl border mx-auto"
            />
            {resumeDate && (
              <p className="text-center text-sm">
                Resume on: <span className="font-semibold">{format(resumeDate, "dd MMM yyyy")}</span>
              </p>
            )}
            <Button className="w-full" onClick={confirmPause} disabled={!resumeDate}>
              Confirm Pause
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

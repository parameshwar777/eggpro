import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PaymentIssue {
  id: string;
  transaction_id: string | null;
  amount: number | null;
  description: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

export const PaymentIssuePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [transactionId, setTransactionId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [issues, setIssues] = useState<PaymentIssue[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchIssues();
  }, [user]);

  const fetchIssues = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("payment_issues")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setIssues((data as PaymentIssue[]) || []);
  };

  const handleSubmit = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!transactionId.trim() && !amount.trim() && !description.trim()) {
      toast({ title: "Add details", description: "Please share at least one detail.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("payment_issues").insert({
      user_id: user.id,
      transaction_id: transactionId.trim() || null,
      amount: amount ? parseFloat(amount) : null,
      description: description.trim() || null,
      status: "pending",
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Failed to submit", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Report submitted", description: "Admin will verify and update your order shortly." });
    setTransactionId("");
    setAmount("");
    setDescription("");
    fetchIssues();
  };

  const statusBadge = (status: string) => {
    if (status === "resolved") return { bg: "bg-green-100 text-green-700", icon: CheckCircle2, label: "Resolved" };
    if (status === "rejected") return { bg: "bg-red-100 text-red-700", icon: AlertCircle, label: "Rejected" };
    return { bg: "bg-yellow-100 text-yellow-700", icon: Clock, label: "Pending" };
  };

  return (
    <div className="page-scroll bg-[#FFF8E7] w-full">
      <div className="max-w-lg mx-auto pb-24">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-primary px-4 py-4 flex items-center gap-3 safe-top"
        >
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-card/20"
          >
            <ArrowLeft className="w-5 h-5 text-primary-foreground" />
          </motion.button>
          <h1 className="text-lg font-semibold text-primary-foreground">Payment Issue</h1>
        </motion.div>

        <div className="p-4 space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-900">
                <p className="font-semibold mb-1">Paid but order not showing?</p>
                <p>If the amount was deducted from your bank but your order doesn't appear in <b>My Orders</b>, share your transaction details below. Our admin will verify and confirm your order.</p>
              </div>
            </div>
          </div>

          {!user ? (
            <div className="bg-card rounded-2xl p-6 shadow-card text-center">
              <p className="text-muted-foreground mb-4">Please login to report a payment issue.</p>
              <Button onClick={() => navigate("/auth")}>Login</Button>
            </div>
          ) : (
            <>
              <div className="bg-card rounded-2xl p-4 shadow-card space-y-4">
                <h3 className="font-semibold text-foreground">Report a new issue</h3>

                <div>
                  <label className="text-sm font-medium text-foreground">Transaction / UPI Reference ID</label>
                  <Input
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="e.g. 432198765432"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Amount Paid (₹)</label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 250"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Description</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell us what happened (e.g. paid via GPay at 5:30 PM, order not visible)"
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  💡 You can share a screenshot of the payment receipt on our WhatsApp after submitting.
                </p>

                <Button onClick={handleSubmit} disabled={submitting} className="w-full">
                  {submitting ? "Submitting..." : "Submit Report"}
                </Button>
              </div>

              {issues.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground px-1">Your reports</h3>
                  {issues.map((iss) => {
                    const s = statusBadge(iss.status);
                    const Icon = s.icon;
                    return (
                      <div key={iss.id} className="bg-card rounded-2xl p-4 shadow-card">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            {iss.transaction_id && (
                              <p className="font-semibold text-foreground text-sm">Txn: {iss.transaction_id}</p>
                            )}
                            {iss.amount != null && (
                              <p className="text-sm text-muted-foreground">Amount: ₹{iss.amount}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(iss.created_at).toLocaleString()}
                            </p>
                          </div>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${s.bg}`}>
                            <Icon className="w-3 h-3" />
                            {s.label}
                          </span>
                        </div>
                        {iss.description && (
                          <p className="text-sm text-foreground mt-2">{iss.description}</p>
                        )}
                        {iss.admin_notes && (
                          <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-2">
                            <p className="text-xs font-semibold text-blue-900">Admin response:</p>
                            <p className="text-sm text-blue-900">{iss.admin_notes}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

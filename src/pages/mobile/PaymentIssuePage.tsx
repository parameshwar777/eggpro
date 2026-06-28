import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, AlertCircle, CheckCircle2, Clock, Plus, Upload, X, Ticket } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PaymentIssue {
  id: string;
  ticket_number: string | null;
  transaction_id: string | null;
  amount: number | null;
  description: string | null;
  screenshot_url: string | null;
  order_screenshot_url: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

export const PaymentIssuePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [view, setView] = useState<"list" | "new">("list");
  const [issues, setIssues] = useState<PaymentIssue[]>([]);
  const [loading, setLoading] = useState(false);

  const [transactionId, setTransactionId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [paymentShot, setPaymentShot] = useState<File | null>(null);
  const [orderShot, setOrderShot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) fetchIssues();
  }, [user]);

  const fetchIssues = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("payment_issues")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setIssues((data as PaymentIssue[]) || []);
    setLoading(false);
  };

  const uploadShot = async (file: File, kind: string) => {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `payment-issues/${user!.id}/${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!description.trim()) {
      toast({ title: "Add a query", description: "Please describe the issue.", variant: "destructive" });
      return;
    }
    if (!paymentShot) {
      toast({ title: "Payment screenshot required", description: "Attach the payment receipt screenshot.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const paymentUrl = await uploadShot(paymentShot, "payment");
      const orderUrl = orderShot ? await uploadShot(orderShot, "order") : null;

      const { data: inserted, error } = await supabase.from("payment_issues").insert({
        user_id: user.id,
        transaction_id: transactionId.trim() || null,
        amount: amount ? parseFloat(amount) : null,
        description: description.trim(),
        screenshot_url: paymentUrl,
        order_screenshot_url: orderUrl,
        status: "pending",
      }).select("*").maybeSingle();
      if (error) throw error;

      // Fetch customer details for the WhatsApp alert
      const { data: profile } = await supabase
        .from("profiles").select("full_name, phone, email").eq("id", user.id).maybeSingle();

      supabase.functions.invoke("payment-issue-whatsapp", {
        body: {
          ticketNumber: inserted?.ticket_number,
          customerName: profile?.full_name || "Customer",
          phone: profile?.phone || "",
          email: profile?.email || "",
          amount: inserted?.amount,
          transactionId: inserted?.transaction_id,
          description: inserted?.description,
          paymentScreenshotUrl: paymentUrl,
          orderScreenshotUrl: orderUrl,
        },
      }).catch((e) => console.error("WA notify failed", e));

      toast({
        title: `Ticket ${inserted?.ticket_number || ""} created`,
        description: "Admin has been notified on WhatsApp.",
      });
      setTransactionId(""); setAmount(""); setDescription("");
      setPaymentShot(null); setOrderShot(null);
      setView("list");
      fetchIssues();
    } catch (e: any) {
      toast({ title: "Failed to submit", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (status: string) => {
    if (status === "resolved") return { bg: "bg-green-100 text-green-700", icon: CheckCircle2, label: "Resolved" };
    if (status === "rejected") return { bg: "bg-red-100 text-red-700", icon: AlertCircle, label: "Rejected" };
    return { bg: "bg-yellow-100 text-yellow-700", icon: Clock, label: "Pending" };
  };

  return (
    <div className="page-scroll bg-[#FFF8E7] w-full">
      <div className="max-w-lg mx-auto pb-24">
        <motion.div className="bg-primary px-4 py-4 flex items-center gap-3 safe-top">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => view === "new" ? setView("list") : navigate(-1)} className="p-2 rounded-full bg-card/20">
            <ArrowLeft className="w-5 h-5 text-primary-foreground" />
          </motion.button>
          <h1 className="text-lg font-semibold text-primary-foreground flex-1">
            {view === "new" ? "New Ticket" : "Payment Issue Tickets"}
          </h1>
        </motion.div>

        <div className="p-4 space-y-4">
          {!user ? (
            <div className="bg-card rounded-2xl p-6 shadow-card text-center">
              <p className="text-muted-foreground mb-4">Please login to raise a ticket.</p>
              <Button onClick={() => navigate("/auth")}>Login</Button>
            </div>
          ) : view === "list" ? (
            <>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-900">
                    <p className="font-semibold mb-1">Paid but order not showing?</p>
                    <p>Raise a ticket with your payment & order screenshots. Our admin will verify and confirm your order on WhatsApp.</p>
                  </div>
                </div>
              </div>

              <Button onClick={() => setView("new")} className="w-full h-12">
                <Plus className="w-5 h-5 mr-2" /> New Ticket
              </Button>

              {loading ? (
                <p className="text-center text-muted-foreground py-6">Loading…</p>
              ) : issues.length === 0 ? (
                <div className="bg-card rounded-2xl p-6 shadow-card text-center text-muted-foreground">
                  <Ticket className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  No tickets yet
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground px-1">Your tickets</h3>
                  {issues.map((iss) => {
                    const s = statusBadge(iss.status);
                    const Icon = s.icon;
                    return (
                      <div key={iss.id} className="bg-card rounded-2xl p-4 shadow-card">
                        <div className="flex items-start justify-between mb-2 gap-2">
                          <div className="min-w-0">
                            <p className="font-bold text-foreground text-sm">
                              🎫 {iss.ticket_number || iss.id.slice(0, 8)}
                            </p>
                            {iss.transaction_id && (
                              <p className="text-xs text-muted-foreground">Txn: {iss.transaction_id}</p>
                            )}
                            {iss.amount != null && (
                              <p className="text-sm text-muted-foreground">Amount: ₹{iss.amount}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(iss.created_at).toLocaleString()}
                            </p>
                          </div>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${s.bg} flex-shrink-0`}>
                            <Icon className="w-3 h-3" />
                            {s.label}
                          </span>
                        </div>
                        {iss.description && <p className="text-sm text-foreground mt-2">{iss.description}</p>}
                        {(iss.screenshot_url || iss.order_screenshot_url) && (
                          <div className="flex gap-2 mt-3">
                            {iss.screenshot_url && (
                              <a href={iss.screenshot_url} target="_blank" rel="noreferrer" className="flex-1">
                                <img src={iss.screenshot_url} alt="Payment" className="w-full h-20 object-cover rounded-lg border" />
                                <p className="text-[10px] text-center text-muted-foreground mt-1">Payment</p>
                              </a>
                            )}
                            {iss.order_screenshot_url && (
                              <a href={iss.order_screenshot_url} target="_blank" rel="noreferrer" className="flex-1">
                                <img src={iss.order_screenshot_url} alt="Order" className="w-full h-20 object-cover rounded-lg border" />
                                <p className="text-[10px] text-center text-muted-foreground mt-1">Order</p>
                              </a>
                            )}
                          </div>
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
          ) : (
            <div className="bg-card rounded-2xl p-4 shadow-card space-y-4">
              <h3 className="font-semibold text-foreground">Raise a new ticket</h3>

              <div>
                <label className="text-sm font-medium text-foreground">Your query / issue *</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what happened (e.g. paid via GPay at 5:30 PM but order didn't appear)"
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Transaction / UPI Ref ID</label>
                <Input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="e.g. 432198765432" className="mt-1" />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Amount Paid (₹)</label>
                <Input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 250" className="mt-1" />
              </div>

              <ScreenshotPicker
                label="Payment screenshot *"
                file={paymentShot}
                onChange={setPaymentShot}
              />
              <ScreenshotPicker
                label="Orders page screenshot (optional)"
                file={orderShot}
                onChange={setOrderShot}
              />

              <Button onClick={handleSubmit} disabled={submitting} className="w-full h-12">
                {submitting ? "Submitting…" : "Submit Ticket"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function ScreenshotPicker({ label, file, onChange }: { label: string; file: File | null; onChange: (f: File | null) => void }) {
  const preview = file ? URL.createObjectURL(file) : null;
  return (
    <div>
      <label className="text-sm font-medium text-foreground">{label}</label>
      {preview ? (
        <div className="mt-2 relative">
          <img src={preview} alt="preview" className="w-full h-40 object-contain rounded-lg border bg-muted" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className="mt-1 flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50">
          <Upload className="w-6 h-6 text-muted-foreground mb-1" />
          <span className="text-xs text-muted-foreground">Tap to attach image</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onChange(e.target.files?.[0] || null)}
          />
        </label>
      )}
    </div>
  );
}

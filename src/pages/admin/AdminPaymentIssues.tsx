import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle2, Clock, XCircle, User } from "lucide-react";

interface PaymentIssue {
  id: string;
  ticket_number: string | null;
  user_id: string;
  transaction_id: string | null;
  amount: number | null;
  description: string | null;
  screenshot_url: string | null;
  order_screenshot_url: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  profile?: { full_name: string | null; phone: string | null; email: string | null };
}


export const AdminPaymentIssues = () => {
  const { toast } = useToast();
  const [issues, setIssues] = useState<PaymentIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "resolved" | "rejected">("pending");
  const [notesById, setNotesById] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    setLoading(true);
    const { data: issuesData } = await supabase
      .from("payment_issues")
      .select("*")
      .order("created_at", { ascending: false });

    const userIds = [...new Set((issuesData || []).map((i) => i.user_id))];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, full_name, phone, email")
      .in("id", userIds);

    const profileMap = new Map((profilesData || []).map((p) => [p.id, p]));
    const enriched = (issuesData || []).map((i) => ({
      ...i,
      profile: profileMap.get(i.user_id) as any,
    }));
    setIssues(enriched as PaymentIssue[]);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("payment_issues")
      .update({ status, admin_notes: notesById[id] || null })
      .eq("id", id);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Updated", description: `Marked as ${status}` });
    fetchIssues();
  };

  const filtered = filter === "all" ? issues : issues.filter((i) => i.status === filter);

  const statusInfo = (s: string) => {
    if (s === "resolved") return { color: "bg-green-100 text-green-800", icon: CheckCircle2 };
    if (s === "rejected") return { color: "bg-red-100 text-red-800", icon: XCircle };
    return { color: "bg-yellow-100 text-yellow-800", icon: Clock };
  };

  return (
    <AdminLayout title="Payment Issues">
      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          {(["pending", "resolved", "rejected", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-amber-900 text-amber-200 hover:bg-amber-800"
              }`}
            >
              {f} ({f === "all" ? issues.length : issues.filter((i) => i.status === f).length})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-amber-200">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-amber-900 rounded-xl p-8 text-center text-amber-200">
            <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No {filter !== "all" ? filter : ""} payment issues.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((iss) => {
              const s = statusInfo(iss.status);
              const Icon = s.icon;
              return (
                <div key={iss.id} className="bg-amber-50 rounded-xl p-4 shadow-card">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      {iss.ticket_number && (
                        <p className="font-bold text-amber-900 text-sm">🎫 {iss.ticket_number}</p>
                      )}
                      <div className="flex items-center gap-2 text-amber-900 mt-1">
                        <User className="w-4 h-4" />
                        <span className="font-semibold">{iss.profile?.full_name || "Unknown user"}</span>
                      </div>

                      <p className="text-sm text-amber-800">
                        {iss.profile?.phone || iss.profile?.email || "—"}
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        {new Date(iss.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${s.color}`}>
                      <Icon className="w-3 h-3" />
                      {iss.status}
                    </span>
                  </div>

                  <div className="bg-white rounded-lg p-3 space-y-1 text-sm">
                    {iss.transaction_id && (
                      <p><span className="font-semibold">Txn ID:</span> {iss.transaction_id}</p>
                    )}
                    {iss.amount != null && (
                      <p><span className="font-semibold">Amount:</span> ₹{iss.amount}</p>
                    )}
                    {iss.description && (
                      <p><span className="font-semibold">User says:</span> {iss.description}</p>
                    )}
                  </div>

                  {(iss.screenshot_url || iss.order_screenshot_url) && (
                    <div className="flex gap-2 mt-3">
                      {iss.screenshot_url && (
                        <a href={iss.screenshot_url} target="_blank" rel="noreferrer" className="flex-1">
                          <img src={iss.screenshot_url} alt="Payment" className="w-full h-28 object-cover rounded-lg border" />
                          <p className="text-[10px] text-center text-amber-800 mt-1 font-semibold">Payment Screenshot</p>
                        </a>
                      )}
                      {iss.order_screenshot_url && (
                        <a href={iss.order_screenshot_url} target="_blank" rel="noreferrer" className="flex-1">
                          <img src={iss.order_screenshot_url} alt="Order" className="w-full h-28 object-cover rounded-lg border" />
                          <p className="text-[10px] text-center text-amber-800 mt-1 font-semibold">Order Screenshot</p>
                        </a>
                      )}
                    </div>
                  )}


                  {iss.admin_notes && (
                    <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-2 text-sm">
                      <span className="font-semibold">Previous note:</span> {iss.admin_notes}
                    </div>
                  )}

                  {iss.status === "pending" && (
                    <div className="mt-3 space-y-2">
                      <Textarea
                        placeholder="Add admin note (optional, visible to user)"
                        value={notesById[iss.id] || ""}
                        onChange={(e) => setNotesById((p) => ({ ...p, [iss.id]: e.target.value }))}
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => updateStatus(iss.id, "resolved")}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Mark Resolved
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateStatus(iss.id, "rejected")}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

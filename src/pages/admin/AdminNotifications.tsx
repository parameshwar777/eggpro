import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, Search, X } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  title: string;
  message: string;
  is_active: boolean;
  created_at: string;
}

export const AdminNotifications = () => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", message: "" });

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("notifications").select("*").order("created_at", { ascending: false });
    if (error) console.error(error);
    setNotifications(data || []);
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.message) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("notifications").insert({
      title: formData.title, message: formData.message, is_active: true,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Sent", description: "Notification published" });
    setDialogOpen(false);
    setFormData({ title: "", message: "" });
    fetchNotifications();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("notifications").update({ is_active: !current }).eq("id", id);
    fetchNotifications();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this notification?")) return;
    await supabase.from("notifications").delete().eq("id", id);
    fetchNotifications();
  };

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (statusFilter === "active" && !n.is_active) return false;
      if (statusFilter === "inactive" && n.is_active) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!n.title.toLowerCase().includes(q) && !n.message.toLowerCase().includes(q)) return false;
      }
      const created = new Date(n.created_at).getTime();
      if (fromDate && created < new Date(fromDate).getTime()) return false;
      if (toDate && created > new Date(toDate).getTime() + 86400000) return false;
      return true;
    });
  }, [notifications, statusFilter, searchQuery, fromDate, toDate]);

  const clearFilters = () => {
    setSearchQuery(""); setStatusFilter("all"); setFromDate(""); setToDate("");
  };

  const headerActions = (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="w-4 h-4 mr-2" /> New Notification</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create Notification</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <Input placeholder="Title" value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
          <Textarea placeholder="Message" value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })} rows={4} />
          <Button onClick={handleSubmit} className="w-full">Send Notification</Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <AdminLayout title="Notifications" headerActions={headerActions}>
      {/* Filters */}
      <div className="bg-amber-900 rounded-xl p-4 mb-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-amber-100 font-semibold text-sm">Filters & Search</h3>
          {(searchQuery || statusFilter !== "all" || fromDate || toDate) && (
            <Button size="sm" variant="ghost" className="text-amber-200 hover:text-amber-100 hover:bg-amber-800" onClick={clearFilters}>
              <X className="w-4 h-4 mr-1" /> Clear
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="text-xs text-amber-300 block mb-1">Search by title or message</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-amber-400" />
              <Input
                placeholder="Type to search…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-amber-50"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-amber-300 block mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-12 w-full rounded-lg border border-input bg-amber-50 px-3 text-sm font-medium"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-amber-300 block mb-1">Date range</label>
            <div className="flex gap-2">
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="bg-amber-50" />
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="bg-amber-50" />
            </div>
          </div>
        </div>
        <p className="text-xs text-amber-300">Showing {filtered.length} of {notifications.length}</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-amber-300 bg-amber-900 rounded-xl">No notifications match your filters</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => (
            <div key={n.id} className="bg-amber-50 rounded-xl p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-amber-900 font-semibold">{n.title}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${n.is_active ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"}`}>
                      {n.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-amber-800 text-sm mt-1 break-words">{n.message}</p>
                  <p className="text-amber-700 text-xs mt-2">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Switch checked={n.is_active} onCheckedChange={() => toggleActive(n.id, n.is_active)} />
                  <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(n.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

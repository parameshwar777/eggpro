import { useEffect, useState } from "react";
import { Loader2, Search, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { logAdminAction } from "@/lib/media";

export const AdminChickenStaff = () => {
  const { toast } = useToast();
  const [staff, setStaff] = useState<{ user_id: string; pickup_center_id: string | null; email?: string }[]>([]);
  const [centers, setCenters] = useState<{ id: string; name: string }[]>([]);
  const [email, setEmail] = useState("");
  const [found, setFound] = useState<{ id: string; email: string }[]>([]);
  const [center, setCenter] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [{ data: roles }, { data: sc }, { data: c }] = await Promise.all([
      supabase.from("user_roles").select("user_id").eq("role", "chicken_staff" as any),
      supabase.from("staff_centers").select("*"),
      supabase.from("chicken_pickup_centers").select("id,name").order("display_order"),
    ]);
    setCenters(c || []);
    const ids = (roles || []).map((r) => r.user_id);
    let emails: Record<string, string> = {};
    if (ids.length) {
      const { data } = await supabase.functions.invoke("get-users-info", { body: { userIds: ids } });
      const list = data?.users || data || [];
      if (Array.isArray(list)) emails = Object.fromEntries(list.map((u: any) => [u.id, u.email]));
    }
    setStaff(ids.map((id) => ({ user_id: id, pickup_center_id: sc?.find((s) => s.user_id === id)?.pickup_center_id || null, email: emails[id] })));
  };
  useEffect(() => { load(); }, []);

  const search = async () => {
    setBusy(true);
    const { data } = await supabase.functions.invoke("search-user-by-email", { body: { email: email.trim() } });
    setFound(data?.users || []);
    setBusy(false);
  };

  const add = async (uid: string) => {
    if (!center) return toast({ title: "Choose a pickup center first", variant: "destructive" });
    const { error: e1 } = await supabase.from("user_roles").insert({ user_id: uid, role: "chicken_staff" as any });
    if (e1 && !e1.message.includes("duplicate")) return toast({ title: "Failed", description: e1.message, variant: "destructive" });
    const { error: e2 } = await supabase.from("staff_centers").upsert({ user_id: uid, pickup_center_id: center });
    if (e2) return toast({ title: "Failed", description: e2.message, variant: "destructive" });
    logAdminAction("chicken_staff", uid, "assign", { center });
    toast({ title: "Staff added" });
    setFound([]); setEmail(""); load();
  };

  const remove = async (uid: string) => {
    if (!confirm("Remove chicken staff access?")) return;
    await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", "chicken_staff" as any);
    await supabase.from("staff_centers").delete().eq("user_id", uid);
    logAdminAction("chicken_staff", uid, "remove");
    load();
  };

  const changeCenter = async (uid: string, cid: string) => {
    await supabase.from("staff_centers").upsert({ user_id: uid, pickup_center_id: cid || null });
    logAdminAction("chicken_staff", uid, "change_center", { cid });
    load();
  };

  const sel = "h-12 w-full rounded-md px-3 bg-background text-foreground";
  return (
    <AdminLayout title="Chicken Staff">
      <div className="max-w-2xl space-y-6">
        <div className="bg-amber-900/50 border border-amber-800 rounded-xl p-5 space-y-3">
          <h3 className="font-bold text-amber-100">Add pickup staff</h3>
          <p className="text-xs text-amber-300">Staff sign in with their normal EggPro account and open the "Pickup Verification" screen at /staff/pickup.</p>
          <select className={sel} value={center} onChange={(e) => setCenter(e.target.value)}>
            <option value="">Assign to pickup center…</option>
            {centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="flex gap-2">
            <Input className="h-12" placeholder="Search user email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button className="h-12" onClick={search} disabled={busy || !email.trim()}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}</Button>
          </div>
          {found.map((u) => (
            <div key={u.id} className="flex items-center justify-between bg-amber-800/60 rounded-lg p-3 text-amber-100">
              <span className="text-sm">{u.email}</span>
              <Button size="sm" className="h-10" onClick={() => add(u.id)}>Add as staff</Button>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {staff.length === 0 && <p className="text-amber-300">No chicken staff yet.</p>}
          {staff.map((s) => (
            <div key={s.user_id} className="bg-amber-900/50 border border-amber-800 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center gap-2">
                <p className="text-amber-100 font-semibold break-all">{s.email || s.user_id}</p>
                <Button size="sm" variant="destructive" className="h-10" onClick={() => remove(s.user_id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
              <select className={sel} value={s.pickup_center_id || ""} onChange={(e) => changeCenter(s.user_id, e.target.value)}>
                <option value="">No center assigned</option>
                {centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

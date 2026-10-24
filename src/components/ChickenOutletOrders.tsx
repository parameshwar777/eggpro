import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Download, Loader2, RefreshCw } from "lucide-react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useChickenSettings, upcomingPickupDeadline } from "@/lib/chickenSettings";
import { downloadOutletSheet, type OutletOrder } from "@/lib/outletSheet";
const indiaDate = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
export function ChickenOutletOrders() {
  const { user, isAdmin, isMerchant } = useAuth();
  const { settings, loaded } = useChickenSettings();
  const { toast } = useToast();
  const [week, setWeek] = useState("");
  const [outlet, setOutlet] = useState("");
  const [centers, setCenters] = useState<{ id: string; name: string }[]>([]);
  const [orders, setOrders] = useState<OutletOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [filter, setFilter] = useState("all");
  useEffect(() => { if (loaded && !week) setWeek(indiaDate(upcomingPickupDeadline(settings))); }, [loaded,settings,week]);
  const invoke = async (body: Record<string, unknown>) => {
    const result = await supabase.functions.invoke("chicken-order", { body });
    if (result.error) {
      let message = result.error.message;
      if (result.error instanceof FunctionsHttpError) { try { const details = await result.error.context.json(); message = details.error || message; } catch { /* retain error */ } }
      throw new Error(message);
    }
    if (result.data?.error) throw new Error(result.data.error);
    return result.data;
  };
  const load = useCallback(async () => {
    if (!week || !user || !(isAdmin || isMerchant)) return;
    setLoading(true); setError("");
    try { const data = await invoke({ action: "outlet-list", week }); setOrders(data.orders); setCenters(data.centers); }
    catch (e) { setOrders([]); setError(e instanceof Error ? e.message : "Could not load orders"); }
    finally { setLoading(false); }
  }, [week,user,isAdmin,isMerchant]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!user || !(isAdmin || isMerchant)) return;
    const channel = supabase.channel("chicken-outlet-orders").on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: "business=eq.chicken" }, () => void load()).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [load,user,isAdmin,isMerchant]);
  const done = (o: OutletOrder) => o.order_status === "delivered" || o.pickup?.pickup_status === "HANDED_OVER";
  const outletOrders = orders.filter(o => !outlet || o.pickup_center_id === outlet);
  const shown = outletOrders.filter(o => filter === "all" || (filter === "done" ? done(o) : !done(o)));
  async function markDone(o: OutletOrder) {
    if (!confirm(`Confirm ${o.customer_name || "this customer"} has collected this order?`)) return;
    setBusy(o.id);
    try { await invoke({ action: "outlet-done", orderId: o.id, outletId: o.pickup_center_id }); toast({ title: "Order marked done" }); await load(); }
    catch (e) { toast({ title: "Could not mark done", description: e instanceof Error ? e.message : "Try again", variant: "destructive" }); }
    finally { setBusy(""); }
  }
  function download() {
    try {
      const selected = centers.filter(c => !outlet || c.id === outlet);
      selected.forEach(c => { const list = outletOrders.filter(o => o.pickup_center_id === c.id); if (list.length) downloadOutletSheet(list,c.name,week); });
    } catch (e) { toast({ title: "Download failed", description: e instanceof Error ? e.message : "Try again", variant: "destructive" }); }
  }
  return <div className="space-y-5 text-foreground">
    <div className="grid gap-3 sm:grid-cols-2"><label className="font-bold text-primary">Supply date<Input aria-label="Supply date" type="date" className="h-12 mt-1" value={week} onChange={e => setWeek(e.target.value)} /></label><label className="font-bold text-primary">Pickup outlet<select aria-label="Pickup outlet" value={outlet} onChange={e => setOutlet(e.target.value)} className="h-12 mt-1 w-full rounded-lg border border-input bg-background text-foreground px-3"><option value="">All outlets</option>{centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label></div>
    <div className="flex flex-wrap gap-2"><div className="inline-flex" role="group" aria-label="Order status">{["all","pending","done"].map(f => <Button key={f} variant={f === filter ? "default" : "secondary"} className="h-12 capitalize" onClick={() => setFilter(f)}>{f}</Button>)}</div><Button variant="secondary" className="h-12" disabled={loading || !outletOrders.length} onClick={download}><Download />PNG SHEET</Button><Button variant="secondary" size="icon" className="h-12 w-12" aria-label="Refresh orders" disabled={loading} onClick={() => void load()}><RefreshCw /></Button></div>
    <p className="font-extrabold text-primary">{outletOrders.length} orders · {outletOrders.filter(done).length} done · {outletOrders.filter(o => !done(o)).length} remaining</p>
    {loading ? <Loader2 className="animate-spin text-primary" /> : error ? <p role="alert" className="bg-card text-destructive p-4 rounded-lg">{error}</p> : !shown.length ? <p className="text-primary">No paid pickup orders for this date and outlet.</p> : <div className="grid gap-3 xl:grid-cols-2">{shown.map(o => {
      const expired = o.pickup?.pickup_status === "EXPIRED" || (o.pickup?.expires_at && new Date(o.pickup.expires_at) <= new Date());
      const cancelled = o.pickup?.pickup_status === "CANCELLED" || o.order_status === "cancelled";
      return <article key={o.id} className="bg-card text-card-foreground rounded-lg border border-border p-4 space-y-2"><div className="flex justify-between gap-3"><h3 className="text-lg">{o.customer_name || "Customer"}</h3><span className="font-extrabold text-primary">{done(o) ? "DONE" : cancelled ? "CANCELLED" : expired ? "EXPIRED" : "PENDING"}</span></div><p className="text-sm">{o.phone} · {centers.find(c => c.id === o.pickup_center_id)?.name || "Pickup outlet"}</p><p className="text-xs text-muted-foreground">Order #{o.id.slice(0,8)}</p>{o.items.map((item,i) => <p key={i} className="text-sm">{item.name} × {item.quantity}</p>)}<p className="font-bold">Paid ₹{o.total_amount}</p>{done(o) ? <p className="flex gap-2 items-center text-primary"><CheckCircle2 />Collected{o.pickup?.handed_over_at ? ` · ${new Date(o.pickup.handed_over_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}` : ""}</p> : <Button className="h-12 w-full" disabled={!!busy || !!expired || cancelled || !o.pickup} onClick={() => void markDone(o)}>{busy === o.id ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}MARK DONE</Button>}</article>;
    })}</div>}
  </div>;
}
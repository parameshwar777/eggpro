import { useEffect, useState } from "react";
import { Archive, Loader2, CheckCircle2, XCircle, AlertTriangle, PackageCheck } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCrudManager } from "@/components/admin/AdminCrudManager";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { logAdminAction } from "@/lib/media";
import { DAY_NAMES, fetchChickenSettings, SETTINGS_KEY, type ChickenPickupSettings, DEFAULT_CHICKEN_SETTINGS } from "@/lib/chickenSettings";

/* ---------------- PRODUCTS ---------------- */
export const AdminChickenProducts = () => {
  const { toast } = useToast();
  return (
    <AdminLayout title="Chicken Products">
      <AdminCrudManager
        table="chicken_products"
        entityLabel="Chicken Product"
        addLabel="+ ADD CHICKEN"
        imageFolder="chicken/products"
        imageButton="UPLOAD IMAGE"
        defaults={{ name: "", description: "", weight: "", price: "", offer_price: "", image_path: null, active: true, available: true }}
        hideRow={(r) => r.archived}
        fields={[
          { key: "name", label: "Name", type: "text", required: true, placeholder: "e.g. Whole Chicken" },
          { key: "description", label: "Description", type: "textarea" },
          { key: "weight", label: "Weight / Quantity", type: "text", placeholder: "e.g. 1 kg" },
          { key: "price", label: "Price (₹)", type: "number", required: true },
          { key: "offer_price", label: "Offer Price (₹)", type: "number", help: "Optional. If set, customers pay this price." },
          { key: "image_path", label: "Image", type: "image" },
          { key: "active", label: "Active (visible in app)", type: "boolean" },
          { key: "available", label: "Available (in stock)", type: "boolean" },
        ]}
        summary={(r) => (
          <>
            {r.weight && <p>Weight: {r.weight}</p>}
            <p>Price: ₹{r.price}{r.offer_price ? ` • Offer ₹${r.offer_price}` : ""}</p>
            <p>{r.available ? "Available" : "Out of stock"}</p>
          </>
        )}
        extraActions={(r, reload) => (
          <Button size="sm" variant="outline" className="h-10" onClick={async () => {
            if (!confirm(`Archive ${r.name}? It will be hidden from customers and admin list.`)) return;
            const { error } = await supabase.from("chicken_products").update({ archived: true, active: false }).eq("id", r.id);
            if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
            logAdminAction("chicken_products", r.id, "archive");
            reload();
          }}><Archive className="w-4 h-4 mr-1" />ARCHIVE</Button>
        )}
      />
    </AdminLayout>
  );
};

/* ---------------- PICKUP CENTERS ---------------- */
export const AdminPickupCenters = () => (
  <AdminLayout title="Chicken Pickup Centers">
    <AdminCrudManager
      table="chicken_pickup_centers"
      entityLabel="Pickup Center"
      addLabel="+ ADD PICKUP CENTER"
      imageFolder="chicken/pickup-centers"
      imageButton="+ UPLOAD STALL IMAGE"
      defaults={{ name: "", center_code: "", address: "", google_maps_url: "", latitude: "", longitude: "", pickup_instructions: "", image_path: null, active: true }}
      fields={[
        { key: "name", label: "Center Name", type: "text", required: true },
        { key: "center_code", label: "Center ID", type: "text", placeholder: "e.g. STALL-001" },
        { key: "address", label: "Address", type: "textarea", required: true },
        { key: "google_maps_url", label: "Google Maps Location (link)", type: "text", placeholder: "Paste the Google Maps share link", help: "Customers tap VIEW ON GOOGLE MAPS to open this exact link." },
        { key: "latitude", label: "Latitude", type: "number" },
        { key: "longitude", label: "Longitude", type: "number" },
        { key: "pickup_instructions", label: "Pickup Instructions", type: "textarea" },
        { key: "image_path", label: "Stall Image (optional)", type: "image" },
        { key: "active", label: "Active", type: "boolean" },
      ]}
      summary={(r) => (
        <>
          {r.center_code && <p>ID: {r.center_code}</p>}
          <p>{r.address}</p>
          <p>{r.google_maps_url ? "Map link set" : "No map link yet"}</p>
        </>
      )}
    />
  </AdminLayout>
);

/* ---------------- CAFE ---------------- */
export const AdminCafeLocations = () => (
  <AdminLayout title="Café Locations">
    <AdminCrudManager
      table="cafe_locations"
      entityLabel="Café Location"
      addLabel="+ ADD LOCATION"
      imageFolder="cafe/locations"
      imageButton="UPLOAD PHOTO"
      defaults={{ name: "", address: "", image_path: null, active: true }}
      fields={[
        { key: "name", label: "Café Name", type: "text", required: true },
        { key: "address", label: "Address", type: "textarea" },
        { key: "image_path", label: "Photo (optional)", type: "image" },
        { key: "active", label: "Active", type: "boolean" },
      ]}
      summary={(r) => <p>{r.address || "No address"}</p>}
    />
  </AdminLayout>
);

/* ---------------- SCHEDULE ---------------- */
export const AdminChickenSchedule = () => {
  const { toast } = useToast();
  const [s, setS] = useState<ChickenPickupSettings>(DEFAULT_CHICKEN_SETTINGS);
  const [saving, setSaving] = useState(false);
  useEffect(() => { fetchChickenSettings().then(setS); }, []);

  const toggleDay = (d: number) => setS((p) => ({ ...p, booking_days: p.booking_days.includes(d) ? p.booking_days.filter((x) => x !== d) : [...p.booking_days, d].sort() }));

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("admin_settings").upsert({ key: SETTINGS_KEY, value: JSON.stringify(s), updated_at: new Date().toISOString() }, { onConflict: "key" });
    setSaving(false);
    if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
    logAdminAction("chicken_pickup_settings", null, "update", s);
    toast({ title: "Schedule saved" });
  };

  const label = "text-sm font-bold text-amber-100 block mb-1";
  return (
    <AdminLayout title="Chicken Pickup Schedule">
      <div className="max-w-xl space-y-5 bg-amber-900/50 border border-amber-800 rounded-xl p-5">
        <div>
          <span className={label}>Booking Days</span>
          <div className="flex flex-wrap gap-2">
            {DAY_NAMES.map((d, i) => (
              <button key={d} onClick={() => toggleDay(i)} className={`h-11 px-3 rounded-lg font-bold text-sm ${s.booking_days.includes(i) ? "bg-primary text-primary-foreground" : "bg-amber-800 text-amber-200"}`}>{d.slice(0, 3)}</button>
            ))}
          </div>
        </div>
        <div>
          <span className={label}>Pickup Day</span>
          <select value={s.pickup_day} onChange={(e) => setS({ ...s, pickup_day: Number(e.target.value) })} className="h-12 w-full rounded-md px-3 bg-background text-foreground">
            {DAY_NAMES.map((d, i) => <option key={d} value={i}>{d}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><span className={label}>Pickup Start</span><Input type="time" className="h-12" value={s.pickup_start_time} onChange={(e) => setS({ ...s, pickup_start_time: e.target.value })} /></div>
          <div><span className={label}>Pickup End</span><Input type="time" className="h-12" value={s.pickup_end_time} onChange={(e) => setS({ ...s, pickup_end_time: e.target.value })} /></div>
          <div><span className={label}>Cutoff</span><Input type="time" className="h-12" value={s.cutoff_time} onChange={(e) => setS({ ...s, cutoff_time: e.target.value })} /></div>
        </div>
        <p className="text-xs text-amber-300">All times are India Standard Time. Orders not collected by the cutoff on the pickup day are marked expired.</p>
        <div><span className={label}>Refund Policy (shown to customers)</span><Textarea value={s.refund_policy} onChange={(e) => setS({ ...s, refund_policy: e.target.value })} /></div>
        <div className="flex items-center gap-3"><Switch checked={s.delivery_enabled} onCheckedChange={(v) => setS({ ...s, delivery_enabled: v })} /><span className="text-amber-100 font-semibold">Allow chicken home delivery (communities)</span></div>
        <Button onClick={save} disabled={saving} className="w-full h-12 font-bold">{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}SAVE SCHEDULE</Button>
      </div>
    </AdminLayout>
  );
};

/* ---------------- ORDERS ---------------- */
const STATUSES = ["ALL", "PENDING_PICKUP", "READY_FOR_PICKUP", "VERIFIED", "HANDED_OVER", "EXPIRED", "CANCELLED"];
export const AdminChickenOrders = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [pickups, setPickups] = useState<Record<string, any>>({});
  const [centers, setCenters] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [o, p, c] = await Promise.all([
      supabase.from("orders").select("*").eq("business", "chicken").eq("payment_status", "completed").order("created_at", { ascending: false }).limit(300),
      supabase.from("chicken_pickup_verifications").select("*"),
      supabase.from("chicken_pickup_centers").select("id,name"),
    ]);
    setOrders(o.data || []);
    setPickups(Object.fromEntries((p.data || []).map((x: any) => [x.order_id, x])));
    setCenters(Object.fromEntries((c.data || []).map((x: any) => [x.id, x.name])));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (pid: string, status: string) => {
    const { error } = await supabase.from("chicken_pickup_verifications").update({ pickup_status: status }).eq("id", pid);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    logAdminAction("chicken_pickup", pid, `status:${status}`);
    load();
  };
  const expireOverdue = async () => {
    const { data, error } = await supabase.functions.invoke("chicken-order", { body: { action: "expire" } });
    if (error || data?.error) return toast({ title: "Failed", variant: "destructive" });
    toast({ title: `${data.expired} overdue pickups marked expired` });
    load();
  };

  const shown = orders.filter((o) => filter === "ALL" || pickups[o.id]?.pickup_status === filter);

  return (
    <AdminLayout title="Chicken Orders">
      <div className="flex flex-wrap gap-2 mb-4">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`h-10 px-3 rounded-lg text-xs font-bold ${filter === s ? "bg-primary text-primary-foreground" : "bg-amber-800 text-amber-200"}`}>{s.replace(/_/g, " ")}</button>
        ))}
        <Button variant="outline" className="h-10" onClick={expireOverdue}>Expire overdue</Button>
      </div>
      {loading ? <Loader2 className="w-6 h-6 animate-spin text-amber-300" /> : shown.length === 0 ? <p className="text-amber-300">No chicken orders.</p> : (
        <div className="grid gap-3 md:grid-cols-2">
          {shown.map((o) => {
            const p = pickups[o.id];
            return (
              <div key={o.id} className="bg-amber-900/50 border border-amber-800 rounded-xl p-4 text-amber-100 space-y-1">
                <div className="flex justify-between gap-2">
                  <p className="font-bold">{o.customer_name}</p>
                  <span className="text-xs font-extrabold bg-amber-700 px-2 py-1 rounded-full">{o.fulfillment_type === "pickup" ? (p?.pickup_status || "PENDING").replace(/_/g, " ") : "DELIVERY"}</span>
                </div>
                <p className="text-xs text-amber-300">{new Date(o.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} • {o.phone}</p>
                <p className="text-sm">{(o.items || []).map((i: any) => `${i.name} × ${i.quantity}`).join(", ")}</p>
                <p className="text-sm font-bold">₹{o.total_amount}</p>
                {o.fulfillment_type === "pickup" ? (
                  <p className="text-sm">Center: {centers[o.pickup_center_id] || "—"} • Code: <span className="font-mono font-bold">{p?.pickup_code || "—"}</span></p>
                ) : <p className="text-sm">{o.community} — {o.address}</p>}
                {p && ["PENDING_PICKUP"].includes(p.pickup_status) && (
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" className="h-10" onClick={() => setStatus(p.id, "READY_FOR_PICKUP")}>Mark ready</Button>
                    <Button size="sm" variant="destructive" className="h-10" onClick={() => confirm("Cancel this pickup?") && setStatus(p.id, "CANCELLED")}>Cancel</Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
};

/* ---------------- VERIFICATION (shared by admin and staff) ---------------- */
export const PickupVerificationPanel = ({ isAdmin }: { isAdmin: boolean }) => {
  const [code, setCode] = useState("");
  const [centerId, setCenterId] = useState("");
  const [centers, setCenters] = useState<{ id: string; name: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<any>(null);

  useEffect(() => {
    if (isAdmin) supabase.from("chicken_pickup_centers").select("id,name").order("display_order").then(({ data }) => setCenters(data || []));
  }, [isAdmin]);

  const call = async (action: "verify" | "handover") => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("chicken-order", { body: { action, code, centerId: centerId || undefined } });
    setBusy(false);
    setRes(error ? { error: "Could not reach server. Try again." } : data);
  };

  const box = "rounded-2xl p-5 mt-5 space-y-1";
  return (
    <div className="max-w-md mx-auto">
      <div className="bg-card text-foreground rounded-2xl p-5 shadow-lg space-y-3">
        <p className="text-xs font-extrabold tracking-widest text-orange-600">EGGPRO CHICKEN</p>
        <h2 className="text-xl font-extrabold">Pickup Verification</h2>
        {isAdmin && (
          <select value={centerId} onChange={(e) => setCenterId(e.target.value)} className="h-12 w-full rounded-md px-3 border border-input bg-background">
            <option value="">I'm verifying at… (any center)</option>
            {centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
        <Input value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setRes(null); }} placeholder="Enter Pickup Code (CHKN-XXXXXX)" className="h-14 text-lg font-mono font-bold tracking-wider" />
        <Button disabled={busy || code.length < 6} onClick={() => call("verify")} className="w-full h-12 font-extrabold">{busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}VERIFY PICKUP</Button>
      </div>

      {res?.error && <div className={`${box} bg-red-50 text-red-800`}><p className="font-bold">{res.error}</p></div>}
      {res?.result === "INVALID" && <div className={`${box} bg-red-50 text-red-800`}><p className="font-extrabold flex items-center gap-2"><XCircle className="w-5 h-5" />INVALID PICKUP CODE</p><p>Please check the code and try again.</p></div>}
      {res?.result === "WRONG_CENTER" && <div className={`${box} bg-amber-50 text-amber-900`}><p className="font-extrabold flex items-center gap-2"><AlertTriangle className="w-5 h-5" />WRONG PICKUP CENTER</p><p>This order is assigned to: <b>{res.correctCenter}</b></p><p>Please collect your order from the assigned EggPro pickup center.</p></div>}
      {res?.result === "ALREADY_COLLECTED" && <div className={`${box} bg-stone-100 text-stone-800`}><p className="font-extrabold">ORDER ALREADY COLLECTED</p><p>This pickup order has already been handed over.</p></div>}
      {res?.result === "EXPIRED" && <div className={`${box} bg-stone-100 text-stone-800`}><p className="font-extrabold">PICKUP EXPIRED</p><p>The pickup deadline for this order has passed.</p></div>}
      {(res?.result === "VERIFIED" || res?.result === "HANDED_OVER") && (
        <div className={`${box} bg-green-50 text-green-900`}>
          <p className="font-extrabold text-lg flex items-center gap-2">{res.result === "VERIFIED" ? <><CheckCircle2 className="w-6 h-6" />✓ PICKUP VERIFIED</> : <><PackageCheck className="w-6 h-6" />HANDED OVER</>}</p>
          <p><b>Customer:</b> {res.details.customerName}</p>
          <p className="break-all"><b>Order ID:</b> {res.details.orderId}</p>
          {(res.details.items || []).map((i: any, k: number) => <p key={k}><b>{i.name}</b> × {i.quantity}</p>)}
          <p><b>Pickup Center:</b> {res.details.center}</p>
          <p><b>Pickup Code:</b> {res.details.code}</p>
          {res.result === "VERIFIED" && <Button disabled={busy} onClick={() => call("handover")} className="w-full h-12 mt-3 font-extrabold bg-green-600 hover:bg-green-700">CONFIRM HANDOVER</Button>}
        </div>
      )}
    </div>
  );
};

export const AdminPickupVerification = () => (
  <AdminLayout title="Pickup Verification">
    <PickupVerificationPanel isAdmin />
  </AdminLayout>
);

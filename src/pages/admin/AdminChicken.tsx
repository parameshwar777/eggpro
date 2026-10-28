import { ChickenProductManager } from "@/components/admin/ChickenProductManager";
import { ChickenOutletOrders } from "@/components/ChickenOutletOrders";
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
import { CHICKEN_WEIGHTS } from "@/lib/chickenProducts";
import { DAY_NAMES, fetchChickenSettings, SETTINGS_KEY, type ChickenPickupSettings, DEFAULT_CHICKEN_SETTINGS } from "@/lib/chickenSettings";

/* ---------------- PRODUCTS ---------------- */
export const AdminChickenProducts = () => <AdminLayout title="Chicken Products"><ChickenProductManager /></AdminLayout>;

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
      defaults={{ name: "", address: "", google_maps_url: "", image_path: null, gallery_paths: [], active: true }}
      fields={[
        { key: "name", label: "Café Name", type: "text", required: true },
        { key: "address", label: "Address", type: "textarea" },
        { key: "google_maps_url", label: "Google Maps Location (link)", type: "text", placeholder: "Paste the Google Maps share link", help: "Use an https:// Google Maps link for customer directions." },
        { key: "image_path", label: "Main Photo (optional)", type: "image" },
        { key: "gallery_paths", label: "More Photos (up to 3)", type: "gallery", help: "Shown below the café address after opening." },
        { key: "active", label: "Show in app", type: "boolean" },
      ]}
      summary={(r) => <><p>{r.address || "No address"}</p><p>{r.google_maps_url ? "Map link set" : "No map link yet"}</p></>}
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
        <div className={`rounded-xl border-2 p-4 space-y-3 ${s.store_closed ? "border-destructive bg-destructive/10" : "border-amber-700"}`}>
          <div className="flex items-center gap-3">
            <Switch checked={s.store_closed} onCheckedChange={(v) => setS({ ...s, store_closed: v })} aria-label="Close chicken store" />
            <span className="text-amber-100 font-bold">{s.store_closed ? "Chicken store is CLOSED" : "Close chicken store"}</span>
          </div>
          <div>
            <span className={label}>Message customers see when closed</span>
            <Textarea value={s.closed_message} onChange={(e) => setS({ ...s, closed_message: e.target.value })} placeholder="e.g. Closed this week due to supply issue. Back next Monday." />
          </div>
          <p className="text-xs text-amber-300">When closed, customers see this message as a popup on the chicken pages and cannot place orders. Tap SAVE SCHEDULE to apply.</p>
        </div>
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
        <div><span className={label}>Sunday evening bookings open (IST)</span><Input type="time" aria-label="Sunday evening bookings open" className="h-12" value={s.sunday_evening_start} onChange={e => setS({ ...s, sunday_evening_start: e.target.value })} /></div>
        <p className="text-xs text-amber-300">All times are India Standard Time. Orders not collected by the cutoff on the pickup day are marked expired.</p>
        <div><span className={label}>Refund Policy (shown to customers)</span><Textarea value={s.refund_policy} onChange={(e) => setS({ ...s, refund_policy: e.target.value })} /></div>
        <div className="flex items-center gap-3"><Switch checked={s.delivery_enabled} onCheckedChange={(v) => setS({ ...s, delivery_enabled: v })} /><span className="text-amber-100 font-semibold">Allow chicken home delivery (communities)</span></div>
        <Button onClick={save} disabled={saving} className="w-full h-12 font-bold">{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}SAVE SCHEDULE</Button>
      </div>
    </AdminLayout>
  );
};

/* ---------------- ORDERS ---------------- */
export const AdminChickenOrders = () => <AdminLayout title="Chicken Outlet Orders"><ChickenOutletOrders /></AdminLayout>;

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

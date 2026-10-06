import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Minus, Plus, Truck, Store, MapPin, ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { SafeImage } from "@/components/BrandLogo";
import { mediaUrl } from "@/lib/media";
import { useChickenSettings, DAY_NAMES, fmtTime, istWeekday } from "@/lib/chickenSettings";
import { openRazorpayCheckout } from "@/lib/capacitorPayment";
import { Input } from "@/components/ui/input";

interface Product { id: string; name: string; description: string | null; weight: string | null; price: number; offer_price: number | null; image_path: string | null; available: boolean }
interface Center { id: string; name: string; address: string; google_maps_url: string | null; image_path: string | null; pickup_instructions: string | null }
interface Address { id: string; label: string; address_line1: string; address_line2: string | null; city: string; pincode: string; phone: string; community: string | null }

const unitPrice = (p: Product) => (p.offer_price && p.offer_price > 0 ? p.offer_price : p.price);

export const ChickenOrderPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { settings } = useChickenSettings();

  const [products, setProducts] = useState<Product[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [prodErr, setProdErr] = useState(false);
  const [centerErr, setCenterErr] = useState(false);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [mode, setMode] = useState<"delivery" | "pickup">("pickup");
  const [centerId, setCenterId] = useState("");
  const [addressId, setAddressId] = useState("");
  const [phone, setPhone] = useState("");
  const [paying, setPaying] = useState(false);
  const community = localStorage.getItem("selectedCommunity") || "";

  useEffect(() => {
    (async () => {
      const [p, c] = await Promise.all([
        supabase.from("chicken_products").select("*").eq("active", true).eq("archived", false).order("display_order"),
        supabase.from("chicken_pickup_centers").select("*").eq("active", true).order("display_order"),
      ]);
      if (p.error) setProdErr(true); else setProducts((p.data as Product[]) || []);
      if (c.error) setCenterErr(true); else setCenters((c.data as Center[]) || []);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("phone").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data?.phone) setPhone(String(data.phone).replace(/\D/g, "").slice(-10));
    });
    if (community) {
      supabase.from("user_addresses").select("*").eq("user_id", user.id).eq("community", community)
        .then(({ data }) => { setAddresses((data as Address[]) || []); if (data?.[0]) setAddressId(data[0].id); });
    }
  }, [user, community]);

  const total = useMemo(() => products.reduce((s, p) => s + unitPrice(p) * (qty[p.id] || 0), 0), [products, qty]);
  const bookingOpen = settings.booking_days.includes(istWeekday());
  const bookingDays = settings.booking_days.map((d) => DAY_NAMES[d].slice(0, 3)).join(", ");

  const change = (id: string, d: number) => setQty((q) => ({ ...q, [id]: Math.max(0, Math.min(50, (q[id] || 0) + d)) }));

  const pay = async () => {
    if (!user) { navigate("/auth"); return; }
    const items = Object.entries(qty).filter(([, n]) => n > 0).map(([productId, quantity]) => ({ productId, quantity }));
    if (!items.length) return toast({ title: "Select a product", variant: "destructive" });
    if (!/^\d{10}$/.test(phone)) return toast({ title: "Enter a valid 10-digit phone number", variant: "destructive" });
    let body: any = { action: "create", items, fulfillment: mode, phone };
    if (mode === "pickup") {
      if (!centerId) return toast({ title: "Select a pickup center", variant: "destructive" });
      body.pickupCenterId = centerId;
    } else {
      const a = addresses.find((x) => x.id === addressId);
      if (!a) return toast({ title: "Add a delivery address in your community first", variant: "destructive" });
      body.community = community;
      body.address = `${a.address_line1}${a.address_line2 ? ", " + a.address_line2 : ""}, ${a.city} - ${a.pincode}`;
    }
    setPaying(true);
    try {
      const { data, error } = await supabase.functions.invoke("chicken-order", { body });
      if (error || data?.error) throw new Error(data?.error || "Could not start payment");
      const resp = await openRazorpayCheckout({
        key: data.keyId, amount: data.amount, currency: data.currency, name: "EggPro Chicken",
        description: "Chicken order", order_id: data.razorpayOrderId,
        prefill: { email: user.email || "", contact: phone }, theme: { color: "#EA580C" },
      });
      const { data: conf, error: cErr } = await supabase.functions.invoke("chicken-order", {
        body: { action: "confirm", orderId: data.orderId, ...resp },
      });
      if (cErr || conf?.error) throw new Error(conf?.error || "Payment verification failed");
      toast({ title: "Order placed!" });
      navigate(mode === "pickup" ? `/chicken/pickup/${data.orderId}` : "/orders", { replace: true });
    } catch (e: any) {
      toast({ title: e?.message === "Payment cancelled" ? "Payment cancelled" : "Payment failed", description: e?.message, variant: "destructive" });
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="page-scroll bg-[#FFF8E7] w-full">
      <div className="max-w-lg mx-auto pb-40">
        <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white px-5 pt-4 pb-6 rounded-b-[2rem] safe-top">
          <button onClick={() => navigate("/chicken")} className="h-11 w-11 -ml-2 flex items-center justify-center" aria-label="Back"><ArrowLeft className="w-6 h-6" /></button>
          <h1 className="text-2xl font-extrabold">Order Chicken</h1>
          <p className="text-sm font-semibold opacity-90">Weekly supply • Book on {bookingDays || "—"}</p>
          <p className="text-xs font-semibold opacity-90 mt-1">
            Pickup on {DAY_NAMES[settings.pickup_day]} {fmtTime(settings.pickup_start_time)} – {fmtTime(settings.pickup_end_time)} • Collect before {fmtTime(settings.cutoff_time)}
          </p>
        </div>

        {!bookingOpen && (
          <div className="mx-4 mt-4 p-4 rounded-2xl bg-red-50 border-2 border-red-200 text-red-800 text-sm font-semibold">
            Chicken booking is closed today. You can book on {bookingDays}.
          </div>
        )}

        <div className="px-4 mt-5 space-y-3">
          <h2 className="text-lg font-extrabold text-foreground">Chicken Products</h2>
          {loading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}
          {prodErr && <p className="text-sm text-red-700 font-semibold">Chicken products are currently unavailable. Please try again later.</p>}
          {!loading && !prodErr && products.length === 0 && <p className="text-sm text-muted-foreground font-semibold">Chicken products are currently unavailable. Please try again later.</p>}
          {products.map((p) => (
            <div key={p.id} className="bg-card rounded-2xl shadow-soft overflow-hidden flex">
              <SafeImage src={mediaUrl(p.image_path)} alt={p.name} className="w-28 h-28 shrink-0" />
              <div className="flex-1 p-3 min-w-0">
                <p className="font-extrabold text-foreground truncate">{p.name}</p>
                {p.weight && <p className="text-xs font-semibold text-muted-foreground">{p.weight}</p>}
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-lg font-extrabold text-orange-700">₹{unitPrice(p)}</span>
                  {p.offer_price && p.offer_price > 0 && p.offer_price < p.price && <span className="text-xs line-through text-muted-foreground">₹{p.price}</span>}
                </div>
                {p.available ? (
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => change(p.id, -1)} className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center" aria-label="Decrease"><Minus className="w-4 h-4" /></button>
                    <span className="w-8 text-center font-extrabold">{qty[p.id] || 0}</span>
                    <button onClick={() => change(p.id, 1)} disabled={!bookingOpen} className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center disabled:opacity-40" aria-label="Increase"><Plus className="w-4 h-4" /></button>
                  </div>
                ) : <p className="text-xs font-bold text-red-600 mt-2">Out of stock</p>}
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 mt-6">
          <h2 className="text-lg font-extrabold text-foreground mb-2">How would you like it?</h2>
          <div className="grid grid-cols-2 gap-3">
            {settings.delivery_enabled && (
              <button onClick={() => setMode("delivery")} className={`h-20 rounded-2xl border-2 font-extrabold flex flex-col items-center justify-center gap-1 ${mode === "delivery" ? "border-orange-500 bg-orange-50 text-orange-700" : "border-border bg-card text-foreground"}`}>
                <Truck className="w-6 h-6" /> DELIVERY
              </button>
            )}
            <button onClick={() => setMode("pickup")} className={`h-20 rounded-2xl border-2 font-extrabold flex flex-col items-center justify-center gap-1 ${mode === "pickup" ? "border-orange-500 bg-orange-50 text-orange-700" : "border-border bg-card text-foreground"} ${settings.delivery_enabled ? "" : "col-span-2"}`}>
              <Store className="w-6 h-6" /> PICK UP AT CENTER
            </button>
          </div>

          {mode === "pickup" ? (
            <div className="mt-4 space-y-3">
              {centerErr && <p className="text-sm text-red-700 font-semibold">Pickup locations are currently unavailable. Please try again shortly.</p>}
              {!centerErr && !loading && centers.length === 0 && <p className="text-sm text-muted-foreground font-semibold">Pickup locations are currently unavailable. Please try again shortly.</p>}
              {centers.map((c) => (
                <button key={c.id} onClick={() => setCenterId(c.id)} className={`w-full text-left rounded-2xl overflow-hidden border-2 bg-card ${centerId === c.id ? "border-orange-500" : "border-transparent"} shadow-soft`}>
                  <SafeImage src={mediaUrl(c.image_path)} alt={c.name} className="w-full h-32" label="EggPro Pickup Center" />
                  <div className="p-4">
                    <p className="font-extrabold text-foreground">{c.name}</p>
                    {c.address && <p className="text-sm text-muted-foreground flex gap-1 mt-1"><MapPin className="w-4 h-4 mt-0.5 shrink-0" />{c.address}</p>}
                    {c.pickup_instructions && <p className="text-xs text-muted-foreground mt-1">{c.pickup_instructions}</p>}
                    {c.google_maps_url ? (
                      <a href={c.google_maps_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="mt-3 inline-flex items-center gap-1 h-10 px-4 rounded-xl bg-stone-900 text-white text-xs font-extrabold">
                        VIEW ON GOOGLE MAPS <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <span className="mt-3 inline-flex items-center h-10 px-4 rounded-xl bg-muted text-muted-foreground text-xs font-extrabold">MAP LOCATION COMING SOON</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {!community && <p className="text-sm font-semibold text-muted-foreground">Delivery is available in EggPro communities. <button className="underline text-orange-700" onClick={() => navigate("/community")}>Choose a community</button></p>}
              {community && <p className="text-xs font-semibold text-muted-foreground">Delivering to {community}</p>}
              {community && addresses.length === 0 && <button onClick={() => navigate("/addresses")} className="w-full h-12 rounded-xl border-2 border-dashed border-orange-400 text-orange-700 font-bold">+ Add address in {community}</button>}
              {addresses.map((a) => (
                <button key={a.id} onClick={() => setAddressId(a.id)} className={`w-full text-left p-4 rounded-2xl bg-card border-2 ${addressId === a.id ? "border-orange-500" : "border-transparent"} shadow-soft`}>
                  <p className="font-bold text-foreground">{a.label}</p>
                  <p className="text-sm text-muted-foreground">{a.address_line1}{a.address_line2 ? `, ${a.address_line2}` : ""}, {a.city} - {a.pincode}</p>
                </button>
              ))}
            </div>
          )}

          <div className="mt-4">
            <label className="text-sm font-bold text-foreground">Phone number</label>
            <Input inputMode="numeric" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} className="h-12 mt-1 font-semibold" placeholder="10-digit mobile number" />
          </div>

          {settings.refund_policy && <p className="text-xs text-muted-foreground mt-4 font-semibold">{settings.refund_policy}</p>}
        </div>
      </div>

      <div className="fixed bottom-0 inset-x-0 p-4 bg-card border-t border-border safe-bottom">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Total</p>
            <p className="text-xl font-extrabold text-foreground">₹{total.toFixed(0)}</p>
          </div>
          <button onClick={pay} disabled={paying || total <= 0 || !bookingOpen} className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-extrabold disabled:opacity-50 flex items-center justify-center gap-2">
            {paying && <Loader2 className="w-5 h-5 animate-spin" />} PAY & PLACE ORDER
          </button>
        </div>
      </div>
    </div>
  );
};

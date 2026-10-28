import { useEffect, useMemo, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Minus, Plus, Truck, Store, MapPin, ExternalLink, CalendarDays, ChevronDown, Check, Copy, Tag, ReceiptText } from "lucide-react";
import { EggSpinner } from "@/components/EggSpinner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { fetchChickenOffers, type ChickenOffer } from "@/components/mobile/ChickenOfferPopup";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { SafeImage } from "@/components/BrandLogo";
import { mediaUrl } from "@/lib/media";
import { useChickenSettings, DAY_NAMES, fmtTime, chickenBookingOpen, upcomingPickupDeadline } from "@/lib/chickenSettings";
import { openRazorpayCheckout } from "@/lib/capacitorPayment";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useChickenCart } from "@/contexts/ChickenCartContext";
import { chickenUnitPrice, groupChickenProducts, type ChickenProduct } from "@/lib/chickenProducts";
import { isOfferLive } from "@/lib/offerValidity";
import { chickenCheckoutError } from '@/lib/chickenCheckoutValidation';

type Product = ChickenProduct;
interface Center { id: string; name: string; address: string; google_maps_url: string | null; image_path: string | null; pickup_instructions: string | null }
interface Address { id: string; label: string; address_line1: string; address_line2: string | null; city: string; pincode: string; phone: string; community: string | null }

const unitPrice = chickenUnitPrice;

function WeightPicker({ variants, value, onChange }: { variants: Product[]; value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const selected = variants.find(v => v.id === value) || variants[0];
  return (
    <div className="relative mt-2">
      <button type="button" onClick={() => setOpen(o => !o)} aria-haspopup="listbox" aria-expanded={open}
        className="h-12 w-full rounded-xl border-2 border-border bg-card px-3 flex items-center justify-between gap-2 text-sm font-extrabold text-foreground shadow-soft">
        <span className="truncate">{selected.weight || "Standard"} — ₹{unitPrice(selected)}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <button type="button" aria-label="Close weight options" className="fixed inset-0 z-20 cursor-default" onClick={() => setOpen(false)} />
          <ul role="listbox" className="absolute z-30 left-0 right-0 mt-1 rounded-xl border-2 border-border bg-card shadow-elevated overflow-hidden">
            {variants.map(v => (
              <li key={v.id}>
                <button type="button" role="option" aria-selected={v.id === value}
                  onClick={() => { onChange(v.id); setOpen(false); }}
                  className={`w-full px-3 h-12 flex items-center justify-between gap-2 text-sm font-bold ${v.id === value ? "bg-primary/10 text-primary" : "text-foreground"}`}>
                  <span>{v.weight || "Standard"} — ₹{unitPrice(v)}</span>
                  {v.id === value && <Check className="w-4 h-4 shrink-0" />}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

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
  const { qty, change, clear } = useChickenCart();
  const [mode, setMode] = useState<"delivery" | "pickup">("pickup");
  const [selectedWeights, setSelectedWeights] = useState<Record<string, string>>({});
  const [centerId, setCenterId] = useState("");
  const [addressId, setAddressId] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneLocked, setPhoneLocked] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{code:string;phone:string;name:string} | null>(null);
  const [paying, setPaying] = useState(false);
  const [soonOpen, setSoonOpen] = useState(false);
  const [coupons, setCoupons] = useState<ChickenOffer[]>([]);
  const [offerNow, setOfferNow] = useState(Date.now());
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const community = localStorage.getItem("selectedCommunity") || "";

  useEffect(() => {
    const refresh = () => fetchChickenOffers(true).then(setCoupons);
    refresh();
    const clock = setInterval(() => setOfferNow(Date.now()), 1000);
    const timer = setInterval(refresh, 60_000);
    return () => { clearInterval(clock); clearInterval(timer); };
  }, []);
  const liveCoupons = coupons.filter(o => isOfferLive(o, offerNow));

  const copyCoupon = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast({ title: "Coupon copied", description: `Use ${code} at checkout` });
      setTimeout(() => setCopiedCode(null), 1800);
    } catch { /* ignore */ }
  };

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
    supabase.from("profiles").select("phone,full_name").eq("id", user.id).maybeSingle().then(({ data }) => {
      const accountPhone = String(data?.phone || "").replace(/\D/g, "").slice(-10);
      if (/^\d{10}$/.test(accountPhone)) { setPhone(accountPhone); setPhoneLocked(true); }
      if (data?.full_name) setCustomerName(current => current || data.full_name || '');
    });
    if (community) {
      supabase.from("user_addresses").select("*").eq("user_id", user.id).eq("community", community)
        .then(({ data }) => { setAddresses((data as Address[]) || []); if (data?.[0]) setAddressId(data[0].id); });
    }
  }, [user, community]);

  const total = useMemo(() => products.reduce((s, p) => s + unitPrice(p) * (qty[p.id] || 0), 0), [products, qty]);
  const items = useMemo(() => Object.entries(qty).filter(([id,n]) => n > 0 && products.some(p => p.id === id && p.available)).map(([productId,quantity]) => ({productId,quantity})), [qty, products]);
  const couponActive = !!appliedCoupon && appliedCoupon.code === couponCode.trim() && appliedCoupon.phone === phone && appliedCoupon.name === customerName;
  const couponQuote = useQuery({
    queryKey: ['chicken-coupon-quote', user?.id, items, phone, customerName, couponCode.trim(), mode],
    enabled: couponActive && !!user && items.length > 0,
    staleTime: 0,
    placeholderData: keepPreviousData,
    retry: false,
    queryFn: async () => {
      const {data,error} = await supabase.functions.invoke('chicken-order',{body:{action:'quote',items,phone,customerName,couponCode,fulfillment:mode}});
      if (error || data?.error) {
        let message = data?.error || 'Could not apply coupon';
        if (error?.context) { try { message = (await error.context.json()).error || message; } catch { /* response unavailable */ } }
        throw new Error(message);
      }
      return data as {subtotal:number;discount:number;total:number};
    },
  });
  const applying = couponActive && couponQuote.isFetching;
  const quote = couponActive && items.length > 0 && couponQuote.isSuccess && !couponQuote.isFetching ? couponQuote.data : null;
  const shownQuote = couponActive && items.length > 0 ? couponQuote.data : null;
  useEffect(() => {
    if (couponActive && couponQuote.error) toast({title:couponQuote.error.message,variant:'destructive'});
  }, [couponActive, couponQuote.error, toast]);
  // If the account has no verified phone yet, save the typed number to the profile first
  // so the server-side coupon check (which trusts only the account number) succeeds.
  const ensureProfilePhone = async (): Promise<boolean> => {
    if (!user || phoneLocked) return true;
    const clean = phone.replace(/\D/g, "").slice(0, 10);
    if (!/^\d{10}$/.test(clean)) return false;
    const { error } = await supabase.from("profiles").update({ phone: clean }).eq("id", user.id);
    if (error) { toast({ title: "Could not save your number", variant: "destructive" }); return false; }
    setPhoneLocked(true);
    return true;
  };
  const applyCoupon = async () => {
    if (!user) { sessionStorage.setItem('auth_return_to', '/chicken/order'); navigate('/auth'); return; }
    const validation = chickenCheckoutError(customerName,phone,items.length);
    if (validation) {
      toast({title:validation.message,variant:'destructive'});
      const input = document.getElementById(validation.field === 'phone' ? 'chicken-phone' : 'chicken-name');
      if (validation.field !== 'items') { input?.scrollIntoView({block:'center'}); input?.focus(); }
      return;
    }
    if (!(await ensureProfilePhone())) return;
    if (couponActive) void couponQuote.refetch();
    else setAppliedCoupon({code:couponCode.trim(),phone,name:customerName});
  };
  const bookingOpen = chickenBookingOpen(settings);
  const bookingDays = settings.booking_days.map((d) => DAY_NAMES[d].slice(0, 3)).join(", ");
  const pickupDate = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "long", day: "numeric", month: "short", year: "numeric" }).format(upcomingPickupDeadline(settings));


  const pay = async () => {
    if (!user) { sessionStorage.setItem('auth_return_to', '/chicken/order'); navigate("/auth"); return; }
    const items = Object.entries(qty).filter(([id, n]) => n > 0 && products.some((p) => p.id === id && p.available)).map(([productId, quantity]) => ({ productId, quantity }));
    const validation = chickenCheckoutError(customerName,phone,items.length);
    if (validation) return toast({title:validation.message,variant:'destructive'});
    if (!(await ensureProfilePhone())) return;
    if (couponCode.trim() && !quote) return toast({title:'Apply your coupon before placing the order',variant:'destructive'});
    let body: any = { action: "create", items, fulfillment: mode, phone, customerName, couponCode };
    if (mode === "pickup") {
      if (!centerId) return toast({ title: "Select a pickup outlet", variant: "destructive" });
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
      if (error || data?.error) {
        let message = data?.error || 'Could not start payment';
        if (error?.context) { try { message = (await error.context.json()).error || message; } catch { /* response unavailable */ } }
        throw new Error(message);
      }
      if (!data.freeOrder) {
      const resp = await openRazorpayCheckout({
        key: data.keyId, amount: data.amount, currency: data.currency, name: "EggPro Chicken",
        description: "Chicken order", order_id: data.razorpayOrderId,
        prefill: { name:customerName, email: user.email || "", contact: phone }, theme: { color: "#EA580C" },
      });
      const { data: conf, error: cErr } = await supabase.functions.invoke("chicken-order", {
        body: { action: "confirm", orderId: data.orderId, ...resp },
      });
      if (cErr || conf?.error) throw new Error(conf?.error || "Payment verification failed");
      }
      toast({ title: "Order placed!" });
      clear();
      navigate(mode === "pickup" ? `/chicken/pickup/${data.orderId}` : "/orders", { replace: true });
    } catch (e: any) {
      toast({ title: e?.message === "Payment cancelled" ? "Payment cancelled" : "Payment failed", description: e?.message, variant: "destructive" });
    } finally {
      setPaying(false);
    }
  };

  return (
     <div className="page-scroll bg-secondary w-full">
       <div className="max-w-lg mx-auto pb-64">
        <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white px-5 pt-4 pb-6 rounded-b-[2rem] safe-top">
          <button onClick={() => navigate("/chicken")} className="h-9 w-9 -ml-2 flex items-center justify-center" aria-label="Back"><ArrowLeft className="w-6 h-6" /></button>
          <div className="flex items-center justify-between gap-3 mt-1">
            <h1 className="text-2xl font-extrabold">Order Chicken</h1>
            <button onClick={() => navigate("/chicken/orders")} className="h-9 px-3 rounded-full bg-white/20 border border-white/40 flex items-center gap-1.5 font-extrabold text-xs" aria-label="My chicken orders"><ReceiptText className="w-4 h-4" />My Orders</button>
          </div>
        </div>

         <section aria-label="Weekly pickup schedule" className="mx-4 mt-4 rounded-lg border-2 border-primary bg-primary/10 p-4 space-y-2">
           <p className="font-extrabold text-foreground flex items-start gap-2"><CalendarDays className="w-5 h-5 shrink-0 mt-0.5" />Weekly supply</p>
           <p className="text-lg font-extrabold text-accent">We supply chicken only on {DAY_NAMES[settings.pickup_day]}.</p>
           <p className="text-sm font-bold text-foreground">Book on {bookingDays || "—"} or {DAY_NAMES[settings.pickup_day]} from {fmtTime(settings.sunday_evening_start)} for the following week.</p>
           <p className="text-sm text-foreground">Pickup on {DAY_NAMES[settings.pickup_day]} {fmtTime(settings.pickup_start_time)} – {fmtTime(settings.pickup_end_time)}</p>
           <p className="text-sm font-extrabold text-foreground">Collect before {fmtTime(settings.cutoff_time)} (IST)</p>
         </section>

        {!bookingOpen && (
          <div className="mx-4 mt-4 p-4 rounded-2xl bg-red-50 border-2 border-red-200 text-red-800 text-sm font-semibold">
            Booking opens on {DAY_NAMES[settings.pickup_day]} at {fmtTime(settings.sunday_evening_start)} for next {DAY_NAMES[settings.pickup_day]}. You can also book on {bookingDays}.
          </div>
        )}

        <div className="px-4 mt-5 space-y-3">
          <h2 className="text-lg font-extrabold text-foreground">Chicken Products</h2>
          {loading && <div className="flex justify-center py-8"><EggSpinner size={30} className="text-primary" /></div>}
          {prodErr && <p className="text-sm text-red-700 font-semibold">Chicken products are currently unavailable. Please try again later.</p>}
          {!loading && !prodErr && products.length === 0 && <p className="text-sm text-muted-foreground font-semibold">Chicken products are currently unavailable. Please try again later.</p>}
          {groupChickenProducts(products).map((variants) => {
            const first = variants[0];
            const p = variants.find(v => v.id === selectedWeights[first.name]) || first;
            return (
            <div key={first.name} className="bg-card rounded-2xl shadow-soft overflow-hidden flex">
               <button onClick={() => navigate(`/chicken/product/${p.id}`)} className="shrink-0" aria-label={`View ${p.name} details`}>
                 <SafeImage src={mediaUrl(p.image_path)} alt={p.name} fit="contain" className="w-28 h-28" />
               </button>
              <div className="flex-1 p-3 min-w-0">
                <button onClick={() => navigate(`/chicken/product/${p.id}`)} className="text-left w-full" aria-label={`View ${p.name} details`}>
                  <p className="font-extrabold text-foreground leading-snug">{p.name}</p>
                  {p.weight && <p className="text-xs font-semibold text-muted-foreground">{p.weight}</p>}
                </button>
                {variants.length > 1 && <WeightPicker variants={variants} value={p.id} onChange={(id) => setSelectedWeights(prev => ({ ...prev, [first.name]: id }))} />}
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
          ); })}
        </div>

        <div className="px-4 mt-6">
          <h2 className="text-lg font-extrabold text-foreground mb-2">How would you like it?</h2>
          <div className="grid grid-cols-2 gap-3">
            {settings.delivery_enabled && (
              <button onClick={() => setSoonOpen(true)} className={`min-h-24 p-2 rounded-lg border-2 font-extrabold flex flex-col items-center justify-center gap-1 ${mode === "delivery" ? "border-orange-500 bg-orange-50 text-orange-700" : "border-border bg-card text-foreground"}`}>
                <Truck className="w-6 h-6 shrink-0" /> <span className="text-[13px] leading-tight text-center font-extrabold">DELIVERY TO SELECTED COMMUNITIES</span>
                <span className="text-[10px] font-extrabold tracking-widest bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">LAUNCHING SOON</span>
              </button>
            )}
            <button onClick={() => setMode("pickup")} className={`min-h-24 p-2 rounded-lg border-2 font-extrabold flex flex-col items-center justify-center gap-1 ${mode === "pickup" ? "border-orange-500 bg-orange-50 text-orange-700" : "border-border bg-card text-foreground"} ${settings.delivery_enabled ? "" : "col-span-2"}`}>
              <Store className="w-6 h-6" /> <span className="text-[13px] leading-tight text-center font-extrabold">PICK UP AT OUTLETS</span>
            </button>
          </div>

          {mode === "pickup" ? (
            <div className="mt-4 space-y-3">
              {centerErr && <p className="text-sm text-red-700 font-semibold">Pickup locations are currently unavailable. Please try again shortly.</p>}
              {!centerErr && !loading && centers.length === 0 && <p className="text-sm text-muted-foreground font-semibold">Pickup locations are currently unavailable. Please try again shortly.</p>}
              {centers.map((c) => (
                <button key={c.id} onClick={() => setCenterId(c.id)} className={`w-full text-left rounded-2xl overflow-hidden border-2 bg-card ${centerId === c.id ? "border-orange-500" : "border-transparent"} shadow-soft`}>
                   <SafeImage src={mediaUrl(c.image_path)} alt={c.name} fit="contain" className="w-full aspect-video" label="EggPro Pickup Outlet" />
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
            <label htmlFor="chicken-name" className="text-sm font-bold text-foreground">Customer name</label>
            <Input id="chicken-name" autoComplete="name" maxLength={100} value={customerName} onChange={e=>setCustomerName(e.target.value)} className="h-12 mt-1 font-bold" placeholder="Your full name" />
          </div>
          <div className="mt-4">
            <label htmlFor="chicken-phone" className="text-sm font-bold text-foreground">Phone number</label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground pointer-events-none select-none">+91</span>
              <Input id="chicken-phone" autoComplete="tel-national" inputMode="numeric" maxLength={10} value={phone} readOnly={phoneLocked} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} className="h-12 pl-12 font-semibold" placeholder="10-digit mobile number" />
            </div>
            {phoneLocked && <p className="text-xs font-semibold text-muted-foreground mt-1">Linked to your account — coupons work once per account number.</p>}
          </div>

          <div className="mt-5 space-y-2">
            <label htmlFor="chicken-coupon" className="text-sm font-extrabold text-foreground">Coupon code</label>
            <div className="flex gap-2">
              <Input id="chicken-coupon" maxLength={80} value={couponCode} onChange={e=>setCouponCode(e.target.value.toUpperCase())} placeholder="Paste coupon code" className="h-12 min-w-0 font-bold" />
              <Button onClick={applyCoupon} disabled={applying || !couponCode.trim() || paying} className="h-12 font-extrabold shrink-0">{applying ? <EggSpinner size={16} /> : <Tag className="w-4 h-4" />} APPLY</Button>
            </div>
            <p className="text-xs font-bold text-muted-foreground">Offer applies to one full pack. Extra packs are paid normally. One use per phone number.</p>
            {shownQuote && <div className="border-l-4 border-primary pl-3 text-sm font-bold text-foreground"><p className="flex items-center gap-2">Coupon applied{applying && <EggSpinner size={16} className="text-orange-600" />}</p><p>Subtotal: ₹{shownQuote.subtotal.toFixed(2)}</p><p>Coupon savings: −₹{shownQuote.discount.toFixed(2)}</p><p>To pay: ₹{shownQuote.total.toFixed(2)}</p><Button variant="ghost" onClick={()=>{setCouponCode('');setAppliedCoupon(null);}} className="h-12 px-0">Remove coupon</Button></div>}
          </div>

          {liveCoupons.length > 0 && (
            <div className="mt-5 rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50 p-4">
              <p className="text-sm font-extrabold text-foreground flex items-center gap-2"><Tag className="w-4 h-4 text-orange-600" />Available coupons</p>
              <div className="mt-2 space-y-2">
                {liveCoupons.map((o) => (
                  <div key={o.id} className="flex items-center justify-between gap-2 bg-card rounded-xl px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-orange-700 tracking-widest">{o.code}</p>
                      <p className="text-xs font-semibold text-muted-foreground">{o.discount_percentage === 100 ? 'First pack free' : `${o.discount_percentage}% off the first pack`} — {o.title}</p>
                    </div>
                    <Button onClick={() => { if (o.code) void copyCoupon(o.code); }} className="shrink-0 h-10 px-3 rounded-lg text-xs font-extrabold flex items-center gap-1.5">
                      {copiedCode === o.code ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} COPY
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {settings.refund_policy && <p className="text-xs text-muted-foreground mt-4 font-semibold">{settings.refund_policy}</p>}
        </div>
      </div>

      <Dialog open={soonOpen} onOpenChange={setSoonOpen}>
        <DialogContent className="max-w-sm text-center rounded-2xl">
          <div className="mx-auto w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center"><Truck className="w-7 h-7 text-orange-600" /></div>
          <h3 className="text-xl font-extrabold text-foreground">Launching Soon</h3>
          <p className="text-sm font-semibold text-muted-foreground">Home delivery of chicken to selected communities is launching soon. Until then, please choose <span className="font-extrabold text-foreground">Pick Up At Outlets</span> and collect your order from your nearest outlet.</p>
          <Button variant="gradient" onClick={() => setSoonOpen(false)} className="w-full h-12 font-extrabold">GOT IT</Button>
        </DialogContent>
      </Dialog>

       <div className="chicken-action-bar">
         {mode === "pickup" && <div aria-label="This week's pickup" className="max-w-lg mx-auto mb-3 border-l-4 border-primary pl-3">
           <p className="text-sm font-extrabold text-foreground">Pickup: {pickupDate}</p>
           <p className="text-xs text-muted-foreground">{fmtTime(settings.pickup_start_time)} – {fmtTime(settings.pickup_end_time)} • IST</p>
           <p className="text-xs font-extrabold text-foreground">Deadline: {fmtTime(settings.cutoff_time)} on {pickupDate}</p>
         </div>}
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Total</p>
            <p aria-live="polite" className="text-xl font-extrabold text-foreground flex items-center gap-2">{applying ? <><EggSpinner size={20} className="text-orange-600" /><span className="sr-only">Updating total</span></> : couponActive && !quote && items.length > 0 ? 'Check coupon' : `₹${(quote?.total ?? total).toFixed(2)}`}</p>
          </div>
           <Button variant="gradient" onClick={pay} disabled={paying || applying || (couponActive && !quote) || total <= 0 || !bookingOpen} className="flex-1 h-14 min-w-0 px-3 rounded-lg font-extrabold">
            {paying && <EggSpinner size={18} className="text-white" />} {quote?.total === 0 ? 'PLACE FREE ORDER' : 'PAY & PLACE ORDER'}
           </Button>
        </div>
      </div>
    </div>
  );
};

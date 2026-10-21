import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Minus, Plus, ShoppingCart, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SafeImage } from "@/components/BrandLogo";
import { supabase } from "@/integrations/supabase/client";
import { mediaUrl } from "@/lib/media";
import { chickenUnitPrice, type ChickenProduct } from "@/lib/chickenProducts";
import { useChickenCart } from "@/contexts/ChickenCartContext";
import { useChickenSettings, istWeekday } from "@/lib/chickenSettings";

export function ChickenProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { qty, change } = useChickenCart();
  const { settings } = useChickenSettings();
  const [variants, setVariants] = useState<ChickenProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [selectedId, setSelectedId] = useState(id);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    setSelectedId(id);
    (async () => {
      if (!id) { setLoading(false); return; }
      const clicked = await supabase.from("chicken_products").select("*").eq("id", id).eq("active", true).eq("archived", false).maybeSingle();
      if (cancelled) return;
      if (clicked.error || !clicked.data) { setFailed(true); setLoading(false); return; }
      const result = await supabase.from("chicken_products").select("*").eq("name", clicked.data.name).eq("active", true).eq("archived", false).order("price");
      if (cancelled) return;
      setVariants(result.data?.length ? result.data : [clicked.data]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id]);
  const product = variants.find((variant) => variant.id === selectedId);
  const bookingOpen = settings.booking_days.includes(istWeekday());
  const count = product ? qty[product.id] || 0 : 0;
  return (
    <div className="page-scroll bg-background">
      <div className="max-w-lg mx-auto pb-44">
        <header className="flex items-center justify-between px-4 py-3 safe-area-pt">
          <Button variant="ghost" size="icon" className="h-12 w-12" aria-label="Back to chicken products" onClick={() => navigate("/chicken/order")}><ArrowLeft /></Button>
          <span className="text-sm font-extrabold text-foreground">EGGPRO CHICKEN</span>
          <Button variant="ghost" size="icon" className="h-12 w-12" aria-label="Chicken cart" onClick={() => navigate("/chicken/order")}><ShoppingCart /></Button>
        </header>
        {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div> : failed || !product ? (
          <p className="p-6 text-muted-foreground">This chicken product is currently unavailable.</p>
        ) : <>
          <SafeImage src={mediaUrl(product.image_path)} alt={product.name} fit="contain" className="w-full aspect-square max-h-96" />
          <div className="px-5 py-6 space-y-5">
            <div><h1 className="text-2xl font-extrabold text-foreground">{product.name}</h1><p className="mt-1 text-muted-foreground">{product.weight}</p></div>
            <div className="flex items-baseline gap-3"><span className="text-2xl font-extrabold text-accent">₹{chickenUnitPrice(product)}</span>{product.offer_price && product.offer_price > 0 && product.offer_price < product.price ? <span className="line-through text-muted-foreground">₹{product.price}</span> : null}</div>
            {variants.length > 1 && <section><h2 className="text-base mb-3">Choose weight</h2><div className="flex flex-wrap gap-2">{variants.map((variant) => <Button key={variant.id} variant={variant.id === product.id ? "default" : "outline"} className="min-h-12" onClick={() => setSelectedId(variant.id)}>{variant.weight || variant.name}</Button>)}</div></section>}
            <section className="border-t border-border pt-5"><h2 className="text-lg mb-2">About this product</h2>{product.description && <p className="text-sm leading-relaxed whitespace-pre-line text-foreground">{product.description}</p>}</section>
            {!product.available && <p className="text-destructive font-bold">Out of stock</p>}
            {!bookingOpen && <p className="text-muted-foreground font-bold">Chicken booking is closed today.</p>}
          </div>
        </>}
      </div>
      {product && !loading && <div className="chicken-action-bar"><div className="max-w-lg mx-auto flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3"><div><p className="text-xs text-muted-foreground">{product.weight || "Price per pack"}</p><p className="text-xl font-extrabold">₹{chickenUnitPrice(product)}</p></div>
          {count > 0 ? <div className="flex items-center gap-3"><Button variant="outline" size="icon" className="h-12 w-12" aria-label="Decrease quantity" onClick={() => change(product.id, -1)}><Minus /></Button><span aria-label="Cart quantity" className="w-6 text-center font-extrabold">{count}</span><Button size="icon" className="h-12 w-12" aria-label="Increase quantity" disabled={!bookingOpen || !product.available || count >= 50} onClick={() => change(product.id, 1)}><Plus /></Button></div> : <Button className="h-12" disabled={!bookingOpen || !product.available} onClick={() => change(product.id, 1)}><ShoppingCart />ADD TO CART</Button>}
        </div>
        {Object.values(qty).some((quantity) => quantity > 0) && <Button variant="gradient" className="h-12 w-full" onClick={() => navigate("/chicken/order")}>CONTINUE TO CHECKOUT<ChevronRight /></Button>}
      </div></div>}
    </div>
  );
}
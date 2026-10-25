import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { isOfferLive } from "@/lib/offerValidity";
import { OfferImage } from "./OfferImage";

export interface ChickenOffer {
  id: string;
  title: string;
  description: string | null;
  discount_percentage: number | null;
  code: string | null;
  image_url: string | null;
  valid_from: string | null;
  valid_until: string | null;
}

export async function fetchChickenOffers(): Promise<ChickenOffer[]> {
  const { data } = await supabase
    .from("offers")
    .select("*")
    .eq("is_active", true)
    .in("business", ["chicken", "all"])
    .order("created_at", { ascending: false });
  return ((data || []) as ChickenOffer[]).filter((o) => o.code && isOfferLive(o));
}

/** One-time-per-launch popup shown when the chicken tab opens and a chicken offer with a coupon code is live. */
export const ChickenOfferPopup = () => {
  const [offer, setOffer] = useState<ChickenOffer | null>(null);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(Date.now());
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    const refresh = () => fetchChickenOffers().then((offers) => {
      if (cancelled) return;
      const unseen = offers.find((o) => sessionStorage.getItem(`chicken-offer-seen-${o.id}`) !== "1");
      if (unseen) {
        setOffer(unseen);
        setOpen(true);
        sessionStorage.setItem(`chicken-offer-seen-${unseen.id}`, "1");
      }
    });
    refresh();
    const timer = setInterval(() => { setNow(Date.now()); refresh(); }, 1000);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  const copy = async () => {
    if (!offer?.code) return;
    try {
      await navigator.clipboard.writeText(offer.code);
      setCopied(true);
      toast({ title: "Coupon copied", description: `Use ${offer.code} at checkout` });
      setTimeout(() => setCopied(false), 1800);
    } catch { /* ignore */ }
  };

  if (!offer || !isOfferLive(offer, now)) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm p-0 overflow-hidden rounded-2xl">
        <OfferImage src={offer.image_url} alt={offer.title} className="w-full max-h-64 object-contain" />
        <div className="p-5 text-center">
          <p className="inline-flex items-center gap-1.5 text-xs font-extrabold tracking-normal text-foreground bg-primary/20 px-3 py-1 rounded-full">
            <Tag className="w-3.5 h-3.5" /> {offer.discount_percentage}% OFF
          </p>
          <h3 className="mt-2 text-xl font-extrabold text-foreground">{offer.title}</h3>
          {offer.description && <p className="mt-1 text-sm font-semibold text-muted-foreground">{offer.description}</p>}
          <Button variant="outline"
            onClick={copy}
            className="mt-4 w-full h-12 rounded-lg border-2 border-dashed border-primary bg-secondary text-foreground font-extrabold tracking-normal flex items-center justify-center gap-2"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {offer.code}
          </Button>
          <Button variant="gradient" onClick={() => setOpen(false)} className="mt-3 w-full h-12 font-extrabold">
            CONTINUE
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ChickenOffer {
  id: string;
  title: string;
  description: string | null;
  discount_percentage: number | null;
  code: string | null;
  image_url: string | null;
}

export async function fetchChickenOffers(): Promise<ChickenOffer[]> {
  const nowIso = new Date().toISOString();
  const { data } = await supabase
    .from("offers")
    .select("*")
    .eq("is_active", true)
    .in("business", ["chicken", "all"])
    .or(`valid_from.is.null,valid_from.lte.${nowIso}`)
    .or(`valid_until.is.null,valid_until.gte.${nowIso}`)
    .order("created_at", { ascending: false });
  return ((data || []) as ChickenOffer[]).filter((o) => o.code);
}

/** One-time-per-launch popup shown when the chicken tab opens and a chicken offer with a coupon code is live. */
export const ChickenOfferPopup = () => {
  const [offer, setOffer] = useState<ChickenOffer | null>(null);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchChickenOffers().then((offers) => {
      const unseen = offers.find((o) => sessionStorage.getItem(`chicken-offer-seen-${o.id}`) !== "1");
      if (unseen) {
        setOffer(unseen);
        setOpen(true);
        sessionStorage.setItem(`chicken-offer-seen-${unseen.id}`, "1");
      }
    });
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

  if (!offer) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm p-0 overflow-hidden rounded-2xl">
        {offer.image_url && <img src={offer.image_url} alt={offer.title} className="w-full h-44 object-cover" />}
        <div className="p-5 text-center">
          <p className="inline-flex items-center gap-1.5 text-xs font-extrabold tracking-widest text-orange-700 bg-orange-100 px-3 py-1 rounded-full">
            <Tag className="w-3.5 h-3.5" /> {offer.discount_percentage}% OFF
          </p>
          <h3 className="mt-2 text-xl font-extrabold text-foreground">{offer.title}</h3>
          {offer.description && <p className="mt-1 text-sm font-semibold text-muted-foreground">{offer.description}</p>}
          <button
            onClick={copy}
            className="mt-4 w-full h-12 rounded-xl border-2 border-dashed border-orange-400 bg-orange-50 text-orange-700 font-extrabold tracking-widest flex items-center justify-center gap-2"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {offer.code}
          </button>
          <Button variant="gradient" onClick={() => setOpen(false)} className="mt-3 w-full h-12 font-extrabold">
            CONTINUE
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

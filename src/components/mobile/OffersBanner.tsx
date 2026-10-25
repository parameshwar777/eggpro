import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { OfferImage } from "./OfferImage";
import { isOfferLive } from "@/lib/offerValidity";

interface Offer {
  id: string;
  title: string;
  description: string | null;
  discount_percentage: number | null;
  code: string | null;
  image_url: string | null;
  valid_until: string | null;
  valid_from: string | null;
}

export const OffersBanner = ({ business = "eggs" }: { business?: "eggs" | "chicken" | "cafe" }) => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [index, setIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const { toast } = useToast();

  useEffect(() => {
    const fetchOffers = async () => {
      const { data } = await supabase
        .from("offers")
        .select("id,title,description,discount_percentage,code,image_url,valid_from,valid_until")
        .eq("is_active", true)
        .in("business", [business, "all"])
        .order("created_at", { ascending: false });
      setOffers((data || []) as Offer[]);
    };
    fetchOffers();
    const clock = setInterval(() => setNow(Date.now()), 1000);
    const refresh = setInterval(fetchOffers, 60_000);
    return () => { clearInterval(clock); clearInterval(refresh); };
  }, [business]);

  const liveOffers = offers.filter(o => isOfferLive(o, now));

  useEffect(() => {
    if (liveOffers.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % liveOffers.length), 4500);
    return () => clearInterval(t);
  }, [liveOffers.length]);

  if (liveOffers.length === 0) return null;

  const offer = liveOffers[index % liveOffers.length];

  const handleCopy = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      toast({ title: "Coupon copied", description: `Use ${code} at checkout` });
      setTimeout(() => setCopiedId(null), 1800);
    } catch {}
  };

  return (
    <div className="mx-4 mt-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={offer.id}
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="relative rounded-lg overflow-hidden shadow-card gradient-hero text-primary-foreground"
        >
          <OfferImage src={offer.image_url} alt={offer.title} className="w-full max-h-64 object-contain" />
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Tag className="w-4 h-4" />
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-90">
                    {offer.discount_percentage}% OFF
                  </p>
                </div>
                <h3 className="text-lg font-bold leading-tight">{offer.title}</h3>
                {offer.description && <p className="text-xs opacity-90 mt-0.5 line-clamp-2">{offer.description}</p>}
              </div>
              {offer.code && (
                <Button variant="secondary"
                  onClick={() => { if (offer.code) void handleCopy(offer.code, offer.id); }}
                  className="rounded-lg px-3 py-2 text-xs font-bold flex items-center gap-1.5 shadow-soft"
                >
                  {copiedId === offer.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {offer.code}
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      {liveOffers.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {liveOffers.map((_, i) => (
            <Button variant="ghost" size="icon" aria-label={`Offer ${i + 1}`}
              key={i}
              onClick={() => setIndex(i)}
              className={`h-2 p-0 rounded-full transition-all ${i === index % liveOffers.length ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

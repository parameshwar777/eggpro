import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Offer {
  id: string;
  title: string;
  description: string | null;
  discount_percentage: number | null;
  code: string | null;
  image_url: string | null;
  valid_until: string | null;
}

export const OffersBanner = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [index, setIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchOffers = async () => {
      const nowIso = new Date().toISOString();
      const { data } = await supabase
        .from("offers")
        .select("id,title,description,discount_percentage,code,image_url,valid_until")
        .eq("is_active", true)
        .or(`valid_from.is.null,valid_from.lte.${nowIso}`)
        .or(`valid_until.is.null,valid_until.gte.${nowIso}`)
        .order("created_at", { ascending: false });
      setOffers((data || []) as Offer[]);
    };
    fetchOffers();
  }, []);

  useEffect(() => {
    if (offers.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % offers.length), 4500);
    return () => clearInterval(t);
  }, [offers.length]);

  if (offers.length === 0) return null;

  const offer = offers[index];

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
          className="relative rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white"
        >
          {offer.image_url && (
            <motion.img
              src={offer.image_url}
              alt={offer.title}
              initial={{ scale: 1.08 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="w-full h-44 object-cover"
            />
          )}
          <div className={offer.image_url ? "absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col justify-end p-4" : "p-4"}>
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
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={() => handleCopy(offer.code!, offer.id)}
                  className="bg-white/95 text-orange-700 rounded-lg px-3 py-2 text-xs font-bold flex items-center gap-1.5 shadow"
                >
                  {copiedId === offer.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {offer.code}
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      {offers.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {offers.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

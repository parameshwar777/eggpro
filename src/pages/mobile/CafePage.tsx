import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Dumbbell, Leaf, Sparkles, UtensilsCrossed, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BrandLogo, SafeImage } from "@/components/BrandLogo";
import { mediaUrl } from "@/lib/media";

interface Cafe { id: string; name: string; address: string; image_path: string | null }

const points = [
  { icon: Dumbbell, t: "High Protein" },
  { icon: Leaf, t: "Fresh Ingredients" },
  { icon: UtensilsCrossed, t: "Simple, Real Food" },
  { icon: Sparkles, t: "Great Taste" },
];

export const CafePage = () => {
  const navigate = useNavigate();
  const [cafes, setCafes] = useState<Cafe[]>([]);

  useEffect(() => {
    supabase.from("cafe_locations").select("id,name,address,image_path").eq("active", true).order("display_order")
      .then(({ data }) => setCafes((data as Cafe[]) || []));
  }, []);

  return (
    <div className="page-scroll bg-stone-950 w-full text-stone-100">
      <div className="max-w-lg mx-auto pb-12 px-5 safe-top">
        <button onClick={() => navigate("/welcome")} className="h-11 w-11 -ml-2 mt-2 flex items-center justify-center" aria-label="Back">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex flex-col items-center text-center pt-4">
          <BrandLogo size={96} />
          <h1 className="mt-5 text-3xl font-extrabold tracking-wide">EGGPRO CAFÉ</h1>
          <span className="mt-3 text-xs font-extrabold tracking-[0.3em] bg-amber-400 text-stone-900 px-4 py-1.5 rounded-full">COMING SOON</span>
          <p className="mt-4 text-sm font-semibold text-stone-300">High-Protein Food • Fresh Ingredients • Better Everyday Nutrition</p>
          <p className="mt-2 text-base font-bold text-amber-300">Will open on 11 October 2026</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-8">
          {points.map((p) => (
            <div key={p.t} className="rounded-2xl bg-stone-900 border border-stone-800 p-4 flex flex-col gap-2">
              <p.icon className="w-6 h-6 text-amber-400" />
              <span className="text-sm font-bold">{p.t}</span>
            </div>
          ))}
        </div>

        {cafes.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-extrabold mb-3">Our Café Locations</h2>
            <div className="space-y-3">
              {cafes.map((c) => (
                <div key={c.id} className="rounded-2xl overflow-hidden bg-stone-900 border border-stone-800">
                  <SafeImage src={mediaUrl(c.image_path)} alt={c.name} className="w-full h-40" label="EggPro Café" />
                  <div className="p-4">
                    <p className="font-bold">{c.name}</p>
                    {c.address && <p className="text-sm text-stone-400 flex gap-1 mt-1"><MapPin className="w-4 h-4 mt-0.5 shrink-0" />{c.address}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

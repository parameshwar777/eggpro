import { ChickenClosedNotice } from "@/components/mobile/ChickenClosedNotice";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, Leaf, HeartPulse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChickenOfferPopup } from "@/components/mobile/ChickenOfferPopup";

const ROWS: [string, string, string][] = [
  ["BREAST MEAT", "29.15%", "22.94%"],
  ["THIGH & DRUMSTICK", "25.18%", "27.51%"],
  ["WINGS", "12.47%", "18.44%"],
  ["WATER HOLDING CAPACITY", "14.25%", "16.00%"],
  ["BOUND WATER", "58.14%", "60.08%"],
  ["FREE WATER", "11.27%", "14.50%"],
  ["MUSCLE FIBRE DIAMETER", "64.16%", "57.50%"],
  ["SHEAR FORCE VALUE", "7.16%", "9.07%"],
  ["MOISTEUR", "67.52%", "74.34%"],
  ["PROTEIN", "19.00%", "20.37%"],
  ["FLAVOUR", "6.64", "7.13"],
  ["TENDERNESS", "6.77", "7.19"],
  ["JUICINESS", "6.72", "7.21"],
  ["ACCEPATABILITY", "6.83", "6.98"],
  ["COLOR INTENSITY", "WHITE", "DARKER"],
  ["CHOLESTEROL THIGH MEAT", "71.68", "50.03"],
];

export const ChickenInfoPage = () => {
  const navigate = useNavigate();
  return (
    <div className="page-scroll bg-background w-full">
      <ChickenOfferPopup />
      <ChickenClosedNotice />
      <div className="max-w-lg mx-auto pb-44">
        <div className="gradient-hero text-accent-foreground px-5 pt-4 pb-5 safe-top">
          <Button variant="ghost" size="icon" onClick={() => navigate("/welcome")} className="h-12 w-12 -ml-2" aria-label="Back">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-3 mt-2">
            <div>
              <h1 className="text-2xl font-extrabold tracking-normal">EGG PRO BROILER</h1>
              <p className="text-sm font-semibold opacity-90">Slow-Growing Broiler for Tasty, Healthy &amp; Quality Chicken</p>
            </div>
          </div>
        </div>

        <section className="px-4 pt-3 pb-5 bg-secondary border-b border-border" aria-label="Chicken meat comparison">
          <h2 className="text-lg font-extrabold mb-2 text-foreground">MEAT CHARACTERISTICS</h2>
          <div className="rounded-lg border-2 border-primary bg-card overflow-hidden shadow-soft">
            <table className="w-full table-fixed text-xs leading-snug">
              <colgroup><col className="w-[40%]" /><col className="w-[30%]" /><col className="w-[30%]" /></colgroup>
              <thead>
                <tr className="text-left">
                  <th className="bg-primary/20 text-foreground px-2 py-3 font-extrabold break-words">MEAT CHARACTERISTICS</th>
                  <th className="bg-primary/20 text-foreground px-1 py-3 font-extrabold text-center">NORMAL<br />BROILER<br />CHICKEN</th>
                  <th className="bg-primary/30 text-foreground px-1 pt-2 pb-3 align-top font-extrabold text-center border-l-2 border-primary">EGG PRO<br />BROILER<br />CHICKEN</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map(([k, n, e], i) => (
                  <tr key={k} className={i % 2 ? "bg-secondary" : "bg-card"}>
                    <td className="px-2 py-2.5 font-bold text-foreground break-words">{k}</td>
                    <td className="px-1 py-2.5 text-center font-bold text-muted-foreground">{n}</td>
                    <td className="px-1 py-2.5 text-center font-extrabold text-foreground bg-primary/20 border-l-2 border-primary">{e}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-2 px-1">Values shown are based on the supplied comparative meat-quality data.</p>
        </section>

        <section className="px-5 py-5 space-y-3">
          <p className="text-sm leading-relaxed text-justify text-foreground">
            Today's fast-growing white broilers are generally slaughtered at an increasingly younger age. Their rapid growth can result in compact meat with comparatively lower water-holding capacity, particularly in the large breast muscles. This may affect the eating quality and natural taste.
          </p>
          <p className="text-sm leading-relaxed text-justify text-foreground">
            EGG PRO Slow-Growing Broiler is a coloured broiler developed for a more natural, slower growth pattern. These birds can be reared under open-housing conditions with comparatively lower input requirements, making them suitable for farmers looking for an alternative to conventional fast-growing broilers.
          </p>
        </section>

        <section className="px-5 py-5 border-t border-border">
          <h2 className="text-lg font-extrabold flex items-center gap-2 text-foreground"><Leaf className="w-5 h-5 text-accent" /> Naturally Tasty Meat</h2>
          <p className="text-sm leading-relaxed text-justify mt-2 text-foreground">
            A comparative study conducted by the National Research Centre on Meat (NRCM), an ICAR organization, evaluated the meat quality of coloured broilers against fast-growing white broilers.
          </p>
          <p className="text-sm leading-relaxed text-justify mt-2 text-foreground">
            The study indicated that the slow-growing coloured broiler meat had better water-holding capacity and desirable meat-quality characteristics, contributing to a more appealing and distinctly tasty eating experience.
          </p>
        </section>

        <section className="px-5 py-5 border-t border-border">
          <h2 className="text-lg font-extrabold flex items-center gap-2 text-foreground"><HeartPulse className="w-5 h-5 text-accent" /> A Better Choice for Health-Conscious Consumers</h2>
          <p className="text-sm leading-relaxed text-justify mt-2 text-foreground">
            Analysis of the meat, including fatty-acid profiling and chemical composition, showed favourable nutritional characteristics in the slow-growing coloured chicken.
          </p>
          <p className="text-sm leading-relaxed text-justify mt-2 text-foreground">
            With its slower growth pattern, coloured appearance, and quality meat characteristics, EGG PRO Broiler offers a compelling choice for farmers, retailers, and consumers seeking tasty, quality and nutritionally desirable chicken.
          </p>
        </section>


      </div>

       <div className="chicken-action-bar">
        <div className="max-w-lg mx-auto">
           <Button variant="gradient"
            onClick={() => navigate("/chicken/order")}
             className="w-full h-14 rounded-lg font-extrabold text-base"
          >
            NEXT <ChevronRight className="w-5 h-5" />
           </Button>
        </div>
      </div>
    </div>
  );
};

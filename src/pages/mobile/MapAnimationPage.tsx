import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import mapBg from "@/assets/hyderabad-map-bg.jpg";

const communities = [
  { name: "Maple Town Villas", lat: 17.35148, lng: 78.4012961 },
  { name: "Dream Homes", lat: 17.3698373, lng: 78.3868185 },
  { name: "Libdom Villas", lat: 17.3598187, lng: 78.3815927 },
  { name: "RV Somwrita", lat: 17.3368101, lng: 78.3802129 },
  { name: "Infocity Greenwoods", lat: 17.3540323, lng: 78.3909815 },
  { name: "Giridhari Executive Park", lat: 17.3607129, lng: 78.3746233 },
  { name: "Vasati Anandi", lat: 17.3572432, lng: 78.3763622 },
  { name: "Prestige Royal Woods", lat: 17.3429995, lng: 78.3745926 },
  { name: "SMR Boulder Woods", lat: 17.3495815, lng: 78.388748 },
  { name: "PBEL City", lat: 17.3594148, lng: 78.3719878 },
  { name: "Vaishnavi Houdini", lat: 17.34863, lng: 78.3846091 },
  { name: "Harmony County", lat: 17.3505513, lng: 78.3893224 },
];

const latMin = 17.325;
const latMax = 17.385;
const lngMin = 78.36;
const lngMax = 78.415;

function toScreen(lat: number, lng: number, width: number, height: number) {
  const x = ((lng - lngMin) / (lngMax - lngMin)) * width * 0.85 + width * 0.075;
  const y = ((latMax - lat) / (latMax - latMin)) * height * 0.55 + height * 0.2;
  return { x, y };
}

export const MapAnimationPage = () => {
  const navigate = useNavigate();
  const [visiblePins, setVisiblePins] = useState(0);
  const [showBranding, setShowBranding] = useState(false);
  const [showLabel, setShowLabel] = useState(-1);

  useEffect(() => {
    const pinTimers: ReturnType<typeof setTimeout>[] = [];
    communities.forEach((_, i) => {
      pinTimers.push(
        setTimeout(() => {
          setVisiblePins(i + 1);
          setShowLabel(i);
        }, 300 + i * 250)
      );
    });

    const brandTimer = setTimeout(() => {
      setShowBranding(true);
    }, 300 + communities.length * 250 + 400);

    const navTimer = setTimeout(async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("community")
            .eq("id", session.user.id)
            .single();
          if (profile?.community) {
            localStorage.setItem("selectedCommunity", profile.community);
            navigate("/home", { replace: true });
          } else {
            navigate("/community", { replace: true });
          }
        } else {
          navigate("/auth", { replace: true });
        }
      } catch {
        navigate("/auth", { replace: true });
      }
    }, 300 + communities.length * 250 + 4500);

    return () => {
      pinTimers.forEach(clearTimeout);
      clearTimeout(brandTimer);
      clearTimeout(navTimer);
    };
  }, [navigate]);

  const w = 390;
  const h = 754;

  return (
    <div className="min-h-[100dvh] w-full relative overflow-hidden bg-background">
      {/* Real map background */}
      <img
        src={mapBg}
        alt="Hyderabad Map"
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
        fetchPriority="high"
      />
      {/* Slight overlay for contrast */}
      <div className="absolute inset-0 bg-background/20" />

      {/* Pins SVG */}
      <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${w} ${h}`}>
        <defs>
          <radialGradient id="pinGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="pinGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#F97316" />
          </linearGradient>
          <filter id="pinShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.3" />
          </filter>
        </defs>
        {communities.map((c, i) => {
          const pos = toScreen(c.lat, c.lng, w, h);
          if (i >= visiblePins) return null;

          return (
            <g key={c.name}>
              {/* Glow ring */}
              <motion.circle
                cx={pos.x} cy={pos.y} r="35"
                fill="url(#pinGlow)"
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: [0, 2, 3], opacity: [1, 0.5, 0] }}
                transition={{ duration: 1.4, ease: "easeOut" }}
              />
              {/* Pin marker */}
              <motion.g
                initial={{ scale: 0, y: -60 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 220, damping: 10 }}
                filter="url(#pinShadow)"
              >
                {/* Pin body - teardrop */}
                <path
                  d={`M ${pos.x} ${pos.y - 28} 
                      C ${pos.x - 18} ${pos.y - 28} ${pos.x - 18} ${pos.y - 8} ${pos.x} ${pos.y + 4} 
                      C ${pos.x + 18} ${pos.y - 8} ${pos.x + 18} ${pos.y - 28} ${pos.x} ${pos.y - 28} Z`}
                  fill="url(#pinGrad)"
                  stroke="white"
                  strokeWidth="3"
                />
                <circle cx={pos.x} cy={pos.y - 16} r="6.5" fill="white" />
                <circle cx={pos.x} cy={pos.y - 16} r="3" fill="#F97316" />
              </motion.g>
              {/* Shadow */}
              <motion.ellipse
                cx={pos.x} cy={pos.y + 8} rx="10" ry="4"
                fill="rgba(0,0,0,0.18)"
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: 0.1 }}
              />
            </g>
          );
        })}
      </svg>

      {/* Floating name labels */}
      <AnimatePresence>
        {communities.map((c, i) => {
          const pos = toScreen(c.lat, c.lng, w, h);
          if (i >= visiblePins) return null;
          const isRecent = i === showLabel || i >= visiblePins - 3;

          return isRecent ? (
            <motion.div
              key={`label-${c.name}`}
              className="absolute pointer-events-none"
              style={{
                left: `${(pos.x / w) * 100}%`,
                top: `${((pos.y - 46) / h) * 100}%`,
                transform: "translateX(-50%)",
              }}
              initial={{ opacity: 0, y: -10, scale: 0.8 }}
              animate={{ opacity: i === showLabel ? 1 : 0.8, y: 0, scale: 1 }}
              transition={{ duration: 0.35, type: "spring", stiffness: 200 }}
            >
              <span
                className="whitespace-nowrap px-3 py-1.5 rounded-xl shadow-xl border-2"
                style={{
                  background: "linear-gradient(135deg, #FFFBEB, #FEF3C7)",
                  color: "#92400E",
                  fontSize: "14px",
                  fontWeight: 800,
                  letterSpacing: "-0.3px",
                  lineHeight: 1.3,
                  borderColor: "#F59E0B",
                }}
              >
                📍 {c.name}
              </span>
            </motion.div>
          ) : null;
        })}
      </AnimatePresence>

      {/* Title at top */}
      <motion.div
        className="absolute top-10 left-0 right-0 text-center z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="inline-block bg-card/90 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg">
          <p className="text-sm font-medium text-muted-foreground">Delivering to</p>
          <p className="text-xl font-extrabold text-foreground tracking-tight">Hyderabad Communities</p>
        </div>
      </motion.div>

      {/* Branding overlay */}
      <AnimatePresence>
        {showBranding && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="absolute inset-0 bg-background/40 backdrop-blur-sm" />
            <motion.div
              className="bg-card/95 backdrop-blur-md rounded-3xl px-10 py-8 shadow-elevated text-center relative z-10"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <motion.div
                className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center"
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              >
                <span className="text-2xl">🥚</span>
              </motion.div>
              <motion.h1
                className="text-3xl font-bold text-foreground"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                EggPro
              </motion.h1>
              <motion.p
                className="text-sm text-muted-foreground mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                Farm Fresh • Door Delivered
              </motion.p>
              <motion.div
                className="mt-3 flex items-center justify-center gap-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <span className="text-xs text-primary font-semibold">{communities.length} communities</span>
                <span className="text-xs text-muted-foreground">and growing</span>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip button */}
      <motion.button
        className="absolute bottom-8 right-6 text-sm font-bold underline z-20 bg-card/80 px-3 py-1.5 rounded-full shadow-md text-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        onClick={() => navigate("/auth")}
      >
        Skip →
      </motion.button>
    </div>
  );
};

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

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

// Convert lat/lng to screen coordinates
const latMin = 17.33;
const latMax = 17.38;
const lngMin = 78.365;
const lngMax = 78.41;

function toScreen(lat: number, lng: number, width: number, height: number) {
  const x = ((lng - lngMin) / (lngMax - lngMin)) * width * 0.8 + width * 0.1;
  const y = ((latMax - lat) / (latMax - latMin)) * height * 0.6 + height * 0.15;
  return { x, y };
}

export const MapAnimationPage = () => {
  const navigate = useNavigate();
  const [visiblePins, setVisiblePins] = useState(0);
  const [showBranding, setShowBranding] = useState(false);
  const [showLabel, setShowLabel] = useState(-1);

  useEffect(() => {
    // Drop pins one by one
    const pinTimers: NodeJS.Timeout[] = [];
    communities.forEach((_, i) => {
      pinTimers.push(
        setTimeout(() => {
          setVisiblePins(i + 1);
          setShowLabel(i);
        }, 300 + i * 250)
      );
    });

    // Show branding after all pins
    const brandTimer = setTimeout(() => {
      setShowBranding(true);
    }, 300 + communities.length * 250 + 400);

    // Navigate after animation
    const navTimer = setTimeout(() => {
      navigate("/auth");
    }, 300 + communities.length * 250 + 2500);

    return () => {
      pinTimers.forEach(clearTimeout);
      clearTimeout(brandTimer);
      clearTimeout(navTimer);
    };
  }, [navigate]);

  const w = 390;
  const h = 754;

  return (
    <div className="min-h-[100dvh] w-full bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 relative overflow-hidden">
      {/* Subtle grid lines for map feel */}
      <svg className="absolute inset-0 w-full h-full opacity-10" viewBox={`0 0 ${w} ${h}`}>
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={h * 0.1 + i * (h * 0.1)} x2={w} y2={h * 0.1 + i * (h * 0.1)} stroke="hsl(38 92% 50%)" strokeWidth="0.5" />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <line key={`v${i}`} x1={w * 0.1 + i * (w * 0.15)} y1="0" x2={w * 0.1 + i * (w * 0.15)} y2={h} stroke="hsl(38 92% 50%)" strokeWidth="0.5" />
        ))}
      </svg>

      {/* Road-like curved paths */}
      <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${w} ${h}`}>
        <motion.path
          d={`M ${w * 0.1} ${h * 0.3} Q ${w * 0.5} ${h * 0.2} ${w * 0.9} ${h * 0.4}`}
          fill="none"
          stroke="hsl(38 50% 75%)"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
        <motion.path
          d={`M ${w * 0.15} ${h * 0.6} Q ${w * 0.4} ${h * 0.5} ${w * 0.85} ${h * 0.55}`}
          fill="none"
          stroke="hsl(38 50% 75%)"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut", delay: 0.3 }}
        />
        <motion.path
          d={`M ${w * 0.3} ${h * 0.15} Q ${w * 0.35} ${h * 0.45} ${w * 0.25} ${h * 0.7}`}
          fill="none"
          stroke="hsl(38 50% 75%)"
          strokeWidth="1.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: "easeInOut", delay: 0.5 }}
        />
      </svg>

      {/* Pins */}
      <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${w} ${h}`}>
        {communities.map((c, i) => {
          const pos = toScreen(c.lat, c.lng, w, h);
          if (i >= visiblePins) return null;

          return (
            <g key={c.name}>
              {/* Glow ring */}
              <motion.circle
                cx={pos.x}
                cy={pos.y}
                r="18"
                fill="none"
                stroke="hsl(38 92% 50%)"
                strokeWidth="2"
                initial={{ scale: 0, opacity: 0.8 }}
                animate={{ scale: [0, 1.5, 2], opacity: [0.8, 0.3, 0] }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
              {/* Pin dot */}
              <motion.circle
                cx={pos.x}
                cy={pos.y}
                r="6"
                fill="hsl(24 95% 53%)"
                stroke="white"
                strokeWidth="2"
                initial={{ scale: 0, y: -30 }}
                animate={{ scale: 1, y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 12,
                  delay: 0,
                }}
              />
              {/* Pin shadow */}
              <motion.ellipse
                cx={pos.x}
                cy={pos.y + 10}
                rx="4"
                ry="1.5"
                fill="rgba(0,0,0,0.15)"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
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
          // Only show recent label to avoid clutter
          const isRecent = i === showLabel || i >= visiblePins - 3;

          return isRecent ? (
            <motion.div
              key={`label-${c.name}`}
              className="absolute pointer-events-none"
              style={{
                left: pos.x,
                top: pos.y - 24,
                transform: "translateX(-50%)",
              }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: i === showLabel ? 1 : 0.6, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <span className="text-[8px] font-semibold text-foreground bg-card/90 backdrop-blur-sm px-1.5 py-0.5 rounded-full shadow-sm whitespace-nowrap border border-border/50">
                {c.name}
              </span>
            </motion.div>
          ) : null;
        })}
      </AnimatePresence>

      {/* Title at top */}
      <motion.div
        className="absolute top-12 left-0 right-0 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <p className="text-sm font-medium text-muted-foreground">Delivering to</p>
        <p className="text-lg font-bold text-foreground">Hyderabad Communities</p>
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
            <motion.div
              className="bg-card/95 backdrop-blur-md rounded-3xl px-10 py-8 shadow-elevated text-center"
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
        className="absolute bottom-8 right-6 text-sm text-muted-foreground underline z-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ delay: 1 }}
        onClick={() => navigate("/auth")}
      >
        Skip
      </motion.button>
    </div>
  );
};

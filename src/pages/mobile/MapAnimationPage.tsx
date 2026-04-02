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

const latMin = 17.325;
const latMax = 17.385;
const lngMin = 78.36;
const lngMax = 78.415;

function toScreen(lat: number, lng: number, width: number, height: number) {
  const x = ((lng - lngMin) / (lngMax - lngMin)) * width * 0.85 + width * 0.075;
  const y = ((latMax - lat) / (latMax - latMin)) * height * 0.55 + height * 0.18;
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
    <div className="min-h-[100dvh] w-full relative overflow-hidden" style={{ background: "#e8e4d8" }}>
      {/* Hyderabad-style map background */}
      <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid slice">
        {/* Water bodies */}
        <ellipse cx={w * 0.15} cy={h * 0.45} rx={35} ry={20} fill="#b8d4e3" opacity={0.5} />
        <ellipse cx={w * 0.75} cy={h * 0.3} rx={25} ry={12} fill="#b8d4e3" opacity={0.4} />
        <ellipse cx={w * 0.5} cy={h * 0.7} rx={40} ry={15} fill="#b8d4e3" opacity={0.35} />

        {/* Green patches */}
        <circle cx={w * 0.1} cy={h * 0.25} r={18} fill="#c5ddb8" opacity={0.4} />
        <circle cx={w * 0.85} cy={h * 0.5} r={22} fill="#c5ddb8" opacity={0.35} />
        <circle cx={w * 0.3} cy={h * 0.75} r={15} fill="#c5ddb8" opacity={0.3} />
        <circle cx={w * 0.65} cy={h * 0.15} r={12} fill="#c5ddb8" opacity={0.3} />

        {/* Major roads */}
        <motion.path
          d={`M 0 ${h * 0.35} Q ${w * 0.3} ${h * 0.32} ${w * 0.5} ${h * 0.38} T ${w} ${h * 0.4}`}
          fill="none" stroke="#c8c0a8" strokeWidth="5" opacity={0.7}
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        />
        <motion.path
          d={`M 0 ${h * 0.55} Q ${w * 0.4} ${h * 0.5} ${w * 0.7} ${h * 0.52} T ${w} ${h * 0.58}`}
          fill="none" stroke="#c8c0a8" strokeWidth="4" opacity={0.6}
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: "easeInOut", delay: 0.2 }}
        />
        <motion.path
          d={`M ${w * 0.35} 0 Q ${w * 0.38} ${h * 0.3} ${w * 0.32} ${h * 0.6} T ${w * 0.4} ${h}`}
          fill="none" stroke="#c8c0a8" strokeWidth="4" opacity={0.6}
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: "easeInOut", delay: 0.4 }}
        />
        <motion.path
          d={`M ${w * 0.65} 0 Q ${w * 0.6} ${h * 0.25} ${w * 0.7} ${h * 0.5} T ${w * 0.6} ${h}`}
          fill="none" stroke="#c8c0a8" strokeWidth="3.5" opacity={0.5}
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: "easeInOut", delay: 0.5 }}
        />

        {/* Secondary roads */}
        {[0.2, 0.45, 0.65, 0.8].map((yFrac, i) => (
          <motion.line key={`hr${i}`} x1={0} y1={h * yFrac} x2={w} y2={h * (yFrac + 0.02)}
            stroke="#d4cdb8" strokeWidth="1.5" opacity={0.4}
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
          />
        ))}
        {[0.15, 0.5, 0.8].map((xFrac, i) => (
          <motion.line key={`vr${i}`} x1={w * xFrac} y1={0} x2={w * (xFrac + 0.02)} y2={h}
            stroke="#d4cdb8" strokeWidth="1.5" opacity={0.4}
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, delay: 0.4 + i * 0.1 }}
          />
        ))}

        {/* ORR ring road */}
        <motion.ellipse
          cx={w * 0.48} cy={h * 0.44} rx={w * 0.38} ry={h * 0.22}
          fill="none" stroke="#a8b8c8" strokeWidth="3" strokeDasharray="8 4" opacity={0.5}
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />

        {/* "Hyderabad" label */}
        <motion.text
          x={w * 0.5} y={h * 0.14} textAnchor="middle" fontSize="14" fontWeight="700"
          fill="#8a7e6a" letterSpacing="3" opacity={0.6}
          initial={{ opacity: 0 }} animate={{ opacity: 0.6 }}
          transition={{ delay: 0.5 }}
        >
          HYDERABAD
        </motion.text>
      </svg>

      {/* Pins SVG */}
      <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${w} ${h}`}>
        {communities.map((c, i) => {
          const pos = toScreen(c.lat, c.lng, w, h);
          if (i >= visiblePins) return null;

          return (
            <g key={c.name}>
              {/* Glow ring */}
              <motion.circle
                cx={pos.x} cy={pos.y} r="24"
                fill="none" stroke="hsl(24 95% 53%)" strokeWidth="2.5"
                initial={{ scale: 0, opacity: 0.8 }}
                animate={{ scale: [0, 1.5, 2.2], opacity: [0.8, 0.3, 0] }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
              {/* Pin marker - teardrop shape */}
              <motion.g
                initial={{ scale: 0, y: -40 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 250, damping: 12 }}
              >
                <circle cx={pos.x} cy={pos.y} r="10" fill="hsl(24 95% 53%)" stroke="white" strokeWidth="3" />
                <circle cx={pos.x} cy={pos.y} r="4" fill="white" />
              </motion.g>
              {/* Shadow */}
              <motion.ellipse
                cx={pos.x} cy={pos.y + 14} rx="6" ry="2"
                fill="rgba(0,0,0,0.15)"
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
                top: `${((pos.y - 28) / h) * 100}%`,
                transform: "translateX(-50%)",
              }}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: i === showLabel ? 1 : 0.7, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <span className="text-[11px] font-bold text-foreground bg-card/95 backdrop-blur-sm px-2 py-1 rounded-lg shadow-md whitespace-nowrap border border-border/60" style={{ lineHeight: 1.2 }}>
                {c.name}
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
        <p className="text-sm font-medium text-muted-foreground">Delivering to</p>
        <p className="text-xl font-extrabold text-foreground tracking-tight">Hyderabad Communities</p>
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
        className="absolute bottom-8 right-6 text-sm text-muted-foreground font-semibold underline z-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        transition={{ delay: 1 }}
        onClick={() => navigate("/auth")}
      >
        Skip
      </motion.button>
    </div>
  );
};

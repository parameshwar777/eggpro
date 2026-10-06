import { useState } from "react";
import logoSrc from "@/assets/eggpro-logo-local.jpg";
const logoAsset = { url: logoSrc };

export const BRAND_LOGO_URL = logoAsset.url;

interface Props {
  size?: number;
  className?: string;
}

/** New EggPro circular logo. Kept square so the aspect ratio never distorts. */
export const BrandLogo = ({ size = 64, className = "" }: Props) => (
  <img
    src={logoAsset.url}
    alt="EggPro"
    width={size}
    height={size}
    style={{ width: size, height: size }}
    className={`rounded-full object-cover shadow-md bg-foreground ${className}`}
    loading="eager"
  />
);

/** Branded placeholder used when an admin hasn't uploaded an image. */
export const BrandPlaceholder = ({ className = "", label }: { className?: string; label?: string }) => (
  <div className={`flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-amber-100 to-orange-100 ${className}`}>
    <img src={logoAsset.url} alt="" className="w-14 h-14 rounded-full object-cover opacity-90" />
    {label && <span className="text-xs font-semibold text-amber-800 text-center px-2">{label}</span>}
  </div>
);

/** Image with automatic branded fallback on missing/broken source. */
export const SafeImage = ({ src, alt, className = "", label }: { src: string | null | undefined; alt: string; className?: string; label?: string }) => {
  const [broken, setBroken] = useState(false);
  if (!src || broken) return <BrandPlaceholder className={className} label={label} />;
  return <img src={src} alt={alt} className={`object-cover ${className}`} onError={() => setBroken(true)} loading="lazy" />;
};

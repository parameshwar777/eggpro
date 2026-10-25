import { useState } from "react";

/** Missing or unavailable offer artwork collapses completely to a text-only offer. */
export const OfferImage = ({ src, alt, className = "" }: { src?: string | null; alt: string; className?: string }) => {
  const [failed, setFailed] = useState<string | null>(null);
  if (!src?.trim() || failed === src) return null;
  return <img src={src} alt={alt} className={className} onError={() => setFailed(src)} />;
};
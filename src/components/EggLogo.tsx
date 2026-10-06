import { BrandLogo } from "@/components/BrandLogo";

interface EggLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

/** Legacy wrapper — now renders the new EggPro brand logo everywhere it was used. */
export const EggLogo = ({ size = "md", className = "" }: EggLogoProps) => {
  const px = { sm: 64, md: 96, lg: 128 }[size];
  return <BrandLogo size={px} className={className} />;
};

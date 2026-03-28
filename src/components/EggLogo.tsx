import eggMascot from "@/assets/egg-mascot.png";

interface EggLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const EggLogo = ({ size = "md", className = "" }: EggLogoProps) => {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gradient-to-b from-amber-400 to-orange-500 drop-shadow-lg flex items-center justify-center ${className}`}
    >
      <img
        src={eggMascot}
        alt="EggPro Mascot"
        className="w-[125%] h-[125%] object-cover"
        style={{ objectPosition: "55% 60%" }}
        loading="eager"
        fetchPriority="high"
      />
    </div>
  );
};

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
    <div className={`${sizeClasses[size]} ${className}`}>
      <img
        src={eggMascot}
        alt="EggPro Mascot"
        className="w-full h-full object-contain drop-shadow-lg rounded-[50%_50%_50%_50%/40%_40%_60%_60%]"
        loading="eager"
        fetchPriority="high"
      />
    </div>
  );
};

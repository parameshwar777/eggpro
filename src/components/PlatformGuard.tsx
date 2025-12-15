import { Capacitor } from "@capacitor/core";
import { useEffect, useState } from "react";
import { EggLogo } from "@/components/EggLogo";

interface PlatformGuardProps {
  children: React.ReactNode;
}

export const PlatformGuard = ({ children }: PlatformGuardProps) => {
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    // Allow native platforms (Android/iOS)
    if (Capacitor.isNativePlatform()) {
      setIsAllowed(true);
      return;
    }

    // Check if running in development or preview mode (for testing)
    const isDevelopment = window.location.hostname === "localhost" || 
                          window.location.hostname.includes("lovableproject.com") ||
                          window.location.hostname.includes("lovable.app");
    
    if (isDevelopment) {
      setIsAllowed(true);
      return;
    }

    // Block web access in production
    setIsAllowed(false);
  }, []);

  if (isAllowed === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <EggLogo size="lg" />
        </div>
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <EggLogo size="lg" />
        <h1 className="text-2xl font-bold mt-6 text-foreground">Download Our App</h1>
        <p className="text-muted-foreground mt-2 max-w-sm">
          EggPro is available on mobile devices only. Please download our app from the Play Store or App Store.
        </p>
        <div className="flex flex-col gap-3 mt-6 w-full max-w-xs">
          <a
            href="https://play.google.com/store/apps/details?id=com.eggpro.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-foreground text-background rounded-xl px-6 py-3 font-semibold"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
            </svg>
            Get it on Play Store
          </a>
          <a
            href="https://apps.apple.com/app/eggpro"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-foreground text-background rounded-xl px-6 py-3 font-semibold"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
            </svg>
            Download on App Store
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

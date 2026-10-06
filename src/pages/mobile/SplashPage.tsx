import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { startupProgress } from "@/lib/startupProgress";

export const SplashPage = () => {
  const navigate = useNavigate();
  const [wallpaper, setWallpaper] = useState<string | null>(null);
  const [imageReady, setImageReady] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const fetchWallpaper = async () => {
      try {
        const { data } = await supabase
          .from("admin_settings")
          .select("value")
          .eq("key", "splash_wallpaper")
          .single();
        if (data?.value) {
          // Preload image before displaying to avoid flash
          const img = new Image();
          img.onload = () => {
            setWallpaper(data.value);
            setImageReady(true);
          };
          img.onerror = () => setImageReady(true);
          img.src = data.value;
        } else {
          setImageReady(true);
        }
      } catch (e) {
        console.error("Wallpaper fetch error:", e);
        setImageReady(true);
      }
    };
    fetchWallpaper();
  }, []);

  const alreadyShown = startupProgress.splashComplete;

  useEffect(() => {
    if (alreadyShown) {
      navigate("/welcome", { replace: true });
      return;
    }

    // Visible for 4s, with a slow 1s fade-out at the end
    const fadeTimer = setTimeout(() => setLeaving(true), 3000);
    const navTimer = setTimeout(() => {
      startupProgress.splashComplete = true;
      navigate("/welcome", { replace: true });
    }, 4000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(navTimer);
    };
  }, [navigate, alreadyShown]);

  // Never flash the splash a second time in the same launch
  if (alreadyShown) return null;

  // Show gradient background immediately, then fade in wallpaper when ready
  return (
    <div 
      className="min-h-[100dvh] w-full bg-cover bg-center bg-no-repeat"
      style={{
        background: wallpaper && imageReady 
          ? `url(${wallpaper}) center/cover no-repeat` 
          : 'linear-gradient(135deg, hsl(38 92% 55%) 0%, hsl(24 95% 53%) 100%)',
        opacity: leaving ? 0 : 1,
        transition: 'background 0.6s ease-in, opacity 1s ease-in-out',
      }}
    />
  );
};

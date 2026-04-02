import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const SplashPage = () => {
  const navigate = useNavigate();
  const [wallpaper, setWallpaper] = useState<string | null>(null);
  const [imageReady, setImageReady] = useState(false);

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

  useEffect(() => {
    const checkAuthAndNavigate = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Check if user is a merchant — redirect to merchant portal
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id);
          const userRoles = roles?.map(r => r.role) || [];
          if (userRoles.includes("merchant") && !userRoles.includes("admin")) {
            navigate("/merchant/orders");
            return;
          }

          const { data: profile } = await supabase
            .from("profiles")
            .select("community")
            .eq("id", session.user.id)
            .single();
          
          if (profile?.community) {
            localStorage.setItem("selectedCommunity", profile.community);
            navigate("/home");
          } else {
            navigate("/community");
          }
        } else {
          // Not logged in — show map animation then auth
          navigate("/map-intro");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        navigate("/map-intro");
      }
    };

    const navTimer = setTimeout(checkAuthAndNavigate, 6000);
    const maxTimer = setTimeout(() => navigate("/map-intro"), 12000);
    
    return () => {
      clearTimeout(navTimer);
      clearTimeout(maxTimer);
    };
  }, [navigate]);

  // Show gradient background immediately, then fade in wallpaper when ready
  return (
    <div 
      className="min-h-[100dvh] w-full bg-cover bg-center bg-no-repeat"
      style={{
        background: wallpaper && imageReady 
          ? `url(${wallpaper}) center/cover no-repeat` 
          : 'linear-gradient(135deg, hsl(38 92% 55%) 0%, hsl(24 95% 53%) 100%)',
        transition: 'background 0.3s ease-in',
      }}
    />
  );
};

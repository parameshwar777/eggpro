import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const SplashPage = () => {
  const navigate = useNavigate();
  const [wallpaper, setWallpaper] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWallpaper = async () => {
      try {
        const { data } = await supabase
          .from("admin_settings")
          .select("value")
          .eq("key", "splash_wallpaper")
          .single();
        if (data?.value) setWallpaper(data.value);
      } catch (e) {
        console.error("Wallpaper fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchWallpaper();
  }, []);

  useEffect(() => {
    const checkAuthAndNavigate = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
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
          navigate("/auth");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        navigate("/auth");
      }
    };

    // Use a timeout but also a max timeout to prevent stuck screen
    const navTimer = setTimeout(checkAuthAndNavigate, 2500);
    const maxTimer = setTimeout(() => navigate("/auth"), 8000);
    
    return () => {
      clearTimeout(navTimer);
      clearTimeout(maxTimer);
    };
  }, [navigate]);

  return (
    <div 
      className="min-h-[100dvh] w-full bg-cover bg-center bg-no-repeat flex items-center justify-center"
      style={wallpaper ? { backgroundImage: `url(${wallpaper})` } : { backgroundColor: '#F59E0B' }}
    >
      {!wallpaper && !loading && (
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white">🥚 EggPro</h1>
          <div className="mt-4 flex gap-1 justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}
    </div>
  );
};

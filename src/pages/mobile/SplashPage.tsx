import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import landingImage from "@/assets/landing_page.png";

export const SplashPage = () => {
  const navigate = useNavigate();

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

    const navTimer = setTimeout(checkAuthAndNavigate, 2500);
    
    return () => {
      clearTimeout(navTimer);
    };
  }, [navigate]);

  return (
    <div 
      className="min-h-[100dvh] w-full bg-cover bg-center bg-no-repeat flex items-center justify-center"
      style={{ backgroundImage: `url(${landingImage})` }}
    >
      {/* The background image contains the branding and loading dots */}
    </div>
  );
};

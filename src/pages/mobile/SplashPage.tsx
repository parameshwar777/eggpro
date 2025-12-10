import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { EggLogo } from "@/components/EggLogo";
import { supabase } from "@/integrations/supabase/client";

export const SplashPage = () => {
  const navigate = useNavigate();
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    const textTimer = setTimeout(() => setShowText(true), 800);
    
    // Fallback timeout - navigate to auth if nothing happens in 5 seconds
    const fallbackTimer = setTimeout(() => {
      console.log("Fallback navigation to auth");
      navigate("/auth");
    }, 5000);
    
    const checkAuthAndNavigate = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        clearTimeout(fallbackTimer);
        
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
        clearTimeout(fallbackTimer);
        navigate("/auth");
      }
    };

    const navTimer = setTimeout(checkAuthAndNavigate, 2500);
    
    return () => {
      clearTimeout(textTimer);
      clearTimeout(navTimer);
      clearTimeout(fallbackTimer);
    };
  }, [navigate]);

  return (
    <div className="min-h-[100dvh] gradient-hero flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background decorations */}
      <motion.div
        className="absolute inset-0 opacity-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        transition={{ duration: 1 }}
      >
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute bottom-32 right-10 w-40 h-40 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute top-1/3 right-20 w-24 h-24 rounded-full bg-white/10 blur-2xl" />
      </motion.div>

      {/* Logo animation */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 200, 
          damping: 15,
          duration: 0.8 
        }}
        className="relative z-10"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ 
            repeat: Infinity, 
            duration: 2, 
            ease: "easeInOut" 
          }}
        >
          <EggLogo size="lg" className="w-32 h-32" />
        </motion.div>
      </motion.div>

      {/* Brand name */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: showText ? 1 : 0, y: showText ? 0 : 30 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mt-8 text-center z-10"
      >
        <h1 className="text-4xl font-bold text-white tracking-tight">
          EggPro
        </h1>
        <p className="text-white/80 mt-2 text-lg">
          Fresh Eggs, Delivered Daily
        </p>
      </motion.div>

      {/* Loading dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showText ? 1 : 0 }}
        className="flex gap-2 mt-12 z-10"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-3 h-3 rounded-full bg-white/80"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
            transition={{
              repeat: Infinity,
              duration: 1,
              delay: i * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}
      </motion.div>
    </div>
  );
};

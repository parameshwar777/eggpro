import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ChevronDown, Check, Navigation, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import eggMascot from "@/assets/egg-mascot.png";

interface Community {
  id: string;
  name: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
}

const features = [
  { icon: "🌾", label: "Farm Fresh" },
  { icon: "🏠", label: "Home Delivery" },
  { icon: "✅", label: "FSSAI Certified" },
];

export const CommunitySelectPage = () => {
  const navigate = useNavigate();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [filteredCommunities, setFilteredCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  useEffect(() => {
    fetchCommunities();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      setFilteredCommunities(communities.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    } else {
      setFilteredCommunities(communities);
    }
  }, [searchQuery, communities]);

  const fetchCommunities = async () => {
    const { data } = await supabase
      .from("communities")
      .select("*")
      .eq("is_active", true)
      .order("name");
    setCommunities(data || []);
    setFilteredCommunities(data || []);
  };

  const handleContinue = () => {
    if (selectedCommunity) {
      setShowSuccess(true);
      setTimeout(() => {
        localStorage.setItem("selectedCommunity", selectedCommunity);
        navigate("/home");
      }, 2000);
    }
  };

  const handleNotListed = () => {
    setShowMapPicker(true);
  };

  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setIsLoadingLocation(false);
          // Check if location matches any community
          checkNearestCommunity(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error("Location error:", error);
          setIsLoadingLocation(false);
          setShowComingSoon(true);
        }
      );
    } else {
      setIsLoadingLocation(false);
      setShowComingSoon(true);
    }
  };

  const checkNearestCommunity = (lat: number, lng: number) => {
    // Find nearest community within radius
    const nearestCommunity = communities.find(c => {
      if (!c.latitude || !c.longitude) return false;
      const distance = getDistance(lat, lng, c.latitude, c.longitude);
      return distance <= 3; // 3km radius
    });

    if (nearestCommunity) {
      setSelectedCommunity(nearestCommunity.name);
      setShowMapPicker(false);
      setShowSuccess(true);
      setTimeout(() => {
        localStorage.setItem("selectedCommunity", nearestCommunity.name);
        navigate("/home");
      }, 2000);
    } else {
      setShowMapPicker(false);
      setShowComingSoon(true);
    }
  };

  const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  if (showMapPicker) {
    return (
      <div className="min-h-[100dvh] bg-slate-100 flex flex-col items-center justify-center p-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-white rounded-2xl p-8 shadow-lg w-full max-w-sm text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Navigation className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2">Find Your Location</h2>
          <p className="text-muted-foreground text-sm mb-6">We'll check if we deliver to your area</p>
          
          <Button onClick={getCurrentLocation} disabled={isLoadingLocation} className="w-full h-12 mb-4">
            {isLoadingLocation ? (
              <><div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" /> Getting Location...</>
            ) : (
              <><Navigation className="w-5 h-5 mr-2" /> Use Current Location</>
            )}
          </Button>
          
          <button onClick={() => setShowMapPicker(false)} className="text-muted-foreground text-sm">
            Go back to community list
          </button>
        </motion.div>
      </div>
    );
  }

  if (showComingSoon) {
    return (
      <div className="min-h-[100dvh] bg-amber-50 flex flex-col items-center justify-center p-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-6xl mb-6">🚀</motion.div>
        <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-2xl font-bold text-foreground mb-2 text-center">Coming Soon!</motion.h1>
        <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-muted-foreground text-center mb-6">
          We're expanding to your area soon. We'll notify you when we start delivering to your community!
        </motion.p>
        <Button variant="outline" onClick={() => { setShowComingSoon(false); setShowMapPicker(false); }}>Go Back</Button>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-[100dvh] bg-green-50 flex flex-col items-center justify-center p-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <Check className="w-12 h-12 text-green-600" />
        </motion.div>
        <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-2xl font-bold text-foreground mb-2">Great News!</motion.h1>
        <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-muted-foreground mb-2">We deliver to</motion.p>
        <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-xl font-bold text-primary mb-6">{selectedCommunity}</motion.p>
        <div className="flex gap-6 text-center">
          {[{ icon: "🕐", label: "6-9 AM" }, { icon: "🚚", label: "Free Delivery" }, { icon: "🛡️", label: "FSSAI Certified" }].map((item, i) => (
            <motion.div key={item.label} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 + i * 0.1 }} className="flex flex-col items-center gap-1">
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </motion.div>
          ))}
        </div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-6 text-sm text-muted-foreground flex items-center gap-2">
          <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>⏳</motion.span>
          Redirecting to shop...
        </motion.p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-amber-50 flex flex-col">
      <div className="max-w-lg mx-auto w-full flex-1 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12">
          <motion.img initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }} src={eggMascot} alt="Nutri Eggs" className="w-20 h-20 mb-4" />
          <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-3xl font-bold text-foreground mb-1">Nutri Eggs</motion.h1>
          <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-primary font-medium mb-8">Nature's Immunity Boosters</motion.p>
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex gap-4">
            {features.map((feature, i) => (
              <motion.div key={feature.label} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + i * 0.1 }} className="flex flex-col items-center gap-2 bg-card p-4 rounded-2xl shadow-sm min-w-[90px]">
                <span className="text-2xl">{feature.icon}</span>
                <span className="text-xs text-foreground font-medium">{feature.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="bg-card rounded-t-[2rem] p-6 shadow-elevated">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-xl"><MapPin className="w-6 h-6 text-primary" /></div>
            <div>
              <h2 className="font-bold text-foreground text-lg">Select Your Community</h2>
              <p className="text-sm text-muted-foreground">Choose your gated community</p>
            </div>
          </div>

          <div className="relative mb-4">
            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full p-4 border-2 border-border rounded-xl flex items-center justify-between bg-background">
              <span className={selectedCommunity ? "text-foreground" : "text-muted-foreground"}>{selectedCommunity || "Select your community"}</span>
              <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 max-h-64 overflow-hidden">
                  <div className="p-2 border-b sticky top-0 bg-card">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input placeholder="Search community..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-10" />
                    </div>
                  </div>
                  <div className="overflow-y-auto max-h-48">
                    {filteredCommunities.length === 0 ? (
                      <p className="p-4 text-center text-muted-foreground text-sm">No communities found</p>
                    ) : (
                      filteredCommunities.map((community) => (
                        <button key={community.id} onClick={() => { setSelectedCommunity(community.name); setIsDropdownOpen(false); setSearchQuery(""); }} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left border-b border-border last:border-0">
                          <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="text-foreground text-sm">{community.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Button onClick={handleContinue} disabled={!selectedCommunity} className="w-full h-14 text-lg rounded-xl mb-4">Continue</Button>
          <button onClick={handleNotListed} className="w-full text-center text-primary font-medium py-2">My community is not listed</button>
        </motion.div>
      </div>
    </div>
  );
};
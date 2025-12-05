import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ChevronDown, Leaf, Truck, Shield, Check, Navigation } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import eggMascot from "@/assets/egg-mascot.png";

const communities = [
  "Maple Town Villas",
  "Dream Homes Gated Community",
  "Libdom Villas",
  "RV Somwrita, Luxury Villas in Kismatpur",
  "INFOCITY GREENWOODS VILLA",
  "Giridhari Executive Park",
  "Vasati Anandi",
  "Prestige Royal Woods",
  "SMR Vinay Boulder Woods",
  "INDIS PBEL City",
  "Vaishnavi Houdini",
  "SMR Vinay Harmony County",
];

const features = [
  { icon: "🌾", label: "Farm Fresh" },
  { icon: "🏠", label: "Home Delivery" },
  { icon: "✅", label: "FSSAI Certified" },
];

export const CommunitySelectPage = () => {
  const navigate = useNavigate();
  const [selectedCommunity, setSelectedCommunity] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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
    setShowComingSoon(true);
  };

  if (showComingSoon) {
    return (
      <div className="min-h-[100dvh] bg-amber-50 flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-6xl mb-6"
        >
          🚀
        </motion.div>
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-2xl font-bold text-foreground mb-2 text-center"
        >
          Coming Soon!
        </motion.h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground text-center mb-6"
        >
          We're expanding to your area soon. We'll notify you when we start delivering to your community!
        </motion.p>
        <Button variant="outline" onClick={() => setShowComingSoon(false)}>
          Go Back
        </Button>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-[100dvh] bg-green-50 flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6"
        >
          <Check className="w-12 h-12 text-green-600" />
        </motion.div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
          className="absolute top-1/3 right-1/4"
        >
          🎉
        </motion.div>
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-2xl font-bold text-foreground mb-2"
        >
          Great News!
        </motion.h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground mb-2"
        >
          We deliver to
        </motion.p>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xl font-bold text-primary mb-6"
        >
          {selectedCommunity}
        </motion.p>
        <div className="flex gap-6 text-center">
          {[
            { icon: "🕐", label: "6-9 AM" },
            { icon: "🚚", label: "Free Delivery" },
            { icon: "🛡️", label: "FSSAI Certified" },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex flex-col items-center gap-1"
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </motion.div>
          ))}
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-sm text-muted-foreground flex items-center gap-2"
        >
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          >
            ⏳
          </motion.span>
          Redirecting to shop...
        </motion.p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-amber-50 flex flex-col">
      <div className="max-w-lg mx-auto w-full flex-1 flex flex-col">
        {/* Top Section */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12">
          <motion.img
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            src={eggMascot}
            alt="Nutri Eggs"
            className="w-20 h-20 mb-4"
          />
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl font-bold text-foreground mb-1"
          >
            Nutri Eggs
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-primary font-medium mb-8"
          >
            Nature's Immunity Boosters
          </motion.p>

          {/* Features */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex gap-4"
          >
            {features.map((feature, i) => (
              <motion.div
                key={feature.label}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex flex-col items-center gap-2 bg-card p-4 rounded-2xl shadow-sm min-w-[90px]"
              >
                <span className="text-2xl">{feature.icon}</span>
                <span className="text-xs text-foreground font-medium">{feature.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Bottom Card */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-t-[2rem] p-6 shadow-elevated"
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-foreground text-lg">Select Your Community</h2>
              <p className="text-sm text-muted-foreground">Choose your gated community</p>
            </div>
          </div>

          {/* Dropdown */}
          <div className="relative mb-4">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full p-4 border-2 border-border rounded-xl flex items-center justify-between bg-background"
            >
              <span className={selectedCommunity ? "text-foreground" : "text-muted-foreground"}>
                {selectedCommunity || "Select your community"}
              </span>
              <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto"
                >
                  {communities.map((community) => (
                    <button
                      key={community}
                      onClick={() => {
                        setSelectedCommunity(community);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left border-b border-border last:border-0"
                    >
                      <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-foreground text-sm">{community}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Continue Button */}
          <Button
            onClick={handleContinue}
            disabled={!selectedCommunity}
            className="w-full h-14 text-lg rounded-xl mb-4"
          >
            Continue
          </Button>

          {/* Not Listed Link */}
          <button
            onClick={handleNotListed}
            className="w-full text-center text-primary font-medium py-2"
          >
            My community is not listed
          </button>
        </motion.div>
      </div>
    </div>
  );
};

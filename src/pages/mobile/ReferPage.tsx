import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Gift, Copy, Share2, Users } from "lucide-react";
import { MobileLayout } from "@/components/mobile/MobileLayout";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const steps = [
  {
    num: 1,
    title: "Share your code",
    desc: "Send your unique referral code to friends and family",
  },
  {
    num: 2,
    title: "They get ₹40 off",
    desc: "Your friend gets ₹40 discount on their first order",
  },
  {
    num: 3,
    title: "You earn ₹20",
    desc: "When their order is delivered, you get ₹20 in your wallet",
  },
];

export const ReferPage = () => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState("Loading...");
  const [referralCount, setReferralCount] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);

  useEffect(() => {
    if (user) {
      fetchReferralData();
    }
  }, [user]);

  const fetchReferralData = async () => {
    if (!user) return;

    // Fetch user's referral code from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("referral_code")
      .eq("id", user.id)
      .single();

    if (profile?.referral_code) {
      setReferralCode(profile.referral_code);
    } else {
      // Generate one if not exists
      const code = "EGG" + Math.random().toString(36).substring(2, 8).toUpperCase();
      await supabase.from("profiles").update({ referral_code: code }).eq("id", user.id);
      setReferralCode(code);
    }

    // Fetch referral stats
    const { data: referrals } = await supabase
      .from("referrals")
      .select("*")
      .eq("referrer_id", user.id);

    if (referrals) {
      setReferralCount(referrals.length);
      const completed = referrals.filter(r => r.status === "completed");
      setTotalEarned(completed.length * 20);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast({ title: "Code copied!", description: "Share it with your friends" });
  };

  const shareCode = async () => {
    const shareData = {
      title: "Join EggPro!",
      text: `Use my referral code ${referralCode} to get ₹40 off on your first order at EggPro!`,
      url: "https://eggpro.lovable.app"
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        copyCode();
      }
    } else {
      copyCode();
    }
  };

  return (
    <MobileLayout>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="gradient-warm px-4 pt-6 pb-12 rounded-b-3xl"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="flex items-center gap-3"
        >
          <div className="p-3 bg-card/20 rounded-2xl backdrop-blur-sm">
            <Gift className="w-7 h-7 text-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Refer & Earn</h1>
            <p className="text-foreground/70 text-sm">Share the love, earn rewards</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Referral Code Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mx-4 -mt-5 bg-primary rounded-2xl p-5 shadow-elevated"
      >
        <p className="text-primary-foreground/80 text-sm">Your Referral Code</p>
        <div className="flex items-center justify-between mt-2">
          <motion.h2
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-2xl font-bold text-primary-foreground tracking-wider"
          >
            {referralCode}
          </motion.h2>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={copyCode}
            className="p-2.5 bg-card/20 rounded-lg"
          >
            <Copy className="w-5 h-5 text-primary-foreground" />
          </motion.button>
        </div>
        <Button
          variant="secondary"
          className="w-full mt-4 bg-card text-foreground hover:bg-card/90"
          onClick={shareCode}
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share Code
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mx-4 mt-4 grid grid-cols-2 gap-4"
      >
        <div className="bg-card rounded-2xl p-4 shadow-card flex items-center gap-3">
          <div className="p-2.5 bg-secondary rounded-xl flex-shrink-0">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">{referralCount}</p>
            <p className="text-xs text-muted-foreground">Referrals</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-card flex items-center gap-3">
          <div className="p-2.5 bg-secondary rounded-xl flex-shrink-0">
            <Gift className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">₹{totalEarned}</p>
            <p className="text-xs text-muted-foreground">Earned</p>
          </div>
        </div>
      </motion.div>

      {/* How it Works */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mx-4 my-4 bg-card rounded-2xl p-5 shadow-card"
      >
        <h3 className="font-semibold text-foreground mb-4">How it Works</h3>
        <div className="space-y-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="flex gap-4"
            >
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary-foreground">
                  {step.num}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground text-sm">{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </MobileLayout>
  );
};

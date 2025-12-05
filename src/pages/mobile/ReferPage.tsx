import { motion } from "framer-motion";
import { Gift, Copy, Share2, Users } from "lucide-react";
import { MobileLayout } from "@/components/mobile/MobileLayout";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

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
  const referralCode = "EGGPRO20";

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast({ title: "Code copied!", description: "Share it with your friends" });
  };

  return (
    <MobileLayout>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="gradient-warm px-4 pt-6 pb-10 rounded-b-[2rem]"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="flex items-center gap-3"
        >
          <div className="p-2.5 sm:p-3 bg-card/20 rounded-2xl backdrop-blur-sm">
            <Gift className="w-6 h-6 sm:w-8 sm:h-8 text-foreground" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Refer & Earn</h1>
            <p className="text-foreground/70 text-sm">Share the love, earn rewards</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Referral Code Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mx-4 -mt-5 bg-primary rounded-2xl p-4 sm:p-6 shadow-elevated"
      >
        <p className="text-primary-foreground/80 text-xs sm:text-sm">Your Referral Code</p>
        <div className="flex items-center justify-between mt-2">
          <motion.h2
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-2xl sm:text-3xl font-bold text-primary-foreground tracking-wider"
          >
            {referralCode}
          </motion.h2>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={copyCode}
            className="p-2 bg-card/20 rounded-lg"
          >
            <Copy className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
          </motion.button>
        </div>
        <Button
          variant="secondary"
          className="w-full mt-4 bg-card text-foreground hover:bg-card/90"
          onClick={copyCode}
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
        className="mx-4 mt-4 grid grid-cols-2 gap-3 sm:gap-4"
      >
        <div className="bg-card rounded-2xl p-3 sm:p-4 shadow-card flex items-center gap-2.5 sm:gap-3">
          <div className="p-2 bg-secondary rounded-xl flex-shrink-0">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold text-foreground">0</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Referrals</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-3 sm:p-4 shadow-card flex items-center gap-2.5 sm:gap-3">
          <div className="p-2 bg-secondary rounded-xl flex-shrink-0">
            <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold text-foreground">₹0</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Earned</p>
          </div>
        </div>
      </motion.div>

      {/* How it Works */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mx-4 mt-4 sm:mt-6 bg-card rounded-2xl p-4 sm:p-6 shadow-card"
      >
        <h3 className="font-semibold text-foreground mb-4 text-sm sm:text-base">How it Works</h3>
        <div className="space-y-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="flex gap-3 sm:gap-4"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-xs sm:text-sm font-bold text-primary-foreground">
                  {step.num}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground text-sm sm:text-base">{step.title}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </MobileLayout>
  );
};

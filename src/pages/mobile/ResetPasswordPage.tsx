import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { EggLogo } from "@/components/EggLogo";
import { supabase } from "@/integrations/supabase/client";

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    // Supabase recovery flow puts an access_token in the URL hash; getSession picks it up.
    const sub = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setHasSession(!!session);
    });
    supabase.auth.getSession().then(({ data }) => setHasSession(!!data.session));
    return () => sub.data.subscription.unsubscribe();
  }, []);

  const handleReset = async () => {
    if (password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Error", description: "Passwords don't match", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: "Password updated", description: "You can now sign in with your new password." });
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-scroll bg-background flex flex-col">
      <div className="gradient-hero p-4 pt-12 pb-8 rounded-b-3xl safe-top">
        <div className="flex justify-center mb-4">
          <EggLogo size="lg" className="animate-none [&_img]:loading-eager [&_img]:scale-125" />
        </div>
        <h1 className="text-2xl font-bold text-white text-center">Set New Password</h1>
        <p className="text-white/90 text-center mt-1 text-base font-medium">
          Create a new password for your account
        </p>
      </div>

      <div className="flex-1 p-6 -mt-4">
        <motion.div className="bg-card rounded-2xl shadow-card p-6 space-y-4"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {!hasSession ? (
            <p className="text-sm text-muted-foreground text-center">
              This page must be opened from the password reset link in your email.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-base font-semibold">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input type={show ? "text" : "password"} placeholder="Min 6 chars" value={password}
                    onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 h-12" />
                  <button type="button" onClick={() => setShow(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-base font-semibold">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input type={show ? "text" : "password"} placeholder="Re-enter password" value={confirm}
                    onChange={(e) => setConfirm(e.target.value)} className="pl-10 h-12" />
                </div>
              </div>
              <Button className="w-full h-12 gradient-hero text-white font-semibold"
                onClick={handleReset} disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

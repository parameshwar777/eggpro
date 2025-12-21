import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { EggLogo } from "@/components/EggLogo";
import { supabase } from "@/integrations/supabase/client";
import { Capacitor } from "@capacitor/core";

type AuthMode = "login" | "signup" | "forgot" | "verify-otp";

export const AuthPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signInWithEmail, signInWithGoogle, user } = useAuth();

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  // Get password from sessionStorage (set during signup) - this should always exist when in verify-otp mode
  // since we set it in handleSendOTP before navigating to verify-otp
  const getStoredPassword = () => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("signup_password");
    }
    return null;
  };
  
  // The password should be available from sessionStorage when in verify-otp mode
  // Only show password field if sessionStorage somehow lost the value (e.g., page refresh)
  const storedPasswordExists = mode === "verify-otp" ? !!getStoredPassword() : true;
  const effectivePassword = getStoredPassword() || password;

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const checkCommunity = async () => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("community")
          .eq("id", user.id)
          .single();
        
        if (profile?.community) {
          localStorage.setItem("selectedCommunity", profile.community);
          navigate("/home", { replace: true });
        } else {
          navigate("/community", { replace: true });
        }
      };
      checkCommunity();
    }
  }, [user, navigate]);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleSendOTP = async () => {
    if (!email || !password || !fullName) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      // Store password temporarily in sessionStorage for verification step
      sessionStorage.setItem("signup_password", password);
      sessionStorage.setItem("signup_fullname", fullName);
      
      // Use custom edge function to send a real 6-digit OTP email
      const response = await supabase.functions.invoke("email-otp", {
        body: { action: "send", email: email.toLowerCase().trim() }
      });

      if (response.error) throw new Error(response.error.message);
      if (!response.data?.success) throw new Error(response.data?.error || "Failed to send OTP");

      toast({ title: "OTP Sent!", description: "Check your email for the 6-digit verification code." });
      setMode("verify-otp");
      setResendTimer(60);
    } catch (error: any) {
      console.error("Send OTP error:", error);
      toast({ title: "Error", description: error.message || "Could not send OTP. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast({ title: "Error", description: "Please enter the complete 6-digit OTP", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      // Use effectivePassword (from sessionStorage or current password state)
      const verifyPassword = getStoredPassword() || password;
      const storedFullName =
        (typeof window !== "undefined"
          ? sessionStorage.getItem("signup_fullname")
          : null) || fullName;

      if (!verifyPassword || verifyPassword.length < 6) {
        toast({
          title: "Error",
          description: "Password must be at least 6 characters",
          variant: "destructive",
        });
        return;
      }

      // Verify OTP using custom edge function (creates user if valid)
      const response = await supabase.functions.invoke("email-otp", {
        body: {
          action: "verify",
          email: email.toLowerCase().trim(),
          otp,
          password: verifyPassword,
          fullName: storedFullName,
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (!response.data?.success) throw new Error(response.data?.error || "Verification failed");

      // Clear stored signup data
      sessionStorage.removeItem("signup_password");
      sessionStorage.removeItem("signup_fullname");

      // Handle referral code if provided
      if (referralCode && response.data?.userId) {
        const { data: referrer } = await supabase
          .from("profiles")
          .select("id")
          .eq("referral_code", referralCode.toUpperCase())
          .single();
        
        if (referrer) {
          await supabase.from("referrals").insert({
            referrer_id: referrer.id,
            referred_id: response.data.userId,
            referral_code: referralCode.toUpperCase(),
            status: "pending"
          });
        }
      }

      toast({ title: "Account Created!", description: "Signing you in..." });
      
      // Sign in the user
      const { error: signInError } = await signInWithEmail(email.toLowerCase().trim(), verifyPassword);
      if (signInError) throw signInError;
      
      navigate("/community");
    } catch (error: any) {
      console.error("Verify OTP error:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    
    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke("email-otp", {
        body: { action: "send", email: email.toLowerCase().trim() }
      });

      if (response.error) throw new Error(response.error.message);
      if (!response.data?.success) throw new Error(response.data?.error || "Failed to resend OTP");

      toast({ title: "OTP Resent!", description: "Check your email for the new code." });
      setResendTimer(60);
      setOtp("");
    } catch (error: any) {
      console.error("Resend OTP error:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (mode === "signup") {
      await handleSendOTP();
      return;
    }

    // Login flow
    if (!email || !password) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signInWithEmail(email, password);
      if (error) throw error;
      toast({ title: "Welcome back!", description: "You've successfully signed in." });
      
      // Check if user has community set
      const { data: profile } = await supabase
        .from("profiles")
        .select("community")
        .eq("id", (await supabase.auth.getUser()).data.user?.id)
        .single();
      
      if (profile?.community) {
        localStorage.setItem("selectedCommunity", profile.community);
        navigate("/home");
      } else {
        navigate("/community");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({ title: "Error", description: "Please enter your email", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });
      if (error) throw error;
      toast({ title: "Email Sent!", description: "Check your email for password reset link." });
      setMode("login");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        console.error("Google Sign-In error:", error);
        throw error;
      }
      // On native, the auth state change will handle navigation
      if (!Capacitor.isNativePlatform()) {
        // Web will redirect, so don't do anything
      }
    } catch (error: any) {
      console.error("Google auth failed:", error);
      toast({ 
        title: "Google Sign-In Failed", 
        description: error.message || "Something went wrong. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Header */}
      <div className="gradient-hero p-4 pt-12 pb-8 rounded-b-3xl">
        <button 
          onClick={() => {
            if (mode === "verify-otp") {
              setMode("signup");
              setOtp("");
            } else {
              navigate(-1);
            }
          }} 
          className="text-white mb-4"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex justify-center mb-4">
          <EggLogo size="lg" />
        </div>
        <h1 className="text-2xl font-bold text-white text-center">
          {mode === "login" ? "Welcome Back" : 
           mode === "signup" ? "Create Account" : 
           mode === "verify-otp" ? "Verify Email" :
           "Reset Password"}
        </h1>
        <p className="text-white/90 text-center mt-1 text-base font-medium">
          {mode === "login" ? "Sign in to continue" : 
           mode === "signup" ? "Join EggPro today" : 
           mode === "verify-otp" ? `Enter the code sent to ${email}` :
           "We'll send you a reset link"}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 -mt-4">
        <motion.div 
          className="bg-card rounded-2xl shadow-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AnimatePresence mode="wait">
            {mode === "verify-otp" && (
              <motion.div
                key="otp-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(value) => setOtp(value)}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {!storedPasswordExists && (
                  <div className="space-y-2">
                    <label className="text-base font-semibold">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 h-12 text-base"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">Required to create your account</p>
                  </div>
                )}

                <Button
                  className="w-full h-12 gradient-hero text-white font-semibold text-base"
                  onClick={handleVerifyOTP}
                  disabled={
                    isLoading ||
                    otp.length !== 6 ||
                    !effectivePassword ||
                    effectivePassword.length < 6
                  }
                >
                  {isLoading ? "Verifying..." : "Verify & Create Account"}
                </Button>

                <p className="text-center text-base text-muted-foreground">
                  Didn't receive the code?{" "}
                  <button
                    onClick={handleResendOTP}
                    disabled={resendTimer > 0 || isLoading}
                    className={`font-bold ${resendTimer > 0 ? 'text-muted-foreground' : 'text-primary'}`}
                  >
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
                  </button>
                </p>
              </motion.div>
            )}

            {(mode === "login" || mode === "signup") && (
              <motion.div
                key="email-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {/* Google Button */}
                <Button
                  variant="outline"
                  className="w-full h-12 font-semibold text-base"
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-3 text-muted-foreground">or</span>
                  </div>
                </div>

                {mode === "signup" && (
                  <>
                    <div className="space-y-2">
                      <label className="text-base font-semibold">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Your name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-base font-semibold">Referral Code (Optional)</label>
                      <Input
                        type="text"
                        placeholder="Enter referral code"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <label className="text-base font-semibold">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-base font-semibold">Password</label>
                    {mode === "login" && (
                      <button onClick={() => setMode("forgot")} className="text-xs text-primary">
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {mode === "signup" && (
                    <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
                  )}
                </div>

                <Button
                  className="w-full h-12 gradient-hero text-white font-semibold text-base"
                  onClick={handleEmailAuth}
                  disabled={isLoading}
                >
                  {isLoading ? "Please wait..." : mode === "login" ? "Sign In" : "Continue"}
                </Button>

                <p className="text-center text-base font-medium text-muted-foreground">
                  {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                  <button
                    onClick={() => setMode(mode === "login" ? "signup" : "login")}
                    className="text-primary font-bold"
                  >
                    {mode === "login" ? "Sign Up" : "Sign In"}
                  </button>
                </p>
              </motion.div>
            )}

            {mode === "forgot" && (
              <motion.div
                key="forgot-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-base font-semibold">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 text-base"
                    />
                  </div>
                </div>

                <Button
                  className="w-full h-12 gradient-hero text-white font-semibold text-base"
                  onClick={handleForgotPassword}
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>

                <button
                  onClick={() => setMode("login")}
                  className="w-full text-center text-base font-medium text-primary"
                >
                  Back to login
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

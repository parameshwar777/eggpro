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


type AuthMode = "login" | "signup" | "forgot" | "verify-otp" | "reset-otp";

export const AuthPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signInWithEmail, user } = useAuth();

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [newPassword, setNewPassword] = useState("");

  // Persist signup draft so OTP verification never loses the password on Android (release builds can reclaim memory)
  const getStoredPassword = () => {
    if (typeof window === "undefined") return null;
    return (
      sessionStorage.getItem("signup_password") ||
      localStorage.getItem("signup_password")
    );
  };

  const getStoredFullName = () => {
    if (typeof window === "undefined") return null;
    return (
      sessionStorage.getItem("signup_fullname") ||
      localStorage.getItem("signup_fullname")
    );
  };

  const storedPasswordExists = mode === "verify-otp" ? !!getStoredPassword() : true;
  const effectivePassword = getStoredPassword() || password;

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const checkRoleAndRedirect = async () => {
        // Check if user is a merchant
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);
        const userRoles = roles?.map(r => r.role) || [];
        if (userRoles.includes("merchant") && !userRoles.includes("admin")) {
          navigate("/merchant/orders", { replace: true });
          return;
        }

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
      checkRoleAndRedirect();
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
      // Store signup draft for the verification step (use both storages for reliability)
      sessionStorage.setItem("signup_password", password);
      localStorage.setItem("signup_password", password);
      sessionStorage.setItem("signup_fullname", fullName);
      localStorage.setItem("signup_fullname", fullName);
      
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
      const verifyPassword = getStoredPassword() || password;
      const storedFullName = getStoredFullName() || fullName;

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
      localStorage.removeItem("signup_password");
      sessionStorage.removeItem("signup_fullname");
      localStorage.removeItem("signup_fullname");

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
      
      const currentUser = (await supabase.auth.getUser()).data.user;
      if (!currentUser) throw new Error("Login failed");

      // Check if merchant
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", currentUser.id);
      const userRoles = roles?.map(r => r.role) || [];
      if (userRoles.includes("merchant") && !userRoles.includes("admin")) {
        navigate("/merchant/orders");
        return;
      }

      // Check if user has community set
      const { data: profile } = await supabase
        .from("profiles")
        .select("community")
        .eq("id", currentUser.id)
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
      const response = await supabase.functions.invoke("email-otp", {
        body: { action: "reset-send", email: email.toLowerCase().trim() }
      });

      if (response.error) throw new Error(response.error.message);
      if (!response.data?.success) throw new Error(response.data?.error || "Failed to send OTP");

      toast({ title: "OTP Sent!", description: "Check your email for the 6-digit code to reset your password." });
      setMode("reset-otp");
      setResendTimer(60);
      setOtp("");
      setNewPassword("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (otp.length !== 6) {
      toast({ title: "Error", description: "Please enter the complete 6-digit OTP", variant: "destructive" });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke("email-otp", {
        body: {
          action: "reset-verify",
          email: email.toLowerCase().trim(),
          otp,
          newPassword
        }
      });

      if (response.error) throw new Error(response.error.message);
      if (!response.data?.success) throw new Error(response.data?.error || "Password reset failed");

      toast({ title: "Password Reset!", description: "You can now sign in with your new password." });
      setMode("login");
      setOtp("");
      setNewPassword("");
      setPassword("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendResetOTP = async () => {
    if (resendTimer > 0) return;
    
    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke("email-otp", {
        body: { action: "reset-send", email: email.toLowerCase().trim() }
      });

      if (response.error) throw new Error(response.error.message);
      if (!response.data?.success) throw new Error(response.data?.error || "Failed to resend OTP");

      toast({ title: "OTP Resent!", description: "Check your email for the new code." });
      setResendTimer(60);
      setOtp("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Header */}
      <div className="gradient-hero p-4 pt-12 pb-8 rounded-b-3xl safe-top">
        <button 
          onClick={() => {
            if (mode === "verify-otp") {
              setMode("signup");
              setOtp("");
            } else if (mode === "reset-otp") {
              setMode("forgot");
              setOtp("");
              setNewPassword("");
            } else {
              navigate(-1);
            }
          }} 
          className="text-white mb-4"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex justify-center mb-4">
          <EggLogo size="lg" className="animate-none [&_img]:loading-eager [&_img]:scale-125" />
        </div>
        <h1 className="text-2xl font-bold text-white text-center">
          {mode === "login" ? "Welcome Back" : 
           mode === "signup" ? "Create Account" : 
           mode === "verify-otp" ? "Verify Email" :
           mode === "reset-otp" ? "Reset Password" :
           "Forgot Password"}
        </h1>
        <p className="text-white/90 text-center mt-1 text-base font-medium">
          {mode === "login" ? "Sign in to continue" : 
           mode === "signup" ? "Join EggPro today" : 
           mode === "verify-otp" ? `Enter the code sent to ${email}` :
           mode === "reset-otp" ? `Enter the code sent to ${email}` :
           "Enter your email to get reset code"}
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
                  {isLoading ? "Sending..." : "Send Reset Code"}
                </Button>

                <button
                  onClick={() => setMode("login")}
                  className="w-full text-center text-base font-medium text-primary"
                >
                  Back to login
                </button>
              </motion.div>
            )}

            {mode === "reset-otp" && (
              <motion.div
                key="reset-otp-form"
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

                <div className="space-y-2">
                  <label className="text-base font-semibold">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
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
                  <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
                </div>

                <Button
                  className="w-full h-12 gradient-hero text-white font-semibold text-base"
                  onClick={handleResetPassword}
                  disabled={isLoading || otp.length !== 6 || !newPassword || newPassword.length < 6}
                >
                  {isLoading ? "Resetting..." : "Reset Password"}
                </Button>

                <p className="text-center text-base text-muted-foreground">
                  Didn't receive the code?{" "}
                  <button
                    onClick={handleResendResetOTP}
                    disabled={resendTimer > 0 || isLoading}
                    className={`font-bold ${resendTimer > 0 ? 'text-muted-foreground' : 'text-primary'}`}
                  >
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
                  </button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

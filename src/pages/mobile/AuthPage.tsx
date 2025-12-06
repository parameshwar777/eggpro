import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mail, Lock, Phone, User, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { EggLogo } from "@/components/EggLogo";
import { supabase } from "@/integrations/supabase/client";

type AuthMode = "login" | "signup" | "phone" | "otp" | "forgot";

export const AuthPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithPhone, verifyOtp } = useAuth();

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailAuth = async () => {
    if (mode === "login") {
      if (!email || !password) {
        toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
        return;
      }
    } else {
      if (!email || !password || !fullName) {
        toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
        return;
      }
      if (password.length < 6) {
        toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
        return;
      }
    }

    setIsLoading(true);
    try {
      if (mode === "login") {
        const { error } = await signInWithEmail(email, password);
        if (error) throw error;
        toast({ title: "Welcome back!", description: "You've successfully signed in." });
        
        // Check if user has community set
        const { data: profile } = await supabase.from("profiles").select("community").eq("id", (await supabase.auth.getUser()).data.user?.id).single();
        if (profile?.community) {
          localStorage.setItem("selectedCommunity", profile.community);
          navigate("/home");
        } else {
          navigate("/community");
        }
      } else {
        const { error, data } = await signUpWithEmail(email, password, fullName);
        if (error) throw error;
        
        // Handle referral code if provided
        if (referralCode && data?.user) {
          const { data: referrer } = await supabase
            .from("profiles")
            .select("id")
            .eq("referral_code", referralCode.toUpperCase())
            .single();
          
          if (referrer) {
            await supabase.from("referrals").insert({
              referrer_id: referrer.id,
              referred_id: data.user.id,
              referral_code: referralCode.toUpperCase(),
              status: "pending"
            });
          }
        }
        
        toast({ title: "Account Created!", description: "You've successfully signed up." });
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
      if (error) throw error;
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setIsLoading(false);
    }
  };

  const [generatedOtp, setGeneratedOtp] = useState("");

  const handlePhoneAuth = async () => {
    if (!phone || phone.length < 10) {
      toast({ title: "Error", description: "Please enter a valid phone number", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const formattedPhone = `91${phone}`;
      
      // Call WhatsApp OTP edge function
      const { data, error } = await supabase.functions.invoke("whatsapp-otp", {
        body: { action: "send", phone: formattedPhone }
      });
      
      if (error) throw error;
      
      // Store OTP for display (since WhatsApp can't auto-send without Business API)
      setGeneratedOtp(data.otp);
      
      toast({ 
        title: "OTP Generated!", 
        description: `Your OTP is: ${data.otp}. Enter it below to verify.` 
      });
      setMode("otp");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast({ title: "Error", description: "Please enter the 6-digit OTP", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const formattedPhone = `91${phone}`;
      
      // Verify OTP via edge function
      const { data, error } = await supabase.functions.invoke("whatsapp-otp", {
        body: { action: "verify", phone: formattedPhone, otp }
      });
      
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      toast({ title: "Success!", description: "Phone verified successfully." });
      
      // If new user, they'll be redirected to community selection
      // If existing user, check for community
      if (data.isNewUser) {
        navigate("/community");
      } else {
        const { data: profile } = await supabase
          .from("profiles")
          .select("community")
          .eq("id", data.userId)
          .single();
        
        if (profile?.community) {
          localStorage.setItem("selectedCommunity", profile.community);
          navigate("/home");
        } else {
          navigate("/community");
        }
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Header */}
      <div className="gradient-hero p-4 pt-12 pb-8 rounded-b-3xl">
        <button onClick={() => navigate(-1)} className="text-white mb-4">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex justify-center mb-4">
          <EggLogo size="lg" />
        </div>
        <h1 className="text-2xl font-bold text-white text-center">
          {mode === "login" ? "Welcome Back" : mode === "signup" ? "Create Account" : mode === "phone" ? "Phone Login" : mode === "forgot" ? "Reset Password" : "Verify OTP"}
        </h1>
        <p className="text-white/80 text-center mt-1 text-sm">
          {mode === "login" ? "Sign in to continue" : mode === "signup" ? "Join EggPro today" : mode === "phone" ? "Enter your phone number" : mode === "forgot" ? "We'll send you a reset link" : "Enter the code sent to your phone"}
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
                  className="w-full h-12"
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

                {/* Phone Login Button */}
                <Button
                  variant="outline"
                  className="w-full h-12"
                  onClick={() => setMode("phone")}
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Continue with Phone
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
                      <label className="text-sm font-medium">Full Name</label>
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
                      <label className="text-sm font-medium">Referral Code (Optional)</label>
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
                  <label className="text-sm font-medium">Email</label>
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
                    <label className="text-sm font-medium">Password</label>
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
                  className="w-full h-12 gradient-hero text-white"
                  onClick={handleEmailAuth}
                  disabled={isLoading}
                >
                  {isLoading ? "Please wait..." : mode === "login" ? "Sign In" : "Sign Up"}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                  <button
                    onClick={() => setMode(mode === "login" ? "signup" : "login")}
                    className="text-primary font-semibold"
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
                  <label className="text-sm font-medium">Email</label>
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

                <Button
                  className="w-full h-12 gradient-hero text-white"
                  onClick={handleForgotPassword}
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>

                <button
                  onClick={() => setMode("login")}
                  className="w-full text-center text-sm text-muted-foreground"
                >
                  Back to login
                </button>
              </motion.div>
            )}

            {mode === "phone" && (
              <motion.div
                key="phone-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">+91</span>
                    <Input
                      type="tel"
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="pl-12"
                      maxLength={10}
                    />
                  </div>
                </div>

                <Button
                  className="w-full h-12 gradient-hero text-white"
                  onClick={handlePhoneAuth}
                  disabled={isLoading}
                >
                  {isLoading ? "Sending OTP..." : "Send OTP"}
                </Button>

                <button
                  onClick={() => setMode("login")}
                  className="w-full text-center text-sm text-muted-foreground"
                >
                  Back to email login
                </button>
              </motion.div>
            )}

            {mode === "otp" && (
              <motion.div
                key="otp-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex flex-col items-center gap-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Enter the 6-digit code to verify your phone
                  </p>
                  {generatedOtp && (
                    <div className="bg-secondary p-3 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">Your OTP is:</p>
                      <p className="text-2xl font-bold text-primary tracking-widest">{generatedOtp}</p>
                    </div>
                  )}
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
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

                <Button
                  className="w-full h-12 gradient-hero text-white"
                  onClick={handleVerifyOtp}
                  disabled={isLoading}
                >
                  {isLoading ? "Verifying..." : "Verify OTP"}
                </Button>

                <button
                  onClick={() => setMode("phone")}
                  className="w-full text-center text-sm text-muted-foreground"
                >
                  Resend OTP
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

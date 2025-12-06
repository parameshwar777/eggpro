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

type AuthMode = "login" | "signup" | "phone" | "otp" | "email-otp";

export const AuthPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signInWithEmail, signInWithGoogle, signInWithPhone, verifyOtp } = useAuth();

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingSignup, setPendingSignup] = useState<{ email: string; password: string; fullName: string } | null>(null);

  const handleEmailAuth = async () => {
    if (mode === "login") {
      if (!email || !password) {
        toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
        return;
      }
    } else {
      // Signup mode - only needs name and email for OTP
      if (!email || !fullName) {
        toast({ title: "Error", description: "Please enter your name and email", variant: "destructive" });
        return;
      }
    }

    setIsLoading(true);
    try {
      if (mode === "login") {
        const { error } = await signInWithEmail(email, password);
        if (error) throw error;
        toast({ title: "Welcome back!", description: "You've successfully signed in." });
        navigate("/community");
      } else {
        // Store pending signup data
        setPendingSignup({ email, password: "", fullName });
        
        // Send OTP for email verification
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: true,
            data: { full_name: fullName }
          }
        });
        
        if (otpError) throw otpError;
        
        toast({ title: "OTP Sent!", description: "Please check your email for the verification code." });
        setMode("email-otp");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (emailOtp.length !== 6) {
      toast({ title: "Error", description: "Please enter the 6-digit OTP", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: emailOtp,
        type: "email"
      });
      
      if (error) throw error;
      
      toast({ title: "Email Verified!", description: "Welcome to EggPro!" });
      navigate("/community");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmailOtp = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          data: pendingSignup ? { full_name: pendingSignup.fullName } : undefined
        }
      });
      
      if (error) throw error;
      toast({ title: "OTP Resent!", description: "Please check your email." });
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

  const handlePhoneAuth = async () => {
    if (!phone || phone.length < 10) {
      toast({ title: "Error", description: "Please enter a valid phone number", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const formattedPhone = phone.startsWith("+91") ? phone : `+91${phone}`;
      const { error } = await signInWithPhone(formattedPhone);
      if (error) throw error;
      toast({ title: "OTP Sent!", description: "Please check your phone for the verification code." });
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
      const formattedPhone = phone.startsWith("+91") ? phone : `+91${phone}`;
      const { error } = await verifyOtp(formattedPhone, otp);
      if (error) throw error;
      toast({ title: "Success!", description: "Phone verified successfully." });
      navigate("/community");
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
          {mode === "login" ? "Welcome Back" : mode === "signup" ? "Create Account" : mode === "phone" ? "Phone Login" : mode === "email-otp" ? "Verify Email" : "Verify OTP"}
        </h1>
        <p className="text-white/80 text-center mt-1 text-sm">
          {mode === "login" ? "Sign in to continue" : mode === "signup" ? "Join EggPro today" : mode === "phone" ? "Enter your phone number" : mode === "email-otp" ? "Enter the code sent to your email" : "Enter the code sent to your phone"}
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

                {mode === "login" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password</label>
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
                  </div>
                )}

                <Button
                  className="w-full h-12 gradient-hero text-white"
                  onClick={mode === "signup" ? handleEmailAuth : handleEmailAuth}
                  disabled={isLoading}
                >
                  {isLoading ? "Please wait..." : mode === "login" ? "Sign In" : "Send OTP to Email"}
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

            {mode === "email-otp" && (
              <motion.div
                key="email-otp-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Mail className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Enter the 6-digit code sent to<br />
                    <span className="font-semibold text-foreground">{email}</span>
                  </p>
                  <InputOTP maxLength={6} value={emailOtp} onChange={setEmailOtp}>
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
                  onClick={handleVerifyEmailOtp}
                  disabled={isLoading}
                >
                  {isLoading ? "Verifying..." : "Verify & Create Account"}
                </Button>

                <button
                  onClick={handleResendEmailOtp}
                  disabled={isLoading}
                  className="w-full text-center text-sm text-primary font-medium"
                >
                  Resend OTP
                </button>

                <button
                  onClick={() => { setMode("signup"); setEmailOtp(""); }}
                  className="w-full text-center text-sm text-muted-foreground"
                >
                  Change email address
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
                  <p className="text-sm text-muted-foreground">
                    Enter the 6-digit code sent to +91 {phone}
                  </p>
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
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { EggLogo } from "@/components/EggLogo";
import { supabase } from "@/integrations/supabase/client";

type AuthMode =
  | "login"
  | "signup"
  | "verify-otp"
  | "complete-profile"
  | "forgot"          // step 1: enter email, send OTP
  | "forgot-verify";  // step 2: enter OTP + new password

type AuthChannel = "email" | "phone";

const normalizePhone = (raw: string) => {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return "+91" + digits;
  if (digits.startsWith("91") && digits.length === 12) return "+" + digits;
  return "+" + digits;
};

export const AuthPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signInWithEmail, user } = useAuth();

  const [mode, setMode] = useState<AuthMode>("login");
  const [channel, setChannel] = useState<AuthChannel>("email");

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      (async () => {
        const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
        const userRoles = roles?.map(r => r.role) || [];
        if (userRoles.includes("merchant") && !userRoles.includes("admin")) {
          navigate("/merchant/orders", { replace: true });
          return;
        }
        const { data: profile } = await supabase.from("profiles").select("community").eq("id", user.id).single();
        if (profile?.community) {
          localStorage.setItem("selectedCommunity", profile.community);
          navigate("/home", { replace: true });
        } else {
          navigate("/community", { replace: true });
        }
      })();
    }
  }, [user, navigate]);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const err = (msg: string) => toast({ title: "Error", description: msg, variant: "destructive" });

  // ============ LOGIN ============
  const handleLogin = async () => {
    setIsLoading(true);
    try {
      if (channel === "email") {
        if (!email.trim() || !password) return err("Enter email and password");
        const { error } = await signInWithEmail(email.trim().toLowerCase(), password);
        if (error) throw error;
      } else {
        const digits = phone.replace(/\D/g, "");
        if (digits.length !== 10) return err("Enter a valid 10-digit phone");
        if (!password) return err("Enter your password");
        const normalized = normalizePhone(phone);

        // Resolve phone -> email
        const { data: lookup } = await supabase.functions.invoke("phone-to-email", {
          body: { phone: normalized },
        });
        if (!lookup?.success || !lookup?.email) {
          throw new Error(lookup?.error || "No account found for this phone");
        }
        const { error } = await signInWithEmail(lookup.email, password);
        if (error) {
          // If phone account has no password (legacy synthetic-email user), guide them
          if ((error.message || "").toLowerCase().includes("invalid")) {
            throw new Error("Wrong password. Forgot password? Tap 'Forgot Password' to reset via email.");
          }
          throw error;
        }
      }
      toast({ title: "Welcome back!" });
    } catch (e: any) {
      err(e.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  // ============ PHONE SIGNUP — STEP 1: send OTP ============
  const handleSendSignupOtp = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) return err("Enter a valid 10-digit phone");
    const normalized = normalizePhone(phone);

    setIsLoading(true);
    try {
      const { data } = await supabase.functions.invoke("whatsapp-otp", {
        body: { action: "send", phone: normalized, purpose: "signup" },
      });
      if (!data?.success) throw new Error(data?.error || "Failed to send OTP");
      toast({ title: "OTP sent!", description: `Check WhatsApp on ${normalized}` });
      setMode("verify-otp");
      setResendTimer(60);
      setOtp("");
    } catch (e: any) {
      err(e.message || "Could not send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  // ============ PHONE SIGNUP — STEP 2: verify OTP ============
  const handleVerifySignupOtp = async () => {
    if (otp.length !== 6) return err("Enter complete 6-digit code");
    const normalized = normalizePhone(phone);
    setIsLoading(true);
    try {
      const { data } = await supabase.functions.invoke("whatsapp-otp", {
        body: { action: "verify", phone: normalized, otp, purpose: "signup" },
      });
      if (!data?.success) throw new Error(data?.error || "Verification failed");
      toast({ title: "Verified!", description: "Now add your details" });
      setMode("complete-profile");
    } catch (e: any) {
      err(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendSignupOtp = async () => {
    if (resendTimer > 0) return;
    const normalized = normalizePhone(phone);
    setIsLoading(true);
    try {
      const { data } = await supabase.functions.invoke("whatsapp-otp", {
        body: { action: "send", phone: normalized, purpose: "signup" },
      });
      if (!data?.success) throw new Error(data?.error || "Failed");
      toast({ title: "OTP resent" });
      setResendTimer(60);
      setOtp("");
    } catch (e: any) {
      err(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ============ PHONE SIGNUP — STEP 3: complete profile ============
  const handleCompleteSignup = async () => {
    if (!fullName.trim()) return err("Enter your full name");
    if (!email.trim() || !email.includes("@")) return err("Enter a valid email (needed for password reset)");
    if (!password || password.length < 6) return err("Password must be at least 6 characters");
    const normalized = normalizePhone(phone);
    setIsLoading(true);
    try {
      const { data } = await supabase.functions.invoke("whatsapp-otp", {
        body: {
          action: "complete-signup",
          phone: normalized,
          email: email.trim().toLowerCase(),
          password,
          fullName: fullName.trim(),
        },
      });
      if (!data?.success) throw new Error(data?.error || "Could not create account");

      // Referral
      if (referralCode && data.userId) {
        const { data: referrer } = await supabase
          .from("profiles").select("id")
          .eq("referral_code", referralCode.toUpperCase()).maybeSingle();
        if (referrer) {
          await supabase.from("referrals").insert({
            referrer_id: referrer.id,
            referred_id: data.userId,
            referral_code: referralCode.toUpperCase(),
            status: "pending",
          });
        }
      }

      toast({ title: "Account created!", description: "Signing you in..." });
      const { error: signInErr } = await signInWithEmail(email.trim().toLowerCase(), password);
      if (signInErr) throw signInErr;
      navigate("/community");
    } catch (e: any) {
      err(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ============ FORGOT PASSWORD — STEP 1: send email OTP ============
  const handleForgotSendOtp = async () => {
    if (!forgotEmail.trim() || !forgotEmail.includes("@")) {
      return err("Enter the email on your account");
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("email-otp", {
        body: { action: "reset-send", email: forgotEmail.trim().toLowerCase() },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Could not send code");
      toast({ title: "Code sent", description: `Check ${forgotEmail} for a 6-digit code` });
      setMode("forgot-verify");
      setOtp("");
      setPassword("");
      setResendTimer(60);
    } catch (e: any) {
      err(e.message || "Could not send code");
    } finally {
      setIsLoading(false);
    }
  };

  // ============ FORGOT PASSWORD — STEP 2: verify OTP + set new password ============
  const handleForgotVerify = async () => {
    if (otp.length !== 6) return err("Enter the 6-digit code");
    if (!password || password.length < 6) return err("New password must be at least 6 characters");
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("email-otp", {
        body: {
          action: "reset-verify",
          email: forgotEmail.trim().toLowerCase(),
          otp,
          newPassword: password,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Could not reset password");
      toast({ title: "Password updated", description: "Sign in with your new password" });
      setEmail(forgotEmail.trim().toLowerCase());
      setOtp("");
      setPassword("");
      setMode("login");
      setChannel("email");
    } catch (e: any) {
      err(e.message || "Reset failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotResend = async () => {
    if (resendTimer > 0) return;
    await handleForgotSendOtp();
  };

  // ============ EMAIL SIGNUP (kept simple) ============
  const handleEmailSignup = async () => {
    if (!fullName.trim()) return err("Enter your full name");
    if (!email.trim() || !email.includes("@")) return err("Enter a valid email");
    if (!password || password.length < 6) return err("Password must be at least 6 characters");
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/community`,
          data: { full_name: fullName.trim() },
        },
      });
      if (error) throw error;

      if (referralCode && data.user?.id) {
        const { data: referrer } = await supabase
          .from("profiles").select("id")
          .eq("referral_code", referralCode.toUpperCase()).maybeSingle();
        if (referrer) {
          await supabase.from("referrals").insert({
            referrer_id: referrer.id,
            referred_id: data.user.id,
            referral_code: referralCode.toUpperCase(),
            status: "pending",
          });
        }
      }

      toast({ title: "Account created!", description: "Signing you in..." });
    } catch (e: any) {
      err(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const headerTitle = {
    login: "Welcome Back",
    signup: "Create Account",
    "verify-otp": "Verify Phone",
    "complete-profile": "Almost done",
    forgot: "Reset Password",
    "forgot-verify": "Enter Code",
  }[mode];

  const headerSub = {
    login: "Sign in to continue",
    signup: channel === "phone" ? "We'll send a code on WhatsApp" : "Join EggPro today",
    "verify-otp": `Enter the code sent to ${normalizePhone(phone)}`,
    "complete-profile": "Add your details to finish signup",
    forgot: "We'll email you a 6-digit code",
    "forgot-verify": `Code sent to ${forgotEmail}`,
  }[mode];

  return (
    <div className="page-scroll bg-background flex flex-col">
      {/* Header */}
      <div className="gradient-hero p-4 pt-12 pb-8 rounded-b-3xl safe-top">
        <button
          onClick={() => {
            if (mode === "verify-otp") { setMode("signup"); setOtp(""); }
            else if (mode === "complete-profile") { setMode("verify-otp"); }
            else if (mode === "forgot") { setMode("login"); }
            else if (mode === "forgot-verify") { setMode("forgot"); setOtp(""); }
            else if (mode === "signup") { setMode("login"); }
            else navigate(-1);
          }}
          className="text-white mb-4"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex justify-center mb-4">
          <EggLogo size="lg" className="animate-none [&_img]:loading-eager [&_img]:scale-125" />
        </div>
        <h1 className="text-2xl font-bold text-white text-center">{headerTitle}</h1>
        <p className="text-white/90 text-center mt-1 text-base font-medium">{headerSub}</p>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 -mt-4">
        <motion.div
          className="bg-card rounded-2xl shadow-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AnimatePresence mode="wait">

            {/* ============== LOGIN ============== */}
            {mode === "login" && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {/* Channel toggle */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
                  <button type="button" onClick={() => setChannel("email")}
                    className={`py-2 text-sm font-semibold rounded-md flex items-center justify-center gap-1.5 ${channel === "email" ? "bg-background shadow text-foreground" : "text-muted-foreground"}`}>
                    <Mail className="w-4 h-4" /> Email
                  </button>
                  <button type="button" onClick={() => setChannel("phone")}
                    className={`py-2 text-sm font-semibold rounded-md flex items-center justify-center gap-1.5 ${channel === "phone" ? "bg-background shadow text-foreground" : "text-muted-foreground"}`}>
                    <Phone className="w-4 h-4" /> Phone
                  </button>
                </div>

                {channel === "email" ? (
                  <div className="space-y-2">
                    <label className="text-base font-semibold">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input type="email" placeholder="you@example.com" value={email}
                        onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-base font-semibold">Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input type="tel" inputMode="numeric" maxLength={10}
                        placeholder="10-digit phone (India +91)" value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} className="pl-10 h-12" />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-base font-semibold">Password</label>
                    <button onClick={() => { setForgotEmail(email); setMode("forgot"); }} className="text-xs text-primary font-semibold">
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password}
                      onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 h-12" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button className="w-full h-12 gradient-hero text-white font-semibold" onClick={handleLogin} disabled={isLoading}>
                  {isLoading ? "Please wait..." : "Sign In"}
                </Button>

                <p className="text-center text-base font-medium text-muted-foreground">
                  Don't have an account?{" "}
                  <button onClick={() => { setMode("signup"); setChannel("phone"); }} className="text-primary font-bold">
                    Sign Up
                  </button>
                </p>
              </motion.div>
            )}

            {/* ============== SIGNUP STEP 1 — phone or email ============== */}
            {mode === "signup" && (
              <motion.div key="signup"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
                  <button type="button" onClick={() => setChannel("phone")}
                    className={`py-2 text-sm font-semibold rounded-md flex items-center justify-center gap-1.5 ${channel === "phone" ? "bg-background shadow text-foreground" : "text-muted-foreground"}`}>
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </button>
                  <button type="button" onClick={() => setChannel("email")}
                    className={`py-2 text-sm font-semibold rounded-md flex items-center justify-center gap-1.5 ${channel === "email" ? "bg-background shadow text-foreground" : "text-muted-foreground"}`}>
                    <Mail className="w-4 h-4" /> Email
                  </button>
                </div>

                {channel === "phone" ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-base font-semibold">WhatsApp Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input type="tel" inputMode="numeric" maxLength={10}
                          placeholder="10-digit phone (India +91)" value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} className="pl-10 h-12" />
                      </div>
                      <p className="text-xs text-muted-foreground">We'll send a 6-digit code on WhatsApp</p>
                    </div>
                    <Button className="w-full h-12 gradient-hero text-white font-semibold" onClick={handleSendSignupOtp} disabled={isLoading}>
                      {isLoading ? "Sending..." : "Send OTP"}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-base font-semibold">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input type="text" placeholder="Your name" value={fullName}
                          onChange={(e) => setFullName(e.target.value)} className="pl-10 h-12" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-base font-semibold">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input type="email" placeholder="you@example.com" value={email}
                          onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-base font-semibold">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input type={showPassword ? "text" : "password"} placeholder="Min 6 chars" value={password}
                          onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 h-12" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-base font-semibold">Referral Code (Optional)</label>
                      <Input type="text" placeholder="Enter referral code" value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value.toUpperCase())} className="h-12" />
                    </div>
                    <Button className="w-full h-12 gradient-hero text-white font-semibold" onClick={handleEmailSignup} disabled={isLoading}>
                      {isLoading ? "Creating..." : "Create Account"}
                    </Button>
                  </>
                )}

                <p className="text-center text-base font-medium text-muted-foreground">
                  Already have an account?{" "}
                  <button onClick={() => setMode("login")} className="text-primary font-bold">Sign In</button>
                </p>
              </motion.div>
            )}

            {/* ============== SIGNUP STEP 2 — verify OTP ============== */}
            {mode === "verify-otp" && (
              <motion.div key="verify"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={(v) => setOtp(v)}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} />
                      <InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button className="w-full h-12 gradient-hero text-white font-semibold"
                  onClick={handleVerifySignupOtp} disabled={isLoading || otp.length !== 6}>
                  {isLoading ? "Verifying..." : "Verify Code"}
                </Button>
                <p className="text-center text-base text-muted-foreground">
                  Didn't receive the code?{" "}
                  <button onClick={handleResendSignupOtp} disabled={resendTimer > 0 || isLoading}
                    className={`font-bold ${resendTimer > 0 ? 'text-muted-foreground' : 'text-primary'}`}>
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
                  </button>
                </p>
              </motion.div>
            )}

            {/* ============== SIGNUP STEP 3 — complete profile ============== */}
            {mode === "complete-profile" && (
              <motion.div key="complete"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  <span className="text-muted-foreground">Phone verified:</span>{" "}
                  <span className="font-semibold">{normalizePhone(phone)}</span>
                </div>

                <div className="space-y-2">
                  <label className="text-base font-semibold">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input type="text" placeholder="Your name" value={fullName}
                      onChange={(e) => setFullName(e.target.value)} className="pl-10 h-12" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-base font-semibold">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input type="email" placeholder="you@example.com" value={email}
                      onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12" />
                  </div>
                  <p className="text-xs text-muted-foreground">Used to reset password — we never send OTPs by email after signup.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-base font-semibold">Create Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input type={showPassword ? "text" : "password"} placeholder="Min 6 chars" value={password}
                      onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 h-12" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">Next time, you'll log in with phone + password — no OTP needed.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-base font-semibold">Referral Code (Optional)</label>
                  <Input type="text" placeholder="Enter referral code" value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())} className="h-12" />
                </div>

                <Button className="w-full h-12 gradient-hero text-white font-semibold"
                  onClick={handleCompleteSignup} disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Account"}
                </Button>
              </motion.div>
            )}

            {/* ============== FORGOT PASSWORD ============== */}
            {mode === "forgot" && (
              <motion.div key="forgot"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <p className="text-sm text-muted-foreground">
                  Enter your account email. We'll send a 6-digit code to reset your password.
                </p>
                <div className="space-y-2">
                  <label className="text-base font-semibold">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input type="email" placeholder="you@example.com" value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)} className="pl-10 h-12" />
                  </div>
                </div>
                <Button className="w-full h-12 gradient-hero text-white font-semibold"
                  onClick={handleForgotSendOtp} disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send Code"}
                </Button>
                <button onClick={() => setMode("login")} className="w-full text-center text-base font-medium text-primary">
                  Back to login
                </button>
              </motion.div>
            )}

            {/* ============== FORGOT PASSWORD — VERIFY ============== */}
            {mode === "forgot-verify" && (
              <motion.div key="forgot-verify"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  <span className="text-muted-foreground">Code sent to:</span>{" "}
                  <span className="font-semibold">{forgotEmail}</span>
                </div>

                <div className="space-y-2">
                  <label className="text-base font-semibold">6-Digit Code</label>
                  <div className="flex justify-center">
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
                </div>

                <div className="space-y-2">
                  <label className="text-base font-semibold">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input type={showPassword ? "text" : "password"} placeholder="Min 6 chars" value={password}
                      onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 h-12" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button className="w-full h-12 gradient-hero text-white font-semibold"
                  onClick={handleForgotVerify} disabled={isLoading || otp.length !== 6}>
                  {isLoading ? "Updating..." : "Reset Password"}
                </Button>

                <p className="text-center text-base text-muted-foreground">
                  Didn't receive the code?{" "}
                  <button onClick={handleForgotResend} disabled={resendTimer > 0 || isLoading}
                    className={`font-bold ${resendTimer > 0 ? 'text-muted-foreground' : 'text-primary'}`}>
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend"}
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

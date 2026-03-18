import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Capacitor } from "@capacitor/core";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isMerchant: boolean;
  isLoading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: any }>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ error: any; data: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signInWithPhone: (phone: string) => Promise<{ error: any }>;
  verifyOtp: (phone: string, token: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMerchant, setIsMerchant] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Google Auth for native platforms
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      try {
        // Uses GoogleAuth config from capacitor.config.ts (serverClientId, scopes, etc.)
        GoogleAuth.initialize();
      } catch (e) {
        console.error("GoogleAuth initialize error:", e);
      }
    }
  }, []);


  const checkRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      
      if (error) {
        console.error("Error checking roles:", error);
        return { isAdmin: false, isMerchant: false };
      }
      const roles = data?.map(r => r.role) || [];
      return {
        isAdmin: roles.includes("admin"),
        isMerchant: roles.includes("merchant"),
      };
    } catch (error) {
      console.error("Error checking roles:", error);
      return { isAdmin: false, isMerchant: false };
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            checkRoles(session.user.id).then(({ isAdmin, isMerchant }) => {
              setIsAdmin(isAdmin);
              setIsMerchant(isMerchant);
            });
          }, 0);
        } else {
          setIsAdmin(false);
          setIsMerchant(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkRoles(session.user.id).then(({ isAdmin, isMerchant }) => {
          setIsAdmin(isAdmin);
          setIsMerchant(isMerchant);
        });
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/community`;
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName }
      }
    });
    return { error, data };
  };

  const signInWithGoogle = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const googleUser = await GoogleAuth.signIn();

        const idToken =
          (googleUser as any)?.authentication?.idToken ??
          (googleUser as any)?.idToken ??
          (googleUser as any)?.result?.idToken ??
          null;

        if (!idToken) {
          return {
            error: new Error(
              "Google sign-in did not return an ID token. Please verify: (1) Android OAuth SHA-1 is added in Google Cloud, and (2) serverClientId is your Web Client ID."
            ),
          };
        }

        const { error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: idToken,
        });

        return { error };
      }

      const redirectUrl = `${window.location.origin}/auth`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      return { error };
    } catch (error: any) {
      // Native errors often include numeric codes (e.g., 10 = SHA-1 / OAuth config issue)
      const message =
        typeof error?.message === "string"
          ? error.message
          : JSON.stringify(error);
      console.error("Google sign in error:", error);
      return { error: new Error(message) };
    }
  };


  const signInWithPhone = async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    return { error };
  };

  const verifyOtp = async (phone: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
    return { error };
  };

  const signOut = async () => {
    // Sign out from Google if on native platform
    if (Capacitor.isNativePlatform()) {
      try {
        await GoogleAuth.signOut();
      } catch (e) {
        console.log('Google sign out error:', e);
      }
    }
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    setIsMerchant(false);
    localStorage.removeItem("selectedCommunity");
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isAdmin,
      isLoading,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signInWithPhone,
      verifyOtp,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

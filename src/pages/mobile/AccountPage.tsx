import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Wallet, RefreshCw, Bell, HelpCircle, ChevronRight, Star, LogOut, LogIn, Settings, Pencil, Check, X, ChevronDown } from "lucide-react";
import { MobileLayout } from "@/components/mobile/MobileLayout";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export const AccountPage = () => {
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [selectedCommunity, setSelectedCommunity] = useState(localStorage.getItem("selectedCommunity") || "");
  const [subscriptionCount, setSubscriptionCount] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  
  // Edit states
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingCommunity, setIsEditingCommunity] = useState(false);
  const [editName, setEditName] = useState("");
  const [communities, setCommunities] = useState<any[]>([]);

  useEffect(() => {
    fetchNotifications();
    fetchCommunities();
    if (user) {
      fetchProfile();
      fetchSubscriptionCount();
    }
  }, [user]);

  const fetchNotifications = async () => {
    const { data } = await supabase.from("notifications").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(5);
    setNotifications(data || []);
  };

  const fetchCommunities = async () => {
    const { data } = await supabase.from("communities").select("*").eq("is_active", true).order("name");
    setCommunities(data || []);
  };

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    setProfile(data);
    setEditName(data?.full_name || user?.user_metadata?.full_name || "");
    setWalletBalance(data?.wallet_balance || 0);
  };

  const fetchSubscriptionCount = async () => {
    if (!user) return;
    const { count } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("order_status", "confirmed");
    setSubscriptionCount(count || 0);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleSaveName = async () => {
    if (!user || !editName.trim()) return;
    const { error } = await supabase.from("profiles").update({ full_name: editName.trim() }).eq("id", user.id);
    if (error) {
      toast({ title: "Error", description: "Failed to update name", variant: "destructive" });
    } else {
      setProfile({ ...profile, full_name: editName.trim() });
      toast({ title: "Success", description: "Name updated successfully" });
    }
    setIsEditingName(false);
  };

  const handleChangeCommunity = (communityName: string) => {
    localStorage.setItem("selectedCommunity", communityName);
    setSelectedCommunity(communityName);
    setIsEditingCommunity(false);
    toast({ title: "Success", description: "Community updated successfully" });
  };

  const menuItems = [
    { icon: MapPin, label: "Delivery Addresses", desc: "Add your addresses", to: "/addresses", color: "bg-blue-100 text-blue-600" },
    { icon: Wallet, label: "Wallet", desc: `₹${walletBalance} available`, to: "/wallet", color: "bg-green-100 text-green-600" },
    { icon: RefreshCw, label: "My Subscriptions", desc: `${subscriptionCount} active`, to: "/subscriptions", color: "bg-purple-100 text-purple-600" },
    { icon: Bell, label: "Notifications", desc: `${notifications.length} new`, to: "/notifications", color: "bg-red-100 text-red-600" },
    { icon: HelpCircle, label: "Help & Support", desc: "Get help or contact us", to: "#", color: "bg-cyan-100 text-cyan-600" },
  ];

  const userName = profile?.full_name || user?.user_metadata?.full_name || "User";

  return (
    <MobileLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="gradient-warm px-4 pt-6 pb-16 rounded-b-3xl">
        <div className="flex items-center justify-between">
          <motion.h1 initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-xl font-bold text-foreground">My Account</motion.h1>
          {isAdmin && (
            <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} whileTap={{ scale: 0.95 }} onClick={() => navigate("/admin")} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full text-sm font-medium">
              <Settings className="w-4 h-4" />Admin
            </motion.button>
          )}
        </div>
      </motion.div>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="mx-4 -mt-10 bg-card rounded-2xl p-5 shadow-elevated">
        <div className="flex items-center gap-4">
          <motion.div whileHover={{ scale: 1.1 }} className="w-14 h-14 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-bold text-primary-foreground">{userName[0]?.toUpperCase() || "G"}</span>
          </motion.div>
          <div className="flex-1 min-w-0">
            {/* Editable Name with improved UI */}
            {isEditingName ? (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 bg-secondary/50 rounded-xl p-2"
              >
                <Input 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)} 
                  className="h-9 bg-card border-primary/30 focus:border-primary text-sm font-medium" 
                  placeholder="Your name"
                  autoFocus
                />
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSaveName} 
                  className="p-2 bg-green-500 rounded-lg text-white shadow-md"
                >
                  <Check className="w-4 h-4" />
                </motion.button>
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsEditingName(false)} 
                  className="p-2 bg-red-500 rounded-lg text-white shadow-md"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </motion.div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-foreground text-lg">{user ? userName : "Guest User"}</h2>
                {user && (
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { setEditName(userName); setIsEditingName(true); }} 
                    className="p-1.5 bg-primary/10 rounded-lg text-primary hover:bg-primary/20 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </motion.button>
                )}
              </div>
            )}
            <p className="text-sm text-muted-foreground truncate">{user?.email || "Sign in to continue"}</p>
            
            {/* Editable Community with improved UI */}
            {isEditingCommunity ? (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-3 bg-secondary/30 rounded-xl p-2 border border-primary/20"
              >
                <p className="text-xs text-muted-foreground mb-2 px-1">Select your community:</p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {communities.map((c) => (
                    <motion.button 
                      key={c.id} 
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleChangeCommunity(c.name)} 
                      className={`w-full text-left text-sm px-3 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                        selectedCommunity === c.name 
                          ? 'bg-primary text-primary-foreground shadow-md' 
                          : 'bg-card hover:bg-primary/10 text-foreground'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      {c.name}
                    </motion.button>
                  ))}
                </div>
                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsEditingCommunity(false)} 
                  className="w-full mt-2 text-center text-xs px-3 py-2 rounded-lg bg-red-50 text-red-600 font-medium"
                >
                  Cancel
                </motion.button>
              </motion.div>
            ) : (
              selectedCommunity && (
                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  onClick={() => user && setIsEditingCommunity(true)}
                  className="flex items-center gap-1.5 mt-2 bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs text-primary font-medium">{selectedCommunity}</span>
                  {user && <ChevronDown className="w-3 h-3 text-primary" />}
                </motion.button>
              )
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">₹{walletBalance}</p>
            <p className="text-xs text-muted-foreground">Wallet</p>
          </div>
          <div className="text-center border-x border-border">
            <p className="text-lg font-bold text-foreground">{subscriptionCount}</p>
            <p className="text-xs text-muted-foreground">Subscriptions</p>
          </div>
          <div className="text-center flex flex-col items-center">
            <div className="flex items-center gap-0.5">
              <Star className="w-4 h-4 fill-primary text-primary" />
              <span className="text-lg font-bold text-foreground">4.8</span>
            </div>
            <p className="text-xs text-muted-foreground">Rating</p>
          </div>
        </div>
      </motion.div>

      <div className="px-4 py-4 space-y-2">
        {menuItems.map((item, i) => (
          <motion.button key={item.label} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 + i * 0.05 }} whileTap={{ scale: 0.98 }} onClick={() => navigate(item.to)} className="w-full bg-card rounded-xl p-4 shadow-card flex items-center gap-3">
            <div className={`p-3 rounded-xl ${item.color} flex-shrink-0`}><item.icon className="w-5 h-5" /></div>
            <div className="flex-1 text-left min-w-0"><p className="font-medium text-foreground">{item.label}</p><p className="text-xs text-muted-foreground truncate">{item.desc}</p></div>
            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          </motion.button>
        ))}
        {user ? (
          <motion.button initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} whileTap={{ scale: 0.98 }} onClick={handleLogout} className="w-full bg-red-50 rounded-xl p-4 shadow-card flex items-center gap-3">
            <div className="p-3 rounded-xl bg-red-100 text-red-600 flex-shrink-0"><LogOut className="w-5 h-5" /></div>
            <div className="flex-1 text-left"><p className="font-medium text-red-600">Logout</p></div>
          </motion.button>
        ) : (
          <motion.button initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} whileTap={{ scale: 0.98 }} onClick={() => navigate("/auth")} className="w-full bg-primary/10 rounded-xl p-4 shadow-card flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/20 text-primary flex-shrink-0"><LogIn className="w-5 h-5" /></div>
            <div className="flex-1 text-left"><p className="font-medium text-primary">Login / Sign Up</p></div>
          </motion.button>
        )}
      </div>
    </MobileLayout>
  );
};
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MapPin, Calendar, Wallet, Tag, Info, Plus, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, getDaysInMonth, addMonths } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    Razorpay: any;
  }
}

type FrequencyType = "daily" | "alternate" | "weekly";

interface SavedAddress {
  id: string;
  label: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  pincode: string;
  is_default: boolean;
}

const WEEKDAYS = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

export const SubscriptionPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Hyderabad");
  const [pincode, setPincode] = useState("");
  const [frequency, setFrequency] = useState<FrequencyType>("daily");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [weeklyDay, setWeeklyDay] = useState("monday");
  const [referralCode, setReferralCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [useWallet, setUseWallet] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  const community = localStorage.getItem("selectedCommunity") || "";

  // Fetch saved addresses and wallet balance
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      // Fetch wallet balance
      const { data: profile } = await supabase
        .from("profiles")
        .select("wallet_balance")
        .eq("id", user.id)
        .single();
      setWalletBalance(profile?.wallet_balance || 0);

      // Fetch saved addresses
      const { data: addresses } = await supabase
        .from("user_addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });
      
      if (addresses && addresses.length > 0) {
        setSavedAddresses(addresses);
        // Auto-select default address
        const defaultAddr = addresses.find(a => a.is_default) || addresses[0];
        setSelectedAddressId(defaultAddr.id);
        setPhone(defaultAddr.phone);
        setAddress(`${defaultAddr.address_line1}${defaultAddr.address_line2 ? ', ' + defaultAddr.address_line2 : ''}`);
        setCity(defaultAddr.city);
        setPincode(defaultAddr.pincode);
      } else {
        setShowNewAddressForm(true);
      }
    };
    fetchData();
  }, [user]);

  const frequencies: { value: FrequencyType; label: string; desc: string }[] = [
    { value: "daily", label: "Daily", desc: "Every day" },
    { value: "alternate", label: "Alternate", desc: "Every 2 days" },
    { value: "weekly", label: "Weekly", desc: "Once a week" },
  ];

  // Calculate monthly subscription amount
  const monthlyAmount = useMemo(() => {
    const daysInMonth = getDaysInMonth(startDate);
    const pricePerDelivery = totalPrice;
    
    let deliveriesPerMonth = 0;
    
    switch (frequency) {
      case "daily":
        deliveriesPerMonth = daysInMonth;
        break;
      case "alternate":
        deliveriesPerMonth = Math.ceil(daysInMonth / 2);
        break;
      case "weekly":
        deliveriesPerMonth = 4;
        break;
    }
    
    return pricePerDelivery * deliveriesPerMonth;
  }, [frequency, startDate, totalPrice]);

  // Calculate subscription end date (1 month from start)
  const subscriptionEndDate = useMemo(() => {
    return addMonths(startDate, 1);
  }, [startDate]);

  const handleSelectAddress = (addr: SavedAddress) => {
    setSelectedAddressId(addr.id);
    setPhone(addr.phone);
    setAddress(`${addr.address_line1}${addr.address_line2 ? ', ' + addr.address_line2 : ''}`);
    setCity(addr.city);
    setPincode(addr.pincode);
    setShowNewAddressForm(false);
  };

  const handlePayment = async () => {
    if (!user) {
      toast({ title: "Please login", description: "You need to login to subscribe" });
      navigate("/auth");
      return;
    }

    if (!phone || !address || !pincode) {
      toast({ title: "Missing details", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    setIsProcessing(true);

    try {
      // If wallet has enough balance and user wants to use it
      if (useWallet && walletBalance >= monthlyAmount) {
        // Deduct from wallet
        const newBalance = walletBalance - monthlyAmount;
        await supabase
          .from("profiles")
          .update({ wallet_balance: newBalance })
          .eq("id", user.id);

        // Add wallet transaction
        await supabase
          .from("wallet_transactions")
          .insert({
            user_id: user.id,
            amount: monthlyAmount,
            type: "debit",
            description: "Subscription Payment"
          });

        const { error: subError } = await supabase
          .from("orders")
          .insert({
            user_id: user.id,
            community,
            address: `${address}, ${city} - ${pincode}`,
            phone,
            items: items.map(i => ({ 
              name: i.name, 
              quantity: i.quantity, 
              price: i.price, 
              packSize: i.packSize,
              frequency,
              weeklyDay: frequency === "weekly" ? weeklyDay : null,
              startDate: format(startDate, "yyyy-MM-dd")
            })),
            total_amount: monthlyAmount,
            payment_status: "completed",
            order_status: "confirmed",
            subscription_end_date: subscriptionEndDate.toISOString()
          });

        if (subError) throw subError;

        toast({ title: "Subscription Created!", description: "Payment completed using wallet balance." });
        clearCart();
        navigate("/orders");
        return;
      }

      // Get user profile for name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      // Create order in database
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          community,
          address: `${address}, ${city} - ${pincode}`,
          phone,
          customer_name: profile?.full_name || user.email?.split("@")[0] || "Customer",
          items: items.map(i => ({ 
            name: i.name, 
            quantity: i.quantity, 
            price: i.price, 
            packSize: i.packSize,
            frequency,
            weeklyDay: frequency === "weekly" ? weeklyDay : null,
            startDate: format(startDate, "yyyy-MM-dd")
          })),
          total_amount: monthlyAmount,
          payment_status: "pending",
          order_status: "pending",
          subscription_end_date: subscriptionEndDate.toISOString()
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create Razorpay order
      const { data: razorpayData, error: razorpayError } = await supabase.functions.invoke("create-razorpay-order", {
        body: { amount: monthlyAmount, receipt: orderData.id }
      });

      if (razorpayError) throw razorpayError;

      const options = {
        key: razorpayData.keyId,
        amount: razorpayData.amount,
        currency: razorpayData.currency,
        name: "EggPro",
        description: `${frequency.charAt(0).toUpperCase() + frequency.slice(1)} Subscription (1 Month)`,
        order_id: razorpayData.orderId,
        handler: async (response: any) => {
          try {
            const { error: verifyError } = await supabase.functions.invoke("verify-payment", {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: orderData.id,
                community,
                address: `${address}, ${city} - ${pincode}`,
                phone,
                customerName: profile?.full_name || user.email || "Customer",
                items: items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
                totalAmount: monthlyAmount,
                subscriptionEndDate: subscriptionEndDate.toISOString()
              }
            });

            if (verifyError) throw verifyError;

            // Handle referral reward on first payment
            if (referralCode) {
              const { data: referral } = await supabase
                .from("referrals")
                .select("*")
                .eq("referred_id", user.id)
                .eq("status", "pending")
                .single();

              if (referral) {
                await supabase
                  .from("referrals")
                  .update({ status: "completed", completed_at: new Date().toISOString() })
                  .eq("id", referral.id);

                await supabase.from("wallet_transactions").insert([
                  { user_id: referral.referrer_id, amount: 20, type: "credit", description: "Referral reward" },
                  { user_id: user.id, amount: 40, type: "credit", description: "Welcome referral bonus" }
                ]);
              }
            }

            toast({ title: "Subscription Created!", description: "Your order has been confirmed." });
            clearCart();
            navigate("/orders");
          } catch (error: any) {
            toast({ title: "Payment verification failed", description: error.message, variant: "destructive" });
          }
        },
        prefill: {
          email: user.email,
          contact: phone
        },
        theme: {
          color: "#F59E0B"
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    navigate("/cart");
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FFF8E7] w-full">
      <div className="max-w-lg mx-auto pb-32">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-primary px-4 py-4 flex items-center gap-3"
        >
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-card/20"
          >
            <ArrowLeft className="w-5 h-5 text-primary-foreground" />
          </motion.button>
          <h1 className="text-lg font-semibold text-primary-foreground">Subscription Setup</h1>
        </motion.div>

        <div className="p-4 space-y-4">
          {/* Saved Addresses Section */}
          {savedAddresses.length > 0 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-card rounded-2xl p-4 shadow-card"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-foreground">Select Address</h3>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => navigate("/address")}
                  className="gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>

              <div className="space-y-2">
                <AnimatePresence>
                  {savedAddresses.map((addr) => (
                    <motion.button
                      key={addr.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => handleSelectAddress(addr)}
                      className={cn(
                        "w-full text-left p-3 rounded-xl border-2 transition-all",
                        selectedAddressId === addr.id 
                          ? "border-primary bg-primary/5" 
                          : "border-border bg-secondary/30"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{addr.label}</span>
                            {addr.is_default && (
                              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Default</span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {addr.address_line1}{addr.address_line2 && `, ${addr.address_line2}`}, {addr.city} - {addr.pincode}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">📞 {addr.phone}</p>
                        </div>
                        {selectedAddressId === addr.id && (
                          <div className="p-1.5 bg-primary rounded-full">
                            <Check className="w-4 h-4 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* New Address Form (if no saved addresses or user wants to add new) */}
          {(showNewAddressForm || savedAddresses.length === 0) && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-card rounded-2xl p-4 shadow-card space-y-4"
            >
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-full">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-foreground">
                  {savedAddresses.length > 0 ? "New Delivery Address" : "Delivery Address"}
                </h3>
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Phone Number *</label>
                <Input
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1"
                  maxLength={10}
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Flat/House No, Building Name *</label>
                <Input
                  placeholder="Flat/House No, Building Name *"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-muted-foreground">City</label>
                  <Input value={city} disabled className="mt-1 bg-secondary" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Pincode *</label>
                  <Input
                    placeholder="Pincode *"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="mt-1"
                    maxLength={6}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Delivery Frequency Section */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl p-4 shadow-card"
          >
            <h3 className="font-semibold text-foreground mb-3">Delivery Frequency</h3>
            <div className="grid grid-cols-3 gap-3">
              {frequencies.map((freq) => (
                <motion.button
                  key={freq.value}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setFrequency(freq.value)}
                  className={cn(
                    "py-3 px-2 rounded-xl font-medium transition-all text-sm flex flex-col items-center",
                    frequency === freq.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground"
                  )}
                >
                  <span>{freq.label}</span>
                  <span className="text-xs opacity-70">{freq.desc}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Start Date Section */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl p-4 shadow-card"
          >
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-foreground" />
              <h3 className="font-semibold text-foreground">Start Date</h3>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  {format(startDate, "dd MMM yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </motion.div>

          {/* Weekly Day Selection */}
          {frequency === "weekly" && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-card rounded-2xl p-4 shadow-card"
            >
              <h3 className="font-semibold text-foreground mb-3">Delivery Day</h3>
              <Select value={weeklyDay} onValueChange={setWeeklyDay}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {WEEKDAYS.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>
          )}

          {/* Pricing Summary */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="bg-primary/10 rounded-2xl p-4 border-2 border-primary/20"
          >
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Monthly Subscription</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Per delivery:</span>
                <span className="font-semibold">₹{totalPrice}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deliveries/month:</span>
                <span className="font-semibold">
                  {frequency === "daily" ? getDaysInMonth(startDate) : 
                   frequency === "alternate" ? Math.ceil(getDaysInMonth(startDate) / 2) : 4}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subscription ends:</span>
                <span className="font-semibold">{format(subscriptionEndDate, "dd MMM yyyy")}</span>
              </div>
              <div className="border-t border-primary/20 pt-2 mt-2 flex justify-between">
                <span className="font-bold text-foreground">Total Amount:</span>
                <span className="font-bold text-primary text-lg">₹{monthlyAmount}</span>
              </div>
            </div>
          </motion.div>

          {/* Wallet Payment Option */}
          {walletBalance > 0 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-card rounded-2xl p-4 shadow-card"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 rounded-full">
                    <Wallet className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Pay from Wallet</p>
                    <p className="text-xs text-muted-foreground">Balance: ₹{walletBalance}</p>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setUseWallet(!useWallet)}
                  className={cn(
                    "w-12 h-7 rounded-full transition-all relative",
                    useWallet ? "bg-primary" : "bg-secondary"
                  )}
                >
                  <motion.div
                    animate={{ x: useWallet ? 22 : 2 }}
                    className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
                  />
                </motion.button>
              </div>
              {useWallet && walletBalance < monthlyAmount && (
                <p className="text-xs text-destructive mt-2">
                  Insufficient balance. Need ₹{monthlyAmount - walletBalance} more.
                </p>
              )}
            </motion.div>
          )}

          {/* Referral Code */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="bg-card rounded-2xl p-4 shadow-card"
          >
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-5 h-5 text-foreground" />
              <h3 className="font-semibold text-foreground">Referral Code (Optional)</h3>
            </div>
            <Input
              placeholder="Enter referral code"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
            />
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-elevated z-50"
        >
          <div className="max-w-lg mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Monthly</p>
                <p className="text-2xl font-bold text-foreground">₹{monthlyAmount}</p>
              </div>
              <Button
                size="lg"
                className="px-8 h-12 rounded-xl text-base font-semibold"
                onClick={handlePayment}
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : "Pay Now"}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

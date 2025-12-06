import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Calendar, Wallet, Tag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    Razorpay: any;
  }
}

type FrequencyType = "daily" | "alternate" | "weekly";

export const SubscriptionPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Hyderabad");
  const [pincode, setPincode] = useState("");
  const [frequency, setFrequency] = useState<FrequencyType>("daily");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [referralCode, setReferralCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [useWallet, setUseWallet] = useState(false);
  const [walletBalance] = useState(0);

  const community = localStorage.getItem("selectedCommunity") || "";

  const frequencies: { value: FrequencyType; label: string }[] = [
    { value: "daily", label: "Daily" },
    { value: "alternate", label: "Alternate Days" },
    { value: "weekly", label: "Weekly" },
  ];

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
      if (useWallet && walletBalance >= totalPrice) {
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
              startDate: format(startDate, "yyyy-MM-dd")
            })),
            total_amount: totalPrice,
            payment_status: "completed",
            order_status: "subscription_active"
          });

        if (subError) throw subError;

        toast({ title: "Subscription Created!", description: "Payment completed using wallet balance." });
        clearCart();
        navigate("/account");
        return;
      }

      // Create order in database
      const { data: orderData, error: orderError } = await supabase
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
            startDate: format(startDate, "yyyy-MM-dd")
          })),
          total_amount: totalPrice,
          payment_status: "pending",
          order_status: "pending"
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create Razorpay order
      const { data: razorpayData, error: razorpayError } = await supabase.functions.invoke("create-razorpay-order", {
        body: { amount: totalPrice, receipt: orderData.id }
      });

      if (razorpayError) throw razorpayError;

      const options = {
        key: razorpayData.keyId,
        amount: razorpayData.amount,
        currency: razorpayData.currency,
        name: "EggPro",
        description: `${frequency.charAt(0).toUpperCase() + frequency.slice(1)} Subscription`,
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
                customerName: user.email || "Customer",
                items: items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
                totalAmount: totalPrice
              }
            });

            if (verifyError) throw verifyError;

            // Update order status for subscription
            await supabase
              .from("orders")
              .update({ order_status: "subscription_active" })
              .eq("id", orderData.id);

            // Handle referral reward on first payment
            if (referralCode) {
              const { data: referral } = await supabase
                .from("referrals")
                .select("*")
                .eq("referred_id", user.id)
                .eq("status", "pending")
                .single();

              if (referral) {
                // Mark referral as completed
                await supabase
                  .from("referrals")
                  .update({ status: "completed", completed_at: new Date().toISOString() })
                  .eq("id", referral.id);

                // Add rewards to both wallets via transactions
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
          {/* Delivery Address Section */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-card rounded-2xl p-4 shadow-card space-y-4"
          >
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-full">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-foreground">Delivery Address</h3>
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
                    "py-3 px-2 rounded-xl font-medium transition-all text-sm",
                    frequency === freq.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground"
                  )}
                >
                  {freq.label}
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
                  {format(startDate, "MM/dd/yyyy")}
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

          {/* Wallet Payment Option */}
          {walletBalance > 0 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="bg-card rounded-2xl p-4 shadow-card"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 rounded-full">
                    <Wallet className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Use Wallet Balance</h3>
                    <p className="text-sm text-muted-foreground">Available: ₹{walletBalance}</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={useWallet}
                  onChange={(e) => setUseWallet(e.target.checked)}
                  className="w-5 h-5 accent-primary"
                />
              </div>
            </motion.div>
          )}

          {/* Referral Code Section */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-purple-50 rounded-2xl p-4"
          >
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-full">
                <Tag className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Referral Code (Optional)</h3>
                <Input
                  placeholder="Enter code"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  className="mt-2 bg-card"
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 z-20"
        >
          <div className="max-w-lg mx-auto">
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 text-lg font-semibold rounded-xl"
              onClick={handlePayment}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Pay Now"}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

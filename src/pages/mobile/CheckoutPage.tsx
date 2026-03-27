import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MapPin, Wallet, Tag, Info, Plus, Check, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

declare global {
  interface Window {
    Razorpay: any;
  }
}

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

export const CheckoutPage = () => {
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
  const [referralCode, setReferralCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [useWallet, setUseWallet] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [showSaveAddressDialog, setShowSaveAddressDialog] = useState(false);
  const [addressLabel, setAddressLabel] = useState("Home");
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [communities, setCommunities] = useState<{ id: string; name: string; city: string; pincode: string | null }[]>([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState("");

  const community = localStorage.getItem("selectedCommunity") || "";

  // Fetch saved addresses, wallet balance, and communities
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

      // Fetch communities for dropdown
      const { data: comms } = await supabase
        .from("communities")
        .select("id, name, city, pincode")
        .eq("is_active", true)
        .order("name");
      if (comms) {
        setCommunities(comms);
        // Auto-select the user's current community
        const currentComm = comms.find(c => c.name === community);
        if (currentComm) {
          setSelectedCommunityId(currentComm.id);
          setCity(currentComm.city);
          setPincode(currentComm.pincode || "");
        }
      }

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

  const handleSelectAddress = (addr: SavedAddress) => {
    setSelectedAddressId(addr.id);
    setPhone(addr.phone);
    setAddress(`${addr.address_line1}${addr.address_line2 ? ', ' + addr.address_line2 : ''}`);
    setCity(addr.city);
    setPincode(addr.pincode);
    setShowNewAddressForm(false);
  };

  const saveNewAddress = async () => {
    if (!user || isSavingAddress) return;
    setIsSavingAddress(true);
    try {
      const { data: newAddr } = await supabase.from("user_addresses").insert({
        user_id: user.id,
        label: addressLabel,
        phone,
        address_line1: address,
        city,
        pincode,
        is_default: savedAddresses.length === 0,
      }).select().single();
      
      if (newAddr) {
        setSavedAddresses(prev => [...prev, newAddr as SavedAddress]);
        setSelectedAddressId(newAddr.id);
        setShowNewAddressForm(false);
      }
      toast({ title: "Address saved!", description: "Your address has been saved for future orders." });
    } catch (e) {
      console.error("Save address error:", e);
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handlePayment = async () => {
    if (!user) {
      toast({ title: "Please login", description: "You need to login to place order" });
      navigate("/auth");
      return;
    }
    if (!phone || !address || !pincode) {
      toast({ title: "Missing details", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    // If entering a new address, prompt to save first
    const isNewAddress = showNewAddressForm || savedAddresses.length === 0;
    const isAlreadySaved = selectedAddressId && !showNewAddressForm;
    if (isNewAddress && !isAlreadySaved) {
      setShowSaveAddressDialog(true);
      return;
    }
    setIsProcessing(true);

    try {
      // If wallet has enough balance and user wants to use it
      if (useWallet && walletBalance >= totalPrice) {
        // Deduct from wallet
        const newBalance = walletBalance - totalPrice;
        await supabase
          .from("profiles")
          .update({ wallet_balance: newBalance })
          .eq("id", user.id);

        // Add wallet transaction
        await supabase
          .from("wallet_transactions")
          .insert({
            user_id: user.id,
            amount: totalPrice,
            type: "debit",
            description: "One-time Order Payment"
          });

        const { error: orderError } = await supabase
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
              isOneTime: true
            })),
            total_amount: totalPrice,
            payment_status: "completed",
            order_status: "confirmed"
          });

        if (orderError) throw orderError;

        toast({ title: "Order Placed!", description: "Payment completed using wallet balance." });
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
            isOneTime: true
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
        description: "One-time Order",
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
                totalAmount: totalPrice
              }
            });

            if (verifyError) throw verifyError;

            // Referral rewards are now handled server-side in verify-payment

            toast({ title: "Order Placed!", description: "Your order has been confirmed. Delivery in 1-3 days." });
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
          className="bg-primary px-4 py-4 flex items-center gap-3 safe-top"
        >
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-card/20"
          >
            <ArrowLeft className="w-5 h-5 text-primary-foreground" />
          </motion.button>
          <h1 className="text-lg font-semibold text-primary-foreground">Checkout</h1>
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
                  onClick={() => navigate("/addresses")}
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

          {/* New Address Form */}
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

              <div>
                <label className="text-sm text-muted-foreground">Community *</label>
                <Select value={selectedCommunityId} onValueChange={(val) => {
                  setSelectedCommunityId(val);
                  const comm = communities.find(c => c.id === val);
                  if (comm) {
                    setCity(comm.city);
                    setPincode(comm.pincode || "");
                  }
                }}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select community" />
                  </SelectTrigger>
                  <SelectContent>
                    {communities.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-muted-foreground">City</label>
                  <Input value={city} disabled className="mt-1 bg-secondary" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Pincode</label>
                  <Input value={pincode} disabled className="mt-1 bg-secondary" />
                </div>
              </div>
            </motion.div>
          )}

          {/* Delivery Info */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-green-50 rounded-2xl p-4 flex items-center gap-3 border border-green-200"
          >
            <div className="p-2.5 bg-green-100 rounded-xl flex-shrink-0">
              <Truck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-green-800">Delivery in 1-3 Days</p>
              <p className="text-sm text-green-600">Your order will be delivered between 6 AM - 9 AM</p>
            </div>
          </motion.div>

          {/* Order Summary */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="bg-primary/10 rounded-2xl p-4 border-2 border-primary/20"
          >
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Order Summary</h3>
            </div>
            <div className="space-y-2 text-sm">
              {items.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-muted-foreground">{item.name} ({item.packSize} eggs) × {item.quantity}</span>
                  <span className="font-semibold">₹{item.price * item.quantity}</span>
                </div>
              ))}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery:</span>
                <span className="font-semibold text-green-600">FREE</span>
              </div>
              <div className="border-t border-primary/20 pt-2 mt-2 flex justify-between">
                <span className="font-bold text-foreground">Total Amount:</span>
                <span className="font-bold text-primary text-lg">₹{totalPrice}</span>
              </div>
            </div>
          </motion.div>

          {/* Wallet Payment Option */}
          {walletBalance > 0 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
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
              {useWallet && walletBalance < totalPrice && (
                <p className="text-xs text-destructive mt-2">
                  Insufficient balance. Need ₹{totalPrice - walletBalance} more.
                </p>
              )}
            </motion.div>
          )}

          {/* Referral Code */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
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
          className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-elevated z-50 safe-bottom"
        >
          <div className="max-w-lg mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold text-foreground">₹{totalPrice}</p>
              </div>
              <Button
                id="pay-now-btn"
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

      {/* Save Address Dialog */}
      <AlertDialog open={showSaveAddressDialog} onOpenChange={setShowSaveAddressDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save this address?</AlertDialogTitle>
            <AlertDialogDescription>
              Would you like to save this address for future orders?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <label className="text-sm text-muted-foreground">Label</label>
            <Input
              value={addressLabel}
              onChange={(e) => setAddressLabel(e.target.value)}
              placeholder="e.g. Home, Office"
              className="mt-1"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowSaveAddressDialog(false);
              setSelectedAddressId("skip");
              // Use requestAnimationFrame to ensure dialog fully closes first
              requestAnimationFrame(() => {
                setTimeout(() => {
                  const btn = document.getElementById("pay-now-btn");
                  btn?.click();
                }, 200);
              });
            }}>
              No, just pay
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isSavingAddress}
              onClick={async (e) => {
                e.preventDefault();
                await saveNewAddress();
                setShowSaveAddressDialog(false);
                requestAnimationFrame(() => {
                  setTimeout(() => {
                    const btn = document.getElementById("pay-now-btn");
                    btn?.click();
                  }, 200);
                });
              }}
            >
              {isSavingAddress ? "Saving..." : "Save & Pay"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

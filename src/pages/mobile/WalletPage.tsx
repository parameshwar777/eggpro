import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Wallet, Plus, DollarSign, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MobileLayout } from "@/components/mobile/MobileLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const quickAmounts = [100, 200, 500, 1000];

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
}

export const WalletPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWalletData();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const fetchWalletData = async () => {
    if (!user) return;
    
    // Fetch balance
    const { data: profile } = await supabase
      .from("profiles")
      .select("wallet_balance")
      .eq("id", user.id)
      .single();
    
    setBalance(profile?.wallet_balance || 0);

    // Fetch transactions
    const { data: txns } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    setTransactions(txns || []);
    setIsLoading(false);
  };

  const handleAddMoney = async () => {
    const amount = selectedAmount || parseInt(customAmount);
    if (!amount || amount < 10) {
      toast({ title: "Invalid amount", description: "Minimum amount is ₹10", variant: "destructive" });
      return;
    }

    if (!user) {
      toast({ title: "Please login", description: "You need to login to add money" });
      navigate("/auth");
      return;
    }

    setIsProcessing(true);

    try {
      // Create Razorpay order
      const { data: razorpayData, error: razorpayError } = await supabase.functions.invoke("create-razorpay-order", {
        body: { amount, receipt: `wallet_${user.id}_${Date.now()}` }
      });

      if (razorpayError) throw razorpayError;

      const options = {
        key: razorpayData.keyId,
        amount: razorpayData.amount,
        currency: razorpayData.currency,
        name: "EggPro",
        description: "Wallet Recharge",
        order_id: razorpayData.orderId,
        handler: async (response: any) => {
          try {
            // Add money to wallet
            const newBalance = balance + amount;
            
            // Update balance
            const { error: updateError } = await supabase
              .from("profiles")
              .update({ wallet_balance: newBalance })
              .eq("id", user.id);

            if (updateError) throw updateError;

            // Add transaction record
            const { error: txnError } = await supabase
              .from("wallet_transactions")
              .insert({
                user_id: user.id,
                amount: amount,
                type: "credit",
                description: "Wallet Recharge",
                reference_id: response.razorpay_payment_id
              });

            if (txnError) throw txnError;

            setBalance(newBalance);
            toast({ title: "Success!", description: `₹${amount} added to wallet` });
            setShowAddMoney(false);
            setSelectedAmount(null);
            setCustomAmount("");
            fetchWalletData();
          } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
          }
        },
        prefill: {
          email: user.email
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

  return (
    <MobileLayout hideNav>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-primary/10 px-4 py-3 flex items-center gap-3"
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-card shadow-soft"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </motion.button>
        <h1 className="text-base sm:text-lg font-semibold text-foreground">Wallet</h1>
      </motion.div>

      {!user ? (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="p-4"
        >
          <div className="bg-card rounded-2xl p-8 shadow-card flex flex-col items-center">
            <Wallet className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4 text-center">Please login to view your wallet</p>
            <Button onClick={() => navigate("/auth")}>Login</Button>
          </div>
        </motion.div>
      ) : (
        <>
          {/* Balance Card */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mx-4 mt-4 bg-primary rounded-2xl p-4 sm:p-6 shadow-elevated"
          >
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground/80" />
              <span className="text-primary-foreground/80 text-sm">Available Balance</span>
            </div>
            <motion.h2
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              className="text-3xl sm:text-4xl font-bold text-primary-foreground"
            >
              ₹{balance}
            </motion.h2>
            <Button
              variant="secondary"
              className="w-full mt-4 bg-card text-foreground hover:bg-card/90"
              onClick={() => setShowAddMoney(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Money
            </Button>
          </motion.div>

          {/* Quick Add */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="px-4 mt-4 flex gap-2"
          >
            {quickAmounts.map((amount, i) => (
              <motion.button
                key={amount}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSelectedAmount(amount);
                  setShowAddMoney(true);
                }}
                className="flex-1 py-2.5 sm:py-3 bg-card rounded-xl shadow-card text-xs sm:text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                +₹{amount}
              </motion.button>
            ))}
          </motion.div>

          {/* Transaction History */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="px-4 mt-6"
          >
            <h3 className="font-semibold text-foreground mb-4 text-sm sm:text-base">Transaction History</h3>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="bg-card rounded-2xl p-6 sm:p-8 shadow-card flex flex-col items-center">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="text-4xl sm:text-5xl mb-3"
                >
                  💰
                </motion.div>
                <p className="text-muted-foreground text-sm">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {transactions.map((txn, i) => (
                    <motion.div
                      key={txn.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-card rounded-xl p-4 shadow-card flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${txn.type === "credit" ? "bg-green-100" : "bg-red-100"}`}>
                          {txn.type === "credit" ? (
                            <ArrowDownLeft className="w-4 h-4 text-green-600" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">{txn.description || "Transaction"}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(txn.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <p className={`font-bold ${txn.type === "credit" ? "text-green-600" : "text-red-600"}`}>
                        {txn.type === "credit" ? "+" : "-"}₹{txn.amount}
                      </p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </>
      )}

      {/* Add Money Dialog */}
      <Dialog open={showAddMoney} onOpenChange={setShowAddMoney}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-sm mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add Money to Wallet</DialogTitle>
          </DialogHeader>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="py-4 space-y-4"
          >
            <div className="flex justify-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary rounded-2xl flex items-center justify-center">
                <Wallet className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground" />
              </div>
            </div>

            {/* Quick Amount Selection */}
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => {
                    setSelectedAmount(amount);
                    setCustomAmount("");
                  }}
                  className={`py-3 rounded-xl font-medium text-sm transition-all ${
                    selectedAmount === amount
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground"
                  }`}
                >
                  ₹{amount}
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            <div>
              <label className="text-sm text-muted-foreground">Or enter custom amount</label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedAmount(null);
                }}
                className="mt-1"
              />
            </div>

            {(selectedAmount || customAmount) && (
              <div className="bg-secondary/50 rounded-xl p-3 text-center">
                <p className="text-sm text-muted-foreground">Amount to add</p>
                <p className="text-2xl font-bold text-foreground">₹{selectedAmount || customAmount}</p>
              </div>
            )}

            <Button 
              className="w-full" 
              onClick={handleAddMoney}
              disabled={isProcessing || (!selectedAmount && !customAmount)}
            >
              {isProcessing ? "Processing..." : "Continue to Payment"}
            </Button>

            <p className="text-xs text-muted-foreground text-center">Secured by Razorpay</p>
          </motion.div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};

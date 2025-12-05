import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Wallet, Plus, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const quickAmounts = [100, 200, 500, 1000];

export const WalletPage = () => {
  const navigate = useNavigate();
  const [balance] = useState(0);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-primary/10 px-4 py-4 flex items-center gap-3"
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-card shadow-soft"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </motion.button>
        <h1 className="text-lg font-semibold text-foreground">Wallet</h1>
      </motion.div>

      {/* Balance Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mx-4 mt-4 bg-primary rounded-2xl p-6 shadow-elevated"
      >
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="w-5 h-5 text-primary-foreground/80" />
          <span className="text-primary-foreground/80">Available Balance</span>
        </div>
        <motion.h2
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          className="text-4xl font-bold text-primary-foreground"
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
            className="flex-1 py-3 bg-card rounded-xl shadow-card text-sm font-medium text-foreground hover:bg-secondary transition-colors"
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
        <h3 className="font-semibold text-foreground mb-4">Transaction History</h3>
        <div className="bg-card rounded-2xl p-8 shadow-card flex flex-col items-center">
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-5xl mb-3"
          >
            💰
          </motion.div>
          <p className="text-muted-foreground">No transactions yet</p>
        </div>
      </motion.div>

      {/* Add Money Dialog */}
      <Dialog open={showAddMoney} onOpenChange={setShowAddMoney}>
        <DialogContent className="max-w-sm mx-auto rounded-t-3xl">
          <DialogHeader>
            <DialogTitle>Add Money</DialogTitle>
          </DialogHeader>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="py-8 flex flex-col items-center"
          >
            <div className="w-20 h-20 bg-blue-500 rounded-2xl flex items-center justify-center mb-4">
              <DollarSign className="w-10 h-10 text-white" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">Secured By Razorpay</p>
            {selectedAmount && (
              <p className="text-2xl font-bold text-foreground mb-4">₹{selectedAmount}</p>
            )}
            <Button className="w-full" onClick={() => setShowAddMoney(false)}>
              Continue to Payment
            </Button>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

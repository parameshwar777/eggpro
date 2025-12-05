import { motion } from "framer-motion";
import { ArrowLeft, Trash2, Minus, Plus, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";

export const CartPage = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeFromCart, totalPrice } = useCart();

  return (
    <div className="min-h-screen bg-background w-full">
      <div className="max-w-lg mx-auto pb-36">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card px-4 py-3 flex items-center gap-3 border-b border-border sticky top-0 z-10"
        >
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-secondary"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <h1 className="text-base sm:text-lg font-semibold text-foreground">
            Cart ({items.length} items)
          </h1>
        </motion.div>

        {items.length === 0 ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-4"
          >
            <div className="bg-card rounded-2xl p-8 shadow-card flex flex-col items-center">
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-5xl sm:text-6xl mb-4"
              >
                🛒
              </motion.div>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">Your cart is empty</p>
              <Button onClick={() => navigate("/home")}>Start Shopping</Button>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="p-4 space-y-3">
              {items.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card rounded-2xl p-3 sm:p-4 shadow-card"
                >
                  <div className="flex gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-medium text-foreground text-sm sm:text-base truncate">{item.name}</h3>
                          <div className="flex gap-1.5 mt-1 flex-wrap">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                              {item.packSize} eggs
                            </span>
                            {item.isSubscription && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                Subscribe
                              </span>
                            )}
                          </div>
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => removeFromCart(item.id)}
                          className="p-1.5 text-destructive flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                      <div className="flex items-center justify-between mt-2.5">
                        <p className="text-base sm:text-lg font-bold text-primary">
                          ₹{item.price * item.quantity}
                        </p>
                        <div className="flex items-center gap-2 bg-secondary rounded-full p-0.5">
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1.5 rounded-full bg-card"
                          >
                            <Minus className="w-3 h-3 text-foreground" />
                          </motion.button>
                          <span className="font-medium text-foreground w-5 text-center text-sm">
                            {item.quantity}
                          </span>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1.5 rounded-full bg-card"
                          >
                            <Plus className="w-3 h-3 text-foreground" />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Delivery Info */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-green-50 rounded-2xl p-3 sm:p-4 flex items-center gap-3"
              >
                <div className="p-2 bg-green-100 rounded-xl flex-shrink-0">
                  <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-800 text-sm sm:text-base">Free Delivery</p>
                  <p className="text-xs sm:text-sm text-green-600">Delivered between 6 AM - 9 AM</p>
                </div>
              </motion.div>
            </div>

            {/* Bottom Bar */}
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-card border-t border-border p-4 z-20"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Subtotal</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">₹{totalPrice}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs sm:text-sm text-muted-foreground">Delivery</p>
                  <p className="text-base sm:text-lg font-bold text-green-600">FREE</p>
                </div>
              </div>
              <Button className="w-full" size="lg">
                Proceed to Checkout
              </Button>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Star, Leaf, Shield, Zap, Minus, Plus, ArrowRight } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { toast } from "@/hooks/use-toast";

const products: Record<string, any> = {
  "1": {
    id: "1",
    name: "Premium White Eggs",
    description: "Farm fresh white eggs from free-range hens. Nature's immunity boosters packed with protein, vitamins & minerals.",
    image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600",
    prices: { 6: { buy: 78, subscribe: 62 }, 12: { buy: 156, subscribe: 125 }, 30: { buy: 390, subscribe: 312 } },
    rating: 4.8,
    reviews: 128,
    features: ["Farm Fresh", "FSSAI Certified", "Protein Rich"],
    nutrition: { calories: 140, protein: "13.5g", calcium: "50mg", iron: "1mg" },
  },
  "2": {
    id: "2",
    name: "Premium Brown Eggs",
    description: "Premium brown eggs with enhanced nutritional value. Rich in protein and essential vitamins.",
    image: "https://images.unsplash.com/photo-1569288052389-dac9b0ac9eac?w=600",
    prices: { 6: { buy: 96, subscribe: 77 }, 12: { buy: 192, subscribe: 154 }, 30: { buy: 480, subscribe: 384 } },
    rating: 4.8,
    reviews: 96,
    features: ["Premium Quality", "FSSAI Certified", "Protein Rich"],
    nutrition: { calories: 155, protein: "14g", calcium: "55mg", iron: "1.2mg" },
  },
  "3": {
    id: "3",
    name: "Cage Free Premium Brown Eggs",
    description: "Cage-free premium brown eggs from humanely raised hens. Superior taste and nutrition.",
    image: "https://images.unsplash.com/photo-1598965675045-45c5e72c7d05?w=600",
    prices: { 6: { buy: 132, subscribe: 106 }, 12: { buy: 264, subscribe: 211 }, 30: { buy: 660, subscribe: 528 } },
    rating: 4.9,
    reviews: 74,
    features: ["Cage Free", "FSSAI Certified", "Humanely Raised"],
    nutrition: { calories: 160, protein: "14.5g", calcium: "52mg", iron: "1.3mg" },
  },
  "4": {
    id: "4",
    name: "Organic Country Eggs",
    description: "Traditional organic country eggs from native hens. Rich flavor and superior nutrition.",
    image: "https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=600",
    prices: { 6: { buy: 180, subscribe: 144 }, 12: { buy: 360, subscribe: 288 } },
    rating: 4.9,
    reviews: 52,
    features: ["Organic", "FSSAI Certified", "Native Hens"],
    nutrition: { calories: 165, protein: "15g", calcium: "58mg", iron: "1.5mg" },
  },
};

export const ProductDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addToCart } = useCart();
  
  const product = products[id || "1"];
  
  // Handle invalid product ID
  if (!product) {
    return (
      <div className="min-h-[100dvh] bg-background w-full flex flex-col items-center justify-center">
        <p className="text-muted-foreground mb-4">Product not found</p>
        <Button onClick={() => navigate("/home")}>Back to Home</Button>
      </div>
    );
  }
  
  const packSizes = Object.keys(product.prices).map(Number);
  
  const [selectedPack, setSelectedPack] = useState(packSizes[0]);
  const [isSubscription, setIsSubscription] = useState(true);
  const [quantity, setQuantity] = useState(1);

  const currentPrice = product.prices[selectedPack];
  const finalPrice = isSubscription ? currentPrice.subscribe : currentPrice.buy;
  const savings = currentPrice.buy - currentPrice.subscribe;
  const discountPercent = Math.round((savings / currentPrice.buy) * 100);

  const handleProceedToCheckout = () => {
    addToCart({
      id: `${product.id}-${selectedPack}-${isSubscription ? 's' : 'b'}`,
      name: product.name,
      image: product.image,
      price: finalPrice,
      originalPrice: currentPrice.buy,
      packSize: selectedPack,
      isSubscription,
    });
    toast({ title: "Added to cart!", description: `${product.name} (${selectedPack} eggs)` });
    navigate("/subscription");
  };

  return (
    <div className="min-h-[100dvh] bg-background w-full flex flex-col">
      <div className="max-w-lg mx-auto w-full flex-1 flex flex-col">
        {/* Header with gradient */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="gradient-warm px-4 pt-4 pb-2"
        >
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-full bg-card shadow-soft"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
        </motion.div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto pb-32">
          {/* Product Image */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mx-4 rounded-2xl overflow-hidden shadow-elevated bg-card"
          >
            <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
          </motion.div>

          {/* Content */}
          <div className="px-4 mt-5 space-y-5">
            {/* Title & Rating */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-start justify-between gap-3"
            >
              <div className="flex-1">
                <h1 className="text-xl font-bold text-foreground">{product.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < Math.floor(product.rating) ? "fill-amber-400 text-amber-400" : "text-muted"}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {product.rating} ({product.reviews} reviews)
                  </span>
                </div>
              </div>
              <Badge className="bg-green-500 text-white px-3 py-1 text-sm">{discountPercent}% OFF</Badge>
            </motion.div>

            {/* Description */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-sm text-muted-foreground leading-relaxed"
            >
              {product.description}
            </motion.p>

            {/* Features */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex gap-2 flex-wrap"
            >
              {product.features.map((feature: string, i: number) => (
                <div
                  key={feature}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-green-200 bg-green-50 text-green-700"
                >
                  {i === 0 && <Leaf className="w-4 h-4" />}
                  {i === 1 && <Shield className="w-4 h-4" />}
                  {i === 2 && <Zap className="w-4 h-4" />}
                  <span className="text-sm font-medium">{feature}</span>
                </div>
              ))}
            </motion.div>

            {/* Pack Size */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25 }}
            >
              <p className="font-semibold text-foreground mb-3">Select Pack Size</p>
              <div className="flex gap-3">
                {packSizes.map((size) => (
                  <motion.button
                    key={size}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedPack(size)}
                    className={`flex-1 py-4 rounded-xl border-2 transition-all ${
                      selectedPack === size
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card"
                    }`}
                  >
                    <p className="text-2xl font-bold text-foreground">{size}</p>
                    <p className="text-xs text-muted-foreground">eggs</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Purchase Option */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <p className="font-semibold text-foreground mb-3">Choose Option</p>
              <div className="grid grid-cols-2 gap-3">
                {/* Buy Once */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsSubscription(false)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    !isSubscription ? "border-primary bg-card" : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${!isSubscription ? "border-primary" : "border-muted-foreground"}`}>
                      {!isSubscription && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                    <span className="font-medium text-foreground">Buy Once</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">₹{currentPrice.buy}</p>
                </motion.button>

                {/* Subscribe */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsSubscription(true)}
                  className={`p-4 rounded-xl border-2 relative transition-all text-left ${
                    isSubscription ? "border-primary bg-primary/5" : "border-border bg-card"
                  }`}
                >
                  <Badge className="absolute -top-2.5 right-2 bg-green-500 text-white text-xs px-2">
                    BEST VALUE
                  </Badge>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSubscription ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                      {isSubscription && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                    </div>
                    <span className="font-medium text-foreground">Subscribe</span>
                  </div>
                  <p className="text-2xl font-bold text-primary">₹{currentPrice.subscribe}</p>
                </motion.button>
              </div>
            </motion.div>

            {/* Quantity */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="flex items-center justify-between py-4 border-y border-border"
            >
              <p className="font-semibold text-foreground">Quantity</p>
              <div className="flex items-center gap-4">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
                >
                  <Minus className="w-5 h-5 text-foreground" />
                </motion.button>
                <span className="text-xl font-bold text-foreground w-8 text-center">{quantity}</span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-full bg-primary flex items-center justify-center"
                >
                  <Plus className="w-5 h-5 text-primary-foreground" />
                </motion.button>
              </div>
            </motion.div>

            {/* Nutrition */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <p className="font-semibold text-foreground mb-3">Nutrition per 2 eggs (100g)</p>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(product.nutrition).map(([key, value]) => (
                  <div key={key} className="text-center py-3 px-2 bg-secondary/50 rounded-xl">
                    <p className="text-sm font-bold text-primary">{value as string}</p>
                    <p className="text-xs text-muted-foreground capitalize mt-0.5">{key}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom Bar - Fixed */}
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-elevated z-50"
        >
          <div className="max-w-lg mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-foreground">₹{finalPrice * quantity}</span>
                  {isSubscription && (
                    <span className="text-sm text-muted-foreground line-through">
                      ₹{currentPrice.buy * quantity}
                    </span>
                  )}
                </div>
                {isSubscription && (
                  <p className="text-sm text-green-600 font-medium">You save ₹{savings * quantity}</p>
                )}
              </div>
              <Button 
                size="lg" 
                className="px-6 h-12 rounded-xl text-base font-semibold"
                onClick={handleProceedToCheckout}
              >
                Proceed to Checkout
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

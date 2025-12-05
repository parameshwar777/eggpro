import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Star, Leaf, Shield, Zap, Minus, Plus } from "lucide-react";
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
    prices: { 6: { price: 62, original: 78 }, 12: { price: 118, original: 148 }, 30: { price: 280, original: 350 } },
    rating: 4.8,
    reviews: 128,
    features: ["Farm Fresh", "FSSAI Certified", "Protein Rich"],
    nutrition: { calories: 140, protein: "13.5g", calcium: "50mg", iron: "1mg" },
  },
  "2": {
    id: "2",
    name: "Premium Brown Eggs",
    description: "Organic brown eggs with enhanced nutritional value. Rich in Omega-3 and essential vitamins.",
    image: "https://images.unsplash.com/photo-1569288052389-dac9b0ac9eac?w=600",
    prices: { 6: { price: 77, original: 96 }, 12: { price: 145, original: 182 }, 30: { price: 345, original: 430 } },
    rating: 4.8,
    reviews: 96,
    features: ["Organic", "FSSAI Certified", "Omega-3 Rich"],
    nutrition: { calories: 155, protein: "14g", calcium: "55mg", iron: "1.2mg" },
  },
  "3": {
    id: "3",
    name: "Country Eggs",
    description: "Traditional country eggs from native hens. Rich flavor and nutrition.",
    image: "https://images.unsplash.com/photo-1598965675045-45c5e72c7d05?w=600",
    prices: { 6: { price: 89, original: 110 }, 12: { price: 168, original: 210 } },
    rating: 4.9,
    reviews: 74,
    features: ["Native Hens", "FSSAI Certified", "Traditional"],
    nutrition: { calories: 160, protein: "14.5g", calcium: "52mg", iron: "1.3mg" },
  },
};

export const ProductDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addToCart } = useCart();
  
  const product = products[id || "1"];
  const packSizes = Object.keys(product.prices).map(Number);
  
  const [selectedPack, setSelectedPack] = useState(packSizes[0]);
  const [isSubscription, setIsSubscription] = useState(true);
  const [quantity, setQuantity] = useState(1);

  const currentPrice = product.prices[selectedPack];
  const finalPrice = isSubscription ? currentPrice.price : currentPrice.original;
  const savings = currentPrice.original - currentPrice.price;

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      image: product.image,
      price: finalPrice,
      originalPrice: currentPrice.original,
      packSize: selectedPack,
      isSubscription,
    });
    toast({ title: "Added to cart!", description: `${product.name} (${selectedPack} eggs)` });
  };

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="gradient-warm px-4 py-4"
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-card shadow-soft"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </motion.button>
      </motion.div>

      {/* Product Image */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-card mx-4 -mt-2 rounded-2xl overflow-hidden shadow-elevated"
      >
        <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
      </motion.div>

      {/* Content */}
      <div className="px-4 mt-4 space-y-4">
        {/* Title & Rating */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-start justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < Math.floor(product.rating) ? "fill-primary text-primary" : "text-muted"}`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {product.rating} ({product.reviews} reviews)
              </span>
            </div>
          </div>
          <Badge className="bg-green-500 text-white">20% OFF</Badge>
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-muted-foreground"
        >
          {product.description}
        </motion.p>

        {/* Features */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2 overflow-x-auto pb-2"
        >
          {product.features.map((feature: string, i: number) => (
            <div
              key={feature}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-green-700 whitespace-nowrap"
            >
              {i === 0 && <Leaf className="w-4 h-4" />}
              {i === 1 && <Shield className="w-4 h-4" />}
              {i === 2 && <Zap className="w-4 h-4" />}
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </motion.div>

        {/* Pack Size */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="bg-card rounded-2xl p-4 shadow-card"
        >
          <p className="font-medium text-foreground mb-3">Select Pack Size</p>
          <div className="flex gap-3">
            {packSizes.map((size) => (
              <motion.button
                key={size}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedPack(size)}
                className={`flex-1 py-4 rounded-xl border-2 transition-all ${
                  selectedPack === size
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <p className="text-2xl font-bold text-foreground">{size}</p>
                <p className="text-sm text-muted-foreground">eggs</p>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Purchase Option */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl p-4 shadow-card"
        >
          <p className="font-medium text-foreground mb-3">Choose Option</p>
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsSubscription(false)}
              className={`p-4 rounded-xl border-2 transition-all ${
                !isSubscription ? "border-primary" : "border-border"
              }`}
            >
              <div className="w-5 h-5 rounded-full border-2 border-current mx-auto mb-2" />
              <p className="font-medium text-foreground">Buy Once</p>
              <p className="text-lg font-bold text-foreground">₹{currentPrice.original}</p>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsSubscription(true)}
              className={`p-4 rounded-xl border-2 relative transition-all ${
                isSubscription ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <Badge className="absolute -top-2 right-2 bg-green-500 text-white text-xs">
                BEST VALUE
              </Badge>
              <div className={`w-5 h-5 rounded-full border-2 mx-auto mb-2 ${isSubscription ? "bg-primary border-primary" : "border-current"}`}>
                {isSubscription && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-full h-full rounded-full bg-primary flex items-center justify-center">
                  <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                </motion.div>}
              </div>
              <p className="font-medium text-foreground">Subscribe</p>
              <p className="text-lg font-bold text-primary">₹{currentPrice.price}</p>
            </motion.button>
          </div>
        </motion.div>

        {/* Quantity */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="bg-card rounded-2xl p-4 shadow-card flex items-center justify-between"
        >
          <p className="font-medium text-foreground">Quantity</p>
          <div className="flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-2 rounded-full bg-secondary"
            >
              <Minus className="w-4 h-4 text-foreground" />
            </motion.button>
            <span className="text-xl font-bold text-foreground w-8 text-center">{quantity}</span>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setQuantity(quantity + 1)}
              className="p-2 rounded-full bg-primary text-primary-foreground"
            >
              <Plus className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>

        {/* Nutrition */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl p-4 shadow-card"
        >
          <p className="font-medium text-foreground mb-3">Nutrition per 2 eggs (100g)</p>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(product.nutrition).map(([key, value]) => (
              <div key={key} className="text-center p-2 bg-secondary rounded-lg">
                <p className="text-sm font-semibold text-primary">{value as string}</p>
                <p className="text-xs text-muted-foreground capitalize">{key}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom Bar */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 max-w-md mx-auto"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">₹{finalPrice * quantity}</span>
              {isSubscription && (
                <span className="text-sm text-muted-foreground line-through">
                  ₹{currentPrice.original * quantity}
                </span>
              )}
            </div>
            {isSubscription && (
              <p className="text-sm text-green-600 font-medium">You save ₹{savings * quantity}</p>
            )}
          </div>
          <Button size="lg" className="px-8" onClick={handleAddToCart}>
            <Plus className="w-4 h-4 mr-2" />
            Add to Cart
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

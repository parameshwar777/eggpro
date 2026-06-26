import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Star, Leaf, Shield, Zap, Minus, Plus, ShoppingCart, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DBProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  buy_once_price: number | null;
  unit: string | null;
  image_url: string | null;
  in_stock: boolean | null;
}

// Feature mappings for product types
const productFeatures: Record<string, string[]> = {
  "Premium White Eggs": ["Farm Fresh", "FSSAI Certified", "Protein Rich"],
  "Premium Brown Eggs": ["Premium Quality", "FSSAI Certified", "Protein Rich"],
  "Cage Free Premium Brown Eggs": ["Cage Free", "FSSAI Certified", "Humanely Raised"],
  "Organic Country Eggs": ["Organic", "FSSAI Certified", "Native Hens"],
};

const productNutrition: Record<string, { calories: number; protein: string; calcium: string; iron: string }> = {
  "Premium White Eggs": { calories: 140, protein: "13.5g", calcium: "50mg", iron: "1mg" },
  "Premium Brown Eggs": { calories: 155, protein: "14g", calcium: "55mg", iron: "1.2mg" },
  "Cage Free Premium Brown Eggs": { calories: 160, protein: "14.5g", calcium: "52mg", iron: "1.3mg" },
  "Organic Country Eggs": { calories: 165, protein: "15g", calcium: "58mg", iron: "1.5mg" },
};

export const ProductDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addToCart, items, updateQuantity, removeFromCart } = useCart();
  const { user } = useAuth();
  
  const [variants, setVariants] = useState<DBProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPack, setSelectedPack] = useState<number>(12);
  const [isSubscription, setIsSubscription] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showSubscriptions, setShowSubscriptions] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      try {
        // First fetch the clicked product to get its name
        const { data: clickedProduct, error: clickedError } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        
        if (clickedError) throw clickedError;
        
        if (!clickedProduct) {
          setIsLoading(false);
          return;
        }

        // Then fetch all variants with the same name
        const { data: allVariants, error: variantsError } = await supabase
          .from("products")
          .select("*")
          .eq("name", clickedProduct.name)
          .eq("in_stock", true)
          .order("price");
        
        if (variantsError) throw variantsError;
        
        // Show every variant the admin has published
        const eligibleVariants = allVariants || [];
        setVariants(eligibleVariants);

        // Set initial selected pack based on first available variant
        if (eligibleVariants.length > 0) {
          const firstPackSize = parseInt(eligibleVariants[0].unit?.replace(/\D/g, '') || '12');
          setSelectedPack(firstPackSize);
        }

      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProduct();
  }, [id]);

  useEffect(() => {
    const fetchSubSetting = async () => {
      const { data } = await supabase
        .from("admin_settings")
        .select("value")
        .eq("key", "show_subscriptions")
        .maybeSingle();
      const enabled = data?.value === "true";
      setShowSubscriptions(enabled);
      if (enabled) setIsSubscription(true);
    };
    fetchSubSetting();
  }, []);

  // Build prices object from variants
  const prices = useMemo(() => {
    const priceMap: Record<number, { buy: number; subscribe: number; original: number }> = {};
    variants.forEach((v) => {
      const packSize = parseInt(v.unit?.replace(/\D/g, '') || '12');
      priceMap[packSize] = {
        buy: v.buy_once_price || v.original_price || v.price,
        subscribe: v.price,
        original: v.original_price || v.price,
      };
    });
    return priceMap;
  }, [variants]);

  const packSizes = useMemo(() => Object.keys(prices).map(Number).sort((a, b) => a - b), [prices]);
  
  const product = useMemo(() => {
    if (variants.length === 0) return null;
    const baseVariant = variants[0];
    return {
      id: baseVariant.id,
      name: baseVariant.name,
      description: baseVariant.description || '',
      image: baseVariant.image_url || 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600',
      features: productFeatures[baseVariant.name] || ["Farm Fresh", "FSSAI Certified", "Protein Rich"],
      nutrition: productNutrition[baseVariant.name] || { calories: 140, protein: "13.5g", calcium: "50mg", iron: "1mg" },
      rating: 4.8,
      reviews: 128,
    };
  }, [variants]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-background w-full flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground mt-4">Loading product...</p>
      </div>
    );
  }
  
  // Handle invalid product ID
  if (!product || packSizes.length === 0) {
    return (
      <div className="min-h-[100dvh] bg-background w-full flex flex-col items-center justify-center">
        <p className="text-muted-foreground mb-4">Product not found</p>
        <Button onClick={() => navigate("/home")}>Back to Home</Button>
      </div>
    );
  }

  const currentPrice = prices[selectedPack] || prices[packSizes[0]];
  const finalPrice = isSubscription ? currentPrice.subscribe : currentPrice.buy;
  const discountPercent = Math.round(((currentPrice.original - finalPrice) / currentPrice.original) * 100);

  // Get variant ID for the selected pack size
  const selectedVariant = variants.find(v => parseInt(v.unit?.replace(/\D/g, '') || '0') === selectedPack);
  const variantId = selectedVariant?.id || product.id;

  // Check if item is already in cart
  const cartItemId = `${variantId}-${selectedPack}-${isSubscription ? 's' : 'b'}`;
  const isInCart = items.some(item => item.id === cartItemId);

  const handleAddToCart = () => {
    if (!user) {
      toast({ title: "Please login", description: "Login to add items to your cart" });
      navigate("/auth");
      return;
    }
    addToCart({
      id: cartItemId,
      name: product.name,
      image: product.image,
      price: finalPrice,
      originalPrice: currentPrice.buy,
      packSize: selectedPack,
      isSubscription,
    });
    toast({ title: "Added to cart!", description: `${product.name} (${selectedPack} eggs)` });
  };

  const handleViewCart = () => {
    navigate("/cart");
  };

  return (
    <div className="page-scroll bg-background w-full flex flex-col">
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
            {showSubscriptions && (
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
                  {currentPrice.buy < currentPrice.original && (
                    <p className="text-xs text-muted-foreground line-through">₹{currentPrice.original}</p>
                  )}
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
                  {currentPrice.subscribe < currentPrice.original && (
                    <p className="text-xs text-muted-foreground line-through">₹{currentPrice.original}</p>
                  )}
                </motion.button>
              </div>
            </motion.div>
            )}

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
                  {finalPrice < currentPrice.original && (
                    <span className="text-sm text-muted-foreground line-through">
                      ₹{currentPrice.original * quantity}
                    </span>
                  )}
                </div>
                {finalPrice < currentPrice.original && (
                  <p className="text-sm text-green-600 font-medium">You save ₹{(currentPrice.original - finalPrice) * quantity}</p>
                )}
              </div>
              {isInCart ? (
                <div className="flex items-center gap-3">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      const cartItem = items.find(i => i.id === cartItemId);
                      if (cartItem && cartItem.quantity <= 1) {
                        removeFromCart(cartItemId);
                      } else if (cartItem) {
                        updateQuantity(cartItemId, cartItem.quantity - 1);
                      }
                    }}
                    className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
                  >
                    <Minus className="w-5 h-5 text-foreground" />
                  </motion.button>
                  <span className="text-xl font-bold text-foreground w-8 text-center">
                    {items.find(i => i.id === cartItemId)?.quantity || 0}
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      const cartItem = items.find(i => i.id === cartItemId);
                      if (cartItem) {
                        updateQuantity(cartItemId, cartItem.quantity + 1);
                      }
                    }}
                    className="w-10 h-10 rounded-full bg-primary flex items-center justify-center"
                  >
                    <Plus className="w-5 h-5 text-primary-foreground" />
                  </motion.button>
                </div>
              ) : (
                <Button 
                  size="lg" 
                  className="px-6 h-12 rounded-xl text-base font-semibold"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

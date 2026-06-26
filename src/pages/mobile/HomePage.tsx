import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { MapPin, ShoppingCart, Leaf, Shield, Truck, ChevronRight, Zap, ChevronDown } from "lucide-react";
import { MobileLayout } from "@/components/mobile/MobileLayout";
import { ProductCard } from "@/components/mobile/ProductCard";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { EggLogo } from "@/components/EggLogo";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const features = [
  { icon: Leaf, label: "Farm Fresh" },
  { icon: Shield, label: "FSSAI" },
  { icon: Truck, label: "Free Delivery" },
];

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

interface GroupedProduct {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  originalPrice: number;
  rating: number;
  packSizes: number[];
  variantPrices: Record<number, { price: number; originalPrice: number }>;
}

export const HomePage = () => {
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedCommunity, setSelectedCommunity] = useState(
    localStorage.getItem("selectedCommunity") || "Select Community"
  );
  const [communities, setCommunities] = useState<{ id: string; name: string }[]>([]);
  const [dbProducts, setDbProducts] = useState<DBProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch communities
  useEffect(() => {
    const fetchCommunities = async () => {
      const { data } = await supabase
        .from("communities")
        .select("id, name")
        .eq("is_active", true)
        .eq("is_visible_production", true)
        .order("name");
      if (data) setCommunities(data);
    };
    fetchCommunities();
  }, []);

  const handleCommunityChange = async (communityName: string) => {
    setSelectedCommunity(communityName);
    localStorage.setItem("selectedCommunity", communityName);
    // Update profile
    if (user) {
      await supabase
        .from("profiles")
        .update({ community: communityName })
        .eq("id", user.id);
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase.from("products").select("*").eq("in_stock", true).order("name");
        if (error) throw error;
        setDbProducts(data || []);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // First-order eligibility (50% off banner)
  const [isFirstOrder, setIsFirstOrder] = useState(false);
  useEffect(() => {
    const checkFirstOrder = async () => {
      if (!user) { setIsFirstOrder(true); return; }
      const { count } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("payment_status", "completed");
      setIsFirstOrder((count || 0) === 0);
    };
    checkFirstOrder();
  }, [user]);

  // Group products by name and extract pack sizes
  const products = useMemo<GroupedProduct[]>(() => {
    const grouped = new Map<string, DBProduct[]>();

    dbProducts.forEach((product) => {
      const existing = grouped.get(product.name) || [];
      existing.push(product);
      grouped.set(product.name, existing);
    });

    return Array.from(grouped.entries()).map(([name, variants]) => {
      // Sort variants by pack size (extracted from unit)
      const sortedVariants = variants.sort((a, b) => {
        const aSize = parseInt(a.unit?.replace(/\D/g, "") || "0");
        const bSize = parseInt(b.unit?.replace(/\D/g, "") || "0");
        return aSize - bSize;
      });

      // Show every variant the admin has published (catalog is admin-driven)
      const filteredVariants = sortedVariants;
      if (filteredVariants.length === 0) return null;

      const baseVariant = filteredVariants[0];
      const packSizes = filteredVariants.map((v) => parseInt(v.unit?.replace(/\D/g, "") || "12"));

      const variantPrices: Record<number, { price: number; originalPrice: number }> = {};
      filteredVariants.forEach((v) => {
        const size = parseInt(v.unit?.replace(/\D/g, "") || "12");
        variantPrices[size] = { price: v.buy_once_price || v.price, originalPrice: v.original_price || v.price };
      });


      return {
        id: baseVariant.id,
        name: name,
        description: baseVariant.description || "",
        image: baseVariant.image_url || "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600",
        price: baseVariant.buy_once_price || baseVariant.price,
        originalPrice: baseVariant.original_price || baseVariant.price,
        rating: 4.8,
        packSizes,
        variantPrices,
      };
    }).filter((p): p is GroupedProduct => p !== null);
  }, [dbProducts]);


  return (
    <MobileLayout>
      {/* Header with gradient */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="gradient-warm px-4 pt-5 pb-8 rounded-b-[2rem]"
      >
        {/* Brand - Logo & Name + Cart */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <EggLogo size="sm" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">EggPro</h1>
              <p className="text-xs text-foreground/70">Nature's Immunity Boosters</p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate("/cart")}
            className="relative p-2.5 bg-card rounded-xl shadow-soft flex-shrink-0"
          >
            <ShoppingCart className="w-5 h-5 text-foreground" />
            {totalItems > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground text-xs rounded-full flex items-center justify-center font-bold"
              >
                {totalItems}
              </motion.span>
            )}
          </motion.button>
        </div>

        {/* Location dropdown */}
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-card/20 rounded-full backdrop-blur-sm flex-shrink-0">
            <MapPin className="w-4 h-4 text-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-foreground/70">Delivering to</p>
            <Select value={selectedCommunity} onValueChange={handleCommunityChange}>
              <SelectTrigger className="h-7 border-0 bg-transparent p-0 text-foreground font-semibold text-sm shadow-none focus:ring-0 [&>svg]:text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {communities.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Features */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2 flex-wrap"
        >
          {features.map((feature, i) => (
            <motion.div
              key={feature.label}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex items-center gap-1 bg-card/30 backdrop-blur-sm px-2.5 py-1.5 rounded-full"
            >
              <feature.icon className="w-3.5 h-3.5 text-foreground" />
              <span className="text-xs text-foreground">{feature.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* First-order offer banner */}
      {isFirstOrder && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mx-4 mt-4 p-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg flex items-center gap-3"
        >
          <div className="text-3xl">🎉</div>
          <div className="flex-1">
            <p className="font-bold text-base leading-tight">Welcome offer — 50% OFF</p>
            <p className="text-xs opacity-90 mt-0.5">Auto-applied at checkout on your first order. Limited time!</p>
          </div>
        </motion.div>
      )}

      {/* Products Section */}
      <div className="px-4 py-5">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-between mb-4"
        >
          <div>
            <h2 className="text-lg font-bold text-foreground">Fresh Eggs</h2>
            <p className="text-xs text-muted-foreground">Premium quality, delivered fresh</p>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
            <Zap className="w-3 h-3 mr-1" />
            20% OFF
          </Badge>
        </motion.div>

        <div className="space-y-3 pb-4">
          {products.map((product, i) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              description={product.description}
              image={product.image}
              price={product.price}
              originalPrice={product.originalPrice}
              rating={product.rating}
              packSizes={product.packSizes}
              variantPrices={product.variantPrices}
              delay={0.5 + i * 0.1}
            />
          ))}
        </div>
      </div>
    </MobileLayout>
  );
};

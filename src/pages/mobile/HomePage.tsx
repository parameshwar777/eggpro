import { motion } from "framer-motion";
import { MapPin, ShoppingCart, Leaf, Shield, Truck, ChevronRight, Zap } from "lucide-react";
import { MobileLayout } from "@/components/mobile/MobileLayout";
import { ProductCard } from "@/components/mobile/ProductCard";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import eggMascot from "@/assets/egg-mascot.png";

const products = [
  {
    id: "1",
    name: "Premium White Eggs",
    description: "Farm fresh white eggs from free-range hens. Nature's immunity boosters...",
    image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400",
    price: 62,
    originalPrice: 78,
    rating: 4.8,
    packSizes: [6, 12, 30],
  },
  {
    id: "2",
    name: "Premium Brown Eggs",
    description: "Premium brown eggs with enhanced nutritional value. Rich in protein...",
    image: "https://images.unsplash.com/photo-1569288052389-dac9b0ac9eac?w=400",
    price: 77,
    originalPrice: 96,
    rating: 4.8,
    packSizes: [6, 12, 30],
  },
  {
    id: "3",
    name: "Cage Free Premium Brown Eggs",
    description: "Cage-free premium brown eggs from humanely raised hens...",
    image: "https://images.unsplash.com/photo-1598965675045-45c5e72c7d05?w=400",
    price: 106,
    originalPrice: 132,
    rating: 4.9,
    packSizes: [6, 12, 30],
  },
  {
    id: "4",
    name: "Organic Country Eggs",
    description: "Traditional organic country eggs from native hens. Rich flavor...",
    image: "https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=400",
    price: 144,
    originalPrice: 180,
    rating: 4.9,
    packSizes: [6, 12],
  },
];

const features = [
  { icon: Leaf, label: "Farm Fresh" },
  { icon: Shield, label: "FSSAI" },
  { icon: Truck, label: "Free Delivery" },
];

export const HomePage = () => {
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const selectedCommunity = localStorage.getItem("selectedCommunity") || "Select Community";

  return (
    <MobileLayout>
      {/* Header with gradient */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="gradient-warm px-4 pt-5 pb-8 rounded-b-[2rem]"
      >
        {/* Location & Cart */}
        <div className="flex items-center justify-between mb-4">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-2 flex-1 min-w-0"
          >
            <div className="p-2 bg-card/20 rounded-full backdrop-blur-sm flex-shrink-0">
              <MapPin className="w-4 h-4 text-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-foreground/70">Delivering to</p>
              <p className="font-semibold text-foreground text-sm truncate">{selectedCommunity}</p>
            </div>
          </motion.div>
          <motion.button
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
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

        {/* Brand */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-3 mb-4"
        >
          <motion.img
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
            src={eggMascot}
            alt="Nutri Eggs"
            className="w-10 h-10"
          />
          <div>
            <h1 className="text-xl font-bold text-foreground">Nutri Eggs</h1>
            <p className="text-xs text-foreground/70">Nature's Immunity Boosters</p>
          </div>
        </motion.div>

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

      {/* Refer Banner */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate("/refer")}
        className="mx-4 -mt-4 bg-primary rounded-2xl p-3 shadow-elevated cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="p-2 bg-card/20 rounded-xl flex-shrink-0"
            >
              <Zap className="w-5 h-5 text-primary-foreground" />
            </motion.div>
            <div className="min-w-0">
              <p className="font-semibold text-primary-foreground text-sm">Refer & Earn ₹20</p>
              <p className="text-xs text-primary-foreground/80 truncate">Friends get ₹40 off first order</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-primary-foreground flex-shrink-0" />
        </div>
      </motion.div>

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
            <ProductCard key={product.id} {...product} delay={0.5 + i * 0.1} />
          ))}
        </div>
      </div>
    </MobileLayout>
  );
};

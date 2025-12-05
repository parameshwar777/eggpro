import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Plus, Minus, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  originalPrice: number;
  rating: number;
  packSizes: number[];
  delay?: number;
}

export const ProductCard = ({
  id,
  name,
  description,
  image,
  price,
  originalPrice,
  rating,
  packSizes,
  delay = 0,
}: ProductCardProps) => {
  const navigate = useNavigate();
  const { addToCart, totalItems } = useCart();
  const { toast } = useToast();
  const [selectedPack, setSelectedPack] = useState(packSizes[0]);
  const [showAdded, setShowAdded] = useState(false);
  const discount = Math.round(((originalPrice - price) / originalPrice) * 100);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart({
      id: `${id}-${selectedPack}`,
      name,
      image,
      price: price * (selectedPack / packSizes[0]),
      originalPrice: originalPrice * (selectedPack / packSizes[0]),
      packSize: selectedPack,
      isSubscription: false
    });
    setShowAdded(true);
    toast({ title: "Added to cart!", description: `${name} (${selectedPack} eggs)` });
    setTimeout(() => setShowAdded(false), 2000);
  };

  const goToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate("/cart");
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay }}
      className="bg-card rounded-2xl p-3 sm:p-4 shadow-card overflow-hidden"
    >
      <div className="flex gap-3 sm:gap-4">
        {/* Image */}
        <motion.div
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(`/product/${id}`)}
          className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer"
        >
          <img src={image} alt={name} className="w-full h-full object-cover" />
          <Badge className="absolute top-1 left-1 bg-green-500 text-white text-[10px] px-1.5 py-0.5">
            {discount}% OFF
          </Badge>
        </motion.div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
          <div onClick={() => navigate(`/product/${id}`)} className="cursor-pointer">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-foreground text-sm sm:text-base leading-tight line-clamp-2">
                {name}
              </h3>
              <div className="flex items-center gap-0.5 bg-green-50 px-1.5 py-0.5 rounded flex-shrink-0">
                <Star className="w-3 h-3 fill-green-600 text-green-600" />
                <span className="text-xs font-medium text-green-700">{rating}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{description}</p>
          </div>

          {/* Pack sizes */}
          <div className="flex gap-1.5 mt-2">
            {packSizes.map((size) => (
              <button
                key={size}
                onClick={(e) => { e.stopPropagation(); setSelectedPack(size); }}
                className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
                  selectedPack === size 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {size} eggs
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-bold text-primary">
                ₹{Math.round(price * (selectedPack / packSizes[0]))}
              </span>
              <span className="text-xs text-muted-foreground line-through">
                ₹{Math.round(originalPrice * (selectedPack / packSizes[0]))}
              </span>
            </div>
            
            <AnimatePresence mode="wait">
              {showAdded ? (
                <motion.div
                  key="cart"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Button size="sm" onClick={goToCart} className="h-8 px-3 gap-1">
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span className="text-xs">View Cart</span>
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="add"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Button size="sm" onClick={handleAddToCart} className="h-8 px-3 gap-1">
                    <Plus className="w-3.5 h-3.5" />
                    <span className="text-xs">Add</span>
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

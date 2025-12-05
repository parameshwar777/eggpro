import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

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
  const savings = originalPrice - price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/product/${id}`)}
      className="bg-card rounded-2xl p-4 shadow-card cursor-pointer"
    >
      <div className="flex gap-4">
        <div className="relative w-28 h-28 flex-shrink-0">
          {savings > 0 && (
            <Badge className="absolute -top-2 -left-2 z-10 bg-green-500 text-white text-xs">
              SAVE ₹{savings}
            </Badge>
          )}
          <motion.img
            whileHover={{ scale: 1.05 }}
            src={image}
            alt={name}
            className="w-full h-full object-cover rounded-xl"
          />
        </div>
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">{name}</h3>
              <div className="flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-md">
                <Star className="w-3 h-3 fill-green-600 text-green-600" />
                <span className="text-xs font-medium text-green-700">{rating}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {description}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {packSizes.map((size) => (
              <span
                key={size}
                className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground"
              >
                {size} eggs
              </span>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground line-through">
                ₹{originalPrice}
              </span>
              <span className="text-lg font-bold text-primary">₹{price}</span>
            </div>
            <Button
              size="sm"
              className="rounded-full px-6"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/product/${id}`);
              }}
            >
              Add
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

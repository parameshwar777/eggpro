import { motion } from "framer-motion";
import { Star, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

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
  const discount = Math.round(((originalPrice - price) / originalPrice) * 100);

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/product/${id}`)}
      className="bg-card rounded-2xl p-3 sm:p-4 shadow-card cursor-pointer overflow-hidden"
    >
      <div className="flex gap-3 sm:gap-4">
        {/* Image */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden flex-shrink-0"
        >
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover"
          />
          <Badge className="absolute top-1 left-1 bg-green-500 text-white text-[10px] px-1.5 py-0.5">
            {discount}% OFF
          </Badge>
        </motion.div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-foreground text-sm sm:text-base leading-tight line-clamp-2">
                {name}
              </h3>
              <div className="flex items-center gap-0.5 bg-green-50 px-1.5 py-0.5 rounded flex-shrink-0">
                <Star className="w-3 h-3 fill-green-600 text-green-600" />
                <span className="text-xs font-medium text-green-700">{rating}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{description}</p>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-bold text-primary">₹{price}</span>
              <span className="text-xs text-muted-foreground line-through">₹{originalPrice}</span>
            </div>
            <motion.div
              whileTap={{ scale: 0.9 }}
              className="p-1.5 bg-primary/10 rounded-lg"
            >
              <ChevronRight className="w-4 h-4 text-primary" />
            </motion.div>
          </div>

          {/* Pack sizes */}
          <div className="flex gap-1.5 mt-2">
            {packSizes.map((size) => (
              <span
                key={size}
                className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"
              >
                {size} eggs
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

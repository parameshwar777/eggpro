import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CartItem {
  id: string;
  name: string;
  image: string;
  price: number;
  originalPrice: number;
  quantity: number;
  packSize: number;
  isSubscription: boolean;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id || null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load cart from DB when user logs in
  useEffect(() => {
    if (!userId) {
      setItems([]);
      return;
    }
    const loadCart = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("cart_items")
          .select("*")
          .eq("user_id", userId);
        if (error) throw error;
        if (data) {
          setItems(data.map(d => ({
            id: d.product_id,
            name: d.name,
            image: d.image,
            price: d.price,
            originalPrice: d.original_price,
            quantity: d.quantity,
            packSize: d.pack_size,
            isSubscription: d.is_subscription,
          })));
        }
      } catch (e) {
        console.error("Error loading cart:", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadCart();
  }, [userId]);

  // Sync helper
  const syncToDb = useCallback(async (productId: string, item: CartItem | null) => {
    if (!userId) return;
    try {
      if (!item) {
        await supabase.from("cart_items").delete().eq("user_id", userId).eq("product_id", productId);
      } else {
        const { data: existing } = await supabase
          .from("cart_items")
          .select("id")
          .eq("user_id", userId)
          .eq("product_id", productId)
          .maybeSingle();

        if (existing) {
          await supabase.from("cart_items").update({
            quantity: item.quantity,
            price: item.price,
            original_price: item.originalPrice,
          }).eq("id", existing.id);
        } else {
          await supabase.from("cart_items").insert({
            user_id: userId,
            product_id: item.id,
            name: item.name,
            image: item.image,
            price: item.price,
            original_price: item.originalPrice,
            quantity: item.quantity,
            pack_size: item.packSize,
            is_subscription: item.isSubscription,
          });
        }
      }
    } catch (e) {
      console.error("Cart sync error:", e);
    }
  }, [userId]);

  const addToCart = (item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        const updated = { ...existing, quantity: existing.quantity + 1 };
        syncToDb(item.id, updated);
        return prev.map((i) => i.id === item.id ? updated : i);
      }
      const newItem = { ...item, quantity: 1 };
      syncToDb(item.id, newItem);
      return [...prev, newItem];
    });
  };

  const removeFromCart = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    syncToDb(id, null);
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setItems((prev) => {
      const updated = prev.map((i) => i.id === id ? { ...i, quantity } : i);
      const item = updated.find(i => i.id === id);
      if (item) syncToDb(id, item);
      return updated;
    });
  };

  const clearCart = async () => {
    setItems([]);
    if (userId) {
      try {
        await supabase.from("cart_items").delete().eq("user_id", userId);
      } catch (e) {
        console.error("Error clearing cart:", e);
      }
    }
  };

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};

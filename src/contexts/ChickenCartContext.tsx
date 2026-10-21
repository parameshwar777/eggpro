import { createContext, useContext, useState, type ReactNode } from "react";

const STORAGE_KEY = "eggpro-chicken-cart";
type Quantities = Record<string, number>;
interface ChickenCart {
  qty: Quantities;
  change: (id: string, delta: number) => void;
  clear: () => void;
}
const Context = createContext<ChickenCart | null>(null);

function readCart(): Quantities {
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter(([, value]) =>
      typeof value === "number" && Number.isInteger(value) && value > 0 && value <= 50));
  } catch { return {}; }
}

export function ChickenCartProvider({ children }: { children: ReactNode }) {
  const [qty, setQty] = useState<Quantities>(readCart);
  const store = (next: Quantities) => {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* Session storage may be unavailable. */ }
    return next;
  };
  const change = (id: string, delta: number) => setQty((current) => {
    const next = { ...current, [id]: Math.max(0, Math.min(50, (current[id] || 0) + delta)) };
    if (next[id] === 0) delete next[id];
    return store(next);
  });
  const clear = () => setQty(store({}));
  return <Context.Provider value={{ qty, change, clear }}>{children}</Context.Provider>;
}

export function useChickenCart() {
  const cart = useContext(Context);
  if (!cart) throw new Error("ChickenCartProvider is required");
  return cart;
}
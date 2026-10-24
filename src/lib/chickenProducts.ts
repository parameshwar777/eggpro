export interface ChickenProduct {
  id: string;
  name: string;
  description: string | null;
  weight: string | null;
  price: number;
  offer_price: number | null;
  image_path: string | null;
  available: boolean;
}

export const CHICKEN_WEIGHTS = [
  { value: "250 g", label: "Quarter kg (250 g)" },
  { value: "500 g", label: "Half kg (500 g)" },
  { value: "1 kg", label: "1 kg" },
] as const;

export const chickenUnitPrice = (product: ChickenProduct) =>
  product.offer_price && product.offer_price > 0 ? product.offer_price : product.price;

export function groupChickenProducts<T extends { name: string }>(products: T[]): T[][] {
  const groups = new Map<string, T[]>();
  for (const product of products) {
    const group = groups.get(product.name) || [];
    group.push(product);
    groups.set(product.name, group);
  }
  return [...groups.values()];
}
export const OFFER_PRODUCT_ERROR = 'This coupon is not valid for the selected product. Add the product listed in the offer.';

export function eligibleOfferLines<T extends { productId: string; quantity: number }>(lines: T[], productId?: string | null): T[] {
  const eligible = lines.filter(line => line.quantity > 0 && (!productId || line.productId === productId));
  if (productId && eligible.length === 0) throw new Error(OFFER_PRODUCT_ERROR);
  return eligible;
}
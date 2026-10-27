import { eligibleOfferLines } from './offerProducts.ts';
export interface CouponLine { productId: string; quantity: number; price: number; weight?: string | null }

export function chickenCouponDiscount(lines: CouponLine[], percent: number, productId?: string | null): number {
  // The offer percentage applies to one full pack (the highest-priced line). Remaining quantities stay paid.
  const unit = eligibleOfferLines(lines, productId).reduce((max, line) => {
    if (line.quantity < 1 || !Number.isFinite(line.price) || line.price <= 0) return max;
    return Math.max(max, line.price);
  }, 0);
  return Math.round(unit * Math.min(100, Math.max(0, percent))) / 100;
}

export function couponPhoneStatus(owner: string, caller: string, paid: boolean): 'used' | 'other-account' | 'resume' {
  return paid ? 'used' : owner !== caller ? 'other-account' : 'resume';
}

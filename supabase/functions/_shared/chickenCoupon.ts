export interface CouponLine { productId: string; quantity: number; price: number; weight?: string | null }

export function chickenCouponDiscount(lines: CouponLine[], percent: number): number {
  const eligible = lines.filter(line => /^(250\s*g(m|ms|rams?)?|0\.25\s*kg|quarter\s*kg)$/i.test((line.weight || '').trim()) && line.quantity >= 1);
  // Exactly one quarter-kilogram pack, even if several products/quantities qualify.
  const unit = eligible.reduce((max, line) => Math.max(max, line.price), 0);
  return Math.round(unit * Math.min(100, Math.max(0, percent))) / 100;
}

export function couponPhoneStatus(owner: string, caller: string, paid: boolean): 'used' | 'other-account' | 'resume' {
  return paid ? 'used' : owner !== caller ? 'other-account' : 'resume';
}
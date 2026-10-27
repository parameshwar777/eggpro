export interface CouponLine { productId: string; quantity: number; price: number; weight?: string | null }

export function chickenCouponDiscount(lines: CouponLine[], percent: number): number {
  // One 250 g portion, including within a larger pack. Never discount every quantity.
  const unit = lines.reduce((max, line) => {
    const label = (line.weight || '').trim().toLowerCase();
    const match = label.match(/^(\d+(?:\.\d+)?)\s*(kg|kilograms?|g|gm|gms|grams?)$/);
    const grams = label === 'half kg' ? 500 : label === 'quarter kg' ? 250 : match ? Number(match[1]) * (match[2].startsWith('k') ? 1000 : 1) : 0;
    if (grams < 250 || line.quantity < 1 || !Number.isFinite(line.price) || line.price <= 0) return max;
    return Math.max(max, line.price * 250 / grams);
  }, 0);
  return Math.round(unit * Math.min(100, Math.max(0, percent))) / 100;
}

export function couponPhoneStatus(owner: string, caller: string, paid: boolean): 'used' | 'other-account' | 'resume' {
  return paid ? 'used' : owner !== caller ? 'other-account' : 'resume';
}
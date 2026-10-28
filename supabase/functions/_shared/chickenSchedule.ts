export interface SupplySchedule {
  store_closed?: boolean;
  booking_days: number[];
  pickup_day: number;
  cutoff_time: string;
  sunday_evening_start?: string;
}
const OFFSET = 330 * 60 * 1000;
export function chickenBookingOpen(s: SupplySchedule, now = new Date()) {
  if (s.store_closed) return false;
  const india = new Date(now.getTime() + OFFSET);
  const day = india.getUTCDay();
  if (day === s.pickup_day) {
    const [h, m] = (s.sunday_evening_start || "18:00").split(":").map(Number);
    return india.getUTCHours() * 60 + india.getUTCMinutes() >= h * 60 + (m || 0);
  }
  return s.booking_days.includes(day);
}
export function chickenSupplyDeadline(s: SupplySchedule, now = new Date()) {
  const india = new Date(now.getTime() + OFFSET);
  let days = (s.pickup_day - india.getUTCDay() + 7) % 7;
  const [h, m] = s.cutoff_time.split(":").map(Number);
  const candidate = () => Date.UTC(india.getUTCFullYear(), india.getUTCMonth(), india.getUTCDate() + days, h, m || 0) - OFFSET;
  if (candidate() <= now.getTime()) days += 7;
  return new Date(candidate());
}
export function canManageChicken(roles: string[]) {
  return roles.includes("admin") || roles.includes("merchant");
}
export function canCompleteChicken(order: { business: string; payment_status: string | null; fulfillment_type: string; pickup_center_id: string | null; order_status: string | null }, outletId: string, pickupStatus?: string) {
  return order.business === "chicken" && order.payment_status === "completed" && order.fulfillment_type === "pickup" && order.pickup_center_id === outletId && order.order_status !== "cancelled" && pickupStatus !== "CANCELLED";
}
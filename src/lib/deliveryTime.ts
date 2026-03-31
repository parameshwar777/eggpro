/**
 * Returns the estimated delivery time slot based on order placement time.
 * - Orders placed 6 PM (yesterday) to 9 AM → Delivery 10 AM - 12 PM
 * - Orders placed 9 AM to 2 PM → Delivery 3 PM - 5 PM
 * - Orders placed 2 PM to 6 PM → Delivery 7 PM - 8:30 PM
 */
export function getDeliverySlot(orderDate?: string | Date): string {
  const d = orderDate ? new Date(orderDate) : new Date();
  const hour = d.getHours();

  if (hour >= 18 || hour < 9) {
    return "10 AM - 12 PM";
  } else if (hour >= 9 && hour < 14) {
    return "3 PM - 5 PM";
  } else {
    return "7 PM - 8:30 PM";
  }
}

export function getDeliverySlotLabel(orderDate?: string | Date): string {
  return `Delivery: ${getDeliverySlot(orderDate)}`;
}

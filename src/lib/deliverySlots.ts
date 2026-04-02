/**
 * Returns available delivery slots based on current time.
 * 
 * Slot rules:
 * 1. Orders 6 PM – 9 AM → Delivery 10 AM – 12 PM
 * 2. Orders 9 AM – 2 PM → Delivery 3 PM – 5 PM
 * 3. Orders 2 PM – 6 PM → Delivery 7 PM – 8:30 PM
 * 
 * Logic:
 * - The current active ordering window's slot is NOT shown (too soon for delivery).
 * - Remaining same-day slots are shown.
 * - If ordering after 6 PM or before 9 AM, show all 3 slots for tomorrow.
 */

export interface DeliverySlot {
  id: string;
  label: string;
  date: string; // "Today" or "Tomorrow" or actual date
  fullLabel: string; // e.g. "Tomorrow, 10 AM - 12 PM"
}

export function getAvailableDeliverySlots(): DeliverySlot[] {
  const now = new Date();
  const hour = now.getHours();
  const slots: DeliverySlot[] = [];

  const today = new Date(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const formatDate = (d: Date) => {
    const isToday = d.toDateString() === now.toDateString();
    const isTomorrow = d.toDateString() === tomorrow.toDateString();
    if (isToday) return "Today";
    if (isTomorrow) return "Tomorrow";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  if (hour >= 18 || hour < 9) {
    // Night/early morning: current window is slot 1 (delivery 10-12)
    // Show all 3 slots for tomorrow
    const dayLabel = formatDate(tomorrow);
    slots.push(
      { id: "slot1", label: "10 AM - 12 PM", date: dayLabel, fullLabel: `${dayLabel}, 10 AM - 12 PM` },
      { id: "slot2", label: "3 PM - 5 PM", date: dayLabel, fullLabel: `${dayLabel}, 3 PM - 5 PM` },
      { id: "slot3", label: "7 PM - 8:30 PM", date: dayLabel, fullLabel: `${dayLabel}, 7 PM - 8:30 PM` },
    );
  } else if (hour >= 9 && hour < 14) {
    // Morning: current window is slot 2 (delivery 3-5)
    // Show slot 3 today + all 3 tomorrow
    const todayLabel = formatDate(today);
    const tomorrowLabel = formatDate(tomorrow);
    slots.push(
      { id: "slot3", label: "7 PM - 8:30 PM", date: todayLabel, fullLabel: `${todayLabel}, 7 PM - 8:30 PM` },
      { id: "slot1_tmr", label: "10 AM - 12 PM", date: tomorrowLabel, fullLabel: `${tomorrowLabel}, 10 AM - 12 PM` },
    );
  } else {
    // Afternoon (2-6 PM): current window is slot 3 (delivery 7-8:30)
    // Show all 3 tomorrow
    const dayLabel = formatDate(tomorrow);
    slots.push(
      { id: "slot1", label: "10 AM - 12 PM", date: dayLabel, fullLabel: `${dayLabel}, 10 AM - 12 PM` },
      { id: "slot2", label: "3 PM - 5 PM", date: dayLabel, fullLabel: `${dayLabel}, 3 PM - 5 PM` },
      { id: "slot3", label: "7 PM - 8:30 PM", date: dayLabel, fullLabel: `${dayLabel}, 7 PM - 8:30 PM` },
    );
  }

  return slots;
}

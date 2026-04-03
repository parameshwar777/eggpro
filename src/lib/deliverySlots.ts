/**
 * Returns the next 3 available delivery slots based on current time.
 * 
 * Ordering windows → Delivery slots:
 * 1. Orders 6 PM – 9 AM  → Delivery 10 AM – 12 PM (next day if after 6 PM)
 * 2. Orders 9 AM – 2 PM  → Delivery 3 PM – 5 PM (same day)
 * 3. Orders 2 PM – 6 PM  → Delivery 7 PM – 8:30 PM (same day)
 * 
 * Logic: Based on current time, determine the next 3 chronological delivery slots.
 */

export interface DeliverySlot {
  id: string;
  label: string;
  date: string; // "Today" or "Tomorrow" or actual date
  fullLabel: string; // e.g. "Tomorrow, 10 AM - 12 PM"
}

interface SlotDef {
  id: string;
  label: string;
  dayOffset: number; // 0 = today, 1 = tomorrow
}

export function getAvailableDeliverySlots(): DeliverySlot[] {
  const now = new Date();
  const hour = now.getHours();

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const formatDay = (offset: number) => {
    if (offset === 0) return "Today";
    if (offset === 1) return "Tomorrow";
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  // Build next 3 slots in chronological order based on current time
  const upcoming: SlotDef[] = [];

  if (hour >= 18) {
    // After 6 PM: next delivery is tomorrow 10-12, then 3-5, then 7-8:30
    upcoming.push(
      { id: "slot1", label: "10 AM - 12 PM", dayOffset: 1 },
      { id: "slot2", label: "3 PM - 5 PM", dayOffset: 1 },
      { id: "slot3", label: "7 PM - 8:30 PM", dayOffset: 1 },
    );
  } else if (hour < 9) {
    // Before 9 AM: still in 6PM-9AM window, delivery is today 10-12, then 3-5, then 7-8:30
    upcoming.push(
      { id: "slot1", label: "10 AM - 12 PM", dayOffset: 0 },
      { id: "slot2", label: "3 PM - 5 PM", dayOffset: 0 },
      { id: "slot3", label: "7 PM - 8:30 PM", dayOffset: 0 },
    );
  } else if (hour >= 9 && hour < 14) {
    // 9 AM - 2 PM: next delivery is today 3-5, then today 7-8:30, then tomorrow 10-12
    upcoming.push(
      { id: "slot2", label: "3 PM - 5 PM", dayOffset: 0 },
      { id: "slot3", label: "7 PM - 8:30 PM", dayOffset: 0 },
      { id: "slot1_tmr", label: "10 AM - 12 PM", dayOffset: 1 },
    );
  } else {
    // 2 PM - 6 PM: next delivery is today 7-8:30, then tomorrow 10-12, then 3-5
    upcoming.push(
      { id: "slot3", label: "7 PM - 8:30 PM", dayOffset: 0 },
      { id: "slot1_tmr", label: "10 AM - 12 PM", dayOffset: 1 },
      { id: "slot2_tmr", label: "3 PM - 5 PM", dayOffset: 1 },
    );
  }

  return upcoming.map(s => {
    const dayLabel = formatDay(s.dayOffset);
    return {
      id: s.id,
      label: s.label,
      date: dayLabel,
      fullLabel: `${dayLabel}, ${s.label}`,
    };
  });
}

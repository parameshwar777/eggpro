import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Delivery slot configuration — editable by admin from Admin → Settings.
 * Each slot describes:
 *  - the ordering window (orderStart / orderEnd in 24h hours)
 *  - the delivery window label shown to users / merchants
 *
 * Slot ids are fixed (slot1/slot2/slot3) so existing orders and code paths
 * remain compatible even when labels or hours change.
 */
export interface SlotDefinition {
  id: "slot1" | "slot2" | "slot3";
  orderStart: number; // 24h hour, inclusive
  orderEnd: number;   // 24h hour, exclusive. slot1 wraps past midnight when orderEnd < orderStart.
  deliveryLabel: string;
}

export const DEFAULT_SLOT_CONFIG: SlotDefinition[] = [
  { id: "slot1", orderStart: 18, orderEnd: 9,  deliveryLabel: "10 AM - 12 PM" },
  { id: "slot2", orderStart: 9,  orderEnd: 14, deliveryLabel: "3 PM - 5 PM" },
  { id: "slot3", orderStart: 14, orderEnd: 18, deliveryLabel: "7 PM - 8:30 PM" },
];

const ADMIN_SETTING_KEY = "delivery_slots";

// ---------- module-level store with pub/sub for React ----------
let cached: SlotDefinition[] = DEFAULT_SLOT_CONFIG;
let loaded = false;
let loadingPromise: Promise<SlotDefinition[]> | null = null;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((l) => l());

const sanitize = (raw: any): SlotDefinition[] => {
  if (!Array.isArray(raw)) return DEFAULT_SLOT_CONFIG;
  const byId = new Map<string, SlotDefinition>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const id = item.id;
    if (id !== "slot1" && id !== "slot2" && id !== "slot3") continue;
    const orderStart = Number(item.orderStart);
    const orderEnd = Number(item.orderEnd);
    const deliveryLabel = String(item.deliveryLabel || "").trim();
    if (!Number.isFinite(orderStart) || !Number.isFinite(orderEnd) || !deliveryLabel) continue;
    byId.set(id, { id, orderStart, orderEnd, deliveryLabel });
  }
  return DEFAULT_SLOT_CONFIG.map((d) => byId.get(d.id) || d);
};

export const getSlotConfig = (): SlotDefinition[] => cached;

export async function loadSlotConfig(force = false): Promise<SlotDefinition[]> {
  if (loaded && !force) return cached;
  if (loadingPromise && !force) return loadingPromise;
  loadingPromise = (async () => {
    try {
      const { data } = await supabase
        .from("admin_settings")
        .select("value")
        .eq("key", ADMIN_SETTING_KEY)
        .maybeSingle();
      if (data?.value) {
        try {
          const parsed = JSON.parse(data.value);
          cached = sanitize(parsed);
        } catch {
          cached = DEFAULT_SLOT_CONFIG;
        }
      }
    } catch {
      // keep defaults
    } finally {
      loaded = true;
      loadingPromise = null;
      notify();
    }
    return cached;
  })();
  return loadingPromise;
}

export async function saveSlotConfig(next: SlotDefinition[]) {
  const clean = sanitize(next);
  const { error } = await supabase.from("admin_settings").upsert(
    { key: ADMIN_SETTING_KEY, value: JSON.stringify(clean), updated_at: new Date().toISOString() },
    { onConflict: "key" }
  );
  if (error) throw error;
  cached = clean;
  loaded = true;
  notify();
  return clean;
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export function useSlotConfig(): SlotDefinition[] {
  if (!loaded && !loadingPromise) {
    // kick off load on first use; UI re-renders once resolved
    loadSlotConfig();
  }
  return useSyncExternalStore(subscribe, () => cached, () => cached);
}

// ---------- pure helpers that take a config ----------

export interface AvailableSlot {
  id: string;         // slot id, with "_tmr" suffix if it's tomorrow's slot
  slotId: SlotDefinition["id"];
  label: string;      // delivery label
  date: string;       // "Today" / "Tomorrow" / e.g. "27 Jul"
  fullLabel: string;  // e.g. "Tomorrow, 10 AM - 12 PM"
}

const isInOrderWindow = (hour: number, s: SlotDefinition): boolean => {
  if (s.orderEnd > s.orderStart) return hour >= s.orderStart && hour < s.orderEnd;
  // wrap-around window (e.g. 18 -> 9): hour >= start OR hour < end
  return hour >= s.orderStart || hour < s.orderEnd;
};

const findCurrentSlotIndex = (hour: number, config: SlotDefinition[]): number => {
  for (let i = 0; i < config.length; i++) {
    if (isInOrderWindow(hour, config[i])) return i;
  }
  return 0;
};

const formatDay = (offset: number): string => {
  if (offset === 0) return "Today";
  if (offset === 1) return "Tomorrow";
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

export function computeAvailableSlots(config: SlotDefinition[] = getSlotConfig()): AvailableSlot[] {
  const now = new Date();
  const hour = now.getHours();
  const curIdx = findCurrentSlotIndex(hour, config);
  const cur = config[curIdx];

  // The slot1 wrap-around delivers "today" only when the current time is in the early-morning half
  // of the window (hour < orderEnd). If we're in the evening half (hour >= orderStart), delivery is tomorrow.
  const curIsEvening = cur.orderEnd < cur.orderStart && hour >= cur.orderStart;

  const results: AvailableSlot[] = [];
  for (let i = 0; i < config.length; i++) {
    const slot = config[(curIdx + i) % config.length];
    // rolls over to tomorrow whenever we pass the end of the current-day window
    const isTomorrow = curIsEvening || i > (config.length - 1 - curIdx);
    const dayOffset = isTomorrow ? 1 : 0;
    const dayLabel = formatDay(dayOffset);
    results.push({
      id: slot.id + (dayOffset === 1 ? "_tmr" : ""),
      slotId: slot.id,
      label: slot.deliveryLabel,
      date: dayLabel,
      fullLabel: `${dayLabel}, ${slot.deliveryLabel}`,
    });
  }
  return results;
}

export function computeDeliveryLabel(orderDate?: string | Date, config: SlotDefinition[] = getSlotConfig()): string {
  const d = orderDate ? new Date(orderDate) : new Date();
  const hour = d.getHours();
  const slot = config[findCurrentSlotIndex(hour, config)];
  return slot.deliveryLabel;
}

/** Returns the [start, end) window (Date instances) for a given slot on a chosen calendar day. */
export function slotWindowForDate(slot: SlotDefinition, chosenDate: Date): [Date, Date] {
  const dayStart = new Date(chosenDate.getFullYear(), chosenDate.getMonth(), chosenDate.getDate());
  if (slot.orderEnd > slot.orderStart) {
    const start = new Date(dayStart); start.setHours(slot.orderStart, 0, 0, 0);
    const end = new Date(dayStart); end.setHours(slot.orderEnd, 0, 0, 0);
    return [start, end];
  }
  // wrap-around: previous-day orderStart hour → chosenDay orderEnd hour
  const start = new Date(dayStart); start.setDate(start.getDate() - 1); start.setHours(slot.orderStart, 0, 0, 0);
  const end = new Date(dayStart); end.setHours(slot.orderEnd, 0, 0, 0);
  return [start, end];
}

export function isOrderInSlot(orderDate: string | Date, slotId: SlotDefinition["id"], chosenDate: Date, config: SlotDefinition[] = getSlotConfig()): boolean {
  const slot = config.find((s) => s.id === slotId);
  if (!slot) return false;
  const [start, end] = slotWindowForDate(slot, chosenDate);
  const d = new Date(orderDate);
  return d >= start && d < end;
}

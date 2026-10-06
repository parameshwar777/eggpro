import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ChickenPickupSettings {
  booking_days: number[];
  pickup_day: number;
  pickup_start_time: string;
  pickup_end_time: string;
  cutoff_time: string;
  refund_policy: string;
  delivery_enabled: boolean;
}

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const DEFAULT_CHICKEN_SETTINGS: ChickenPickupSettings = {
  booking_days: [1, 2, 3, 4, 5, 6],
  pickup_day: 0,
  pickup_start_time: "06:00",
  pickup_end_time: "10:00",
  cutoff_time: "10:00",
  refund_policy: "",
  delivery_enabled: true,
};

export const SETTINGS_KEY = "chicken_pickup_settings";

export async function fetchChickenSettings(): Promise<ChickenPickupSettings> {
  const { data } = await supabase.from("admin_settings").select("value").eq("key", SETTINGS_KEY).maybeSingle();
  try {
    return { ...DEFAULT_CHICKEN_SETTINGS, ...(data?.value ? JSON.parse(data.value) : {}) };
  } catch {
    return DEFAULT_CHICKEN_SETTINGS;
  }
}

export function useChickenSettings() {
  const [s, setS] = useState<ChickenPickupSettings>(DEFAULT_CHICKEN_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    fetchChickenSettings().then((v) => { setS(v); setLoaded(true); });
  }, []);
  return { settings: s, loaded };
}

/** "10:00" → "10:00 AM" */
export function fmtTime(t?: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  if (!Number.isFinite(h)) return t;
  const ap = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m || 0).padStart(2, "0")} ${ap}`;
}

/** Current weekday in India Standard Time. */
export function istWeekday(): number {
  const name = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "Asia/Kolkata" }).format(new Date());
  return DAY_NAMES.indexOf(name);
}

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface StoreStatus {
  isOpen: boolean;
  closedMessage: string;
}

const DEFAULT: StoreStatus = {
  isOpen: true,
  closedMessage: "We're temporarily closed for new orders. Please check back soon!",
};

let cached: StoreStatus = DEFAULT;
let loaded = false;
let loadingPromise: Promise<StoreStatus> | null = null;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((l) => l());

export const getStoreStatus = (): StoreStatus => cached;

export async function loadStoreStatus(force = false): Promise<StoreStatus> {
  if (loaded && !force) return cached;
  if (loadingPromise && !force) return loadingPromise;
  loadingPromise = (async () => {
    try {
      const { data } = await supabase
        .from("admin_settings")
        .select("key,value")
        .in("key", ["store_open", "store_closed_message"]);
      const open = data?.find((r) => r.key === "store_open")?.value;
      const msg = data?.find((r) => r.key === "store_closed_message")?.value;
      cached = {
        isOpen: open === undefined ? true : open === "true",
        closedMessage: msg && msg.trim() ? msg : DEFAULT.closedMessage,
      };
    } catch {
      cached = DEFAULT;
    } finally {
      loaded = true;
      loadingPromise = null;
      notify();
    }
    return cached;
  })();
  return loadingPromise;
}

export async function saveStoreStatus(next: StoreStatus): Promise<StoreStatus> {
  const rows = [
    { key: "store_open", value: next.isOpen ? "true" : "false", updated_at: new Date().toISOString() },
    { key: "store_closed_message", value: next.closedMessage, updated_at: new Date().toISOString() },
  ];
  const { error } = await supabase.from("admin_settings").upsert(rows, { onConflict: "key" });
  if (error) throw error;
  cached = { ...next };
  loaded = true;
  notify();
  return cached;
}

export function useStoreStatus(): StoreStatus {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!loaded && !loadingPromise) loadStoreStatus();
    const cb = () => setTick((t) => t + 1);
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  }, []);
  return cached;
}

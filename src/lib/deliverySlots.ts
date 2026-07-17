/**
 * Backwards-compatible wrapper — the source of truth is now `src/lib/slotConfig.ts`,
 * which is admin-editable and loaded from `admin_settings.delivery_slots`.
 */
import { computeAvailableSlots, getSlotConfig, type AvailableSlot, type SlotDefinition } from "./slotConfig";

export type DeliverySlot = AvailableSlot;

export function getAvailableDeliverySlots(config: SlotDefinition[] = getSlotConfig()): DeliverySlot[] {
  return computeAvailableSlots(config);
}

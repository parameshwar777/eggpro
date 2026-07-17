import { computeDeliveryLabel, getSlotConfig, type SlotDefinition } from "./slotConfig";

export function getDeliverySlot(orderDate?: string | Date, config: SlotDefinition[] = getSlotConfig()): string {
  return computeDeliveryLabel(orderDate, config);
}

export function getDeliverySlotLabel(orderDate?: string | Date): string {
  return `Delivery: ${getDeliverySlot(orderDate)}`;
}

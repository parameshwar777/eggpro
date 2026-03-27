import { PushNotificationManager } from "./PushNotificationManager";
import { CapacitorNotificationManager } from "./CapacitorNotificationManager";

const isCapacitor = () => !!(window as any).Capacitor;

/**
 * Unified notification manager that renders the correct component
 * based on platform (Capacitor native vs web browser).
 */
export const NotificationManager = () => {
  if (isCapacitor()) {
    return <CapacitorNotificationManager />;
  }
  return <PushNotificationManager />;
};

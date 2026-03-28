import { useEffect, useState, useCallback } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Detect if running inside Capacitor
const isCapacitor = () => {
  return !!(window as any).Capacitor;
};

/**
 * Cross-platform notification manager:
 * - On Capacitor (Android): Uses @capacitor/local-notifications for sound alerts
 * - On Web: Uses Web Push API (PushNotificationManager)
 */
export const CapacitorNotificationManager = () => {
  const { toast } = useToast();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    const native = isCapacitor();
    setIsNative(native);

    if (native) {
      // Auto-request permissions and create channel on mount
      autoSetup();
    }
  }, []);

  const autoSetup = async () => {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const result = await LocalNotifications.checkPermissions();
      
      if (result.display === "granted") {
        setIsEnabled(true);
        await createNotificationChannel();
      } else if (result.display === "prompt") {
        // Auto-request on first load
        const perm = await LocalNotifications.requestPermissions();
        if (perm.display === "granted") {
          setIsEnabled(true);
          await createNotificationChannel();
        }
      }
    } catch (e) {
      console.error("Auto notification setup error:", e);
    }
  };

  const createNotificationChannel = async () => {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      await LocalNotifications.createChannel({
        id: "orders",
        name: "Order Alerts",
        description: "Notifications for new orders",
        importance: 5,
        visibility: 1,
        vibration: true,
        sound: "beep.wav",
      });
    } catch (e) {
      console.log("Channel creation:", e);
    }
  };

  const enableNotifications = async () => {
    setIsLoading(true);
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      
      const permission = await LocalNotifications.requestPermissions();
      if (permission.display !== "granted") {
        toast({
          title: "Permission denied",
          description: "Please enable notifications in your device settings",
          variant: "destructive",
        });
        return;
      }

      await createNotificationChannel();

      setIsEnabled(true);
      toast({
        title: "🔔 Notifications enabled!",
        description: "You'll receive alerts for new orders",
      });
    } catch (e: any) {
      console.error("Notification setup error:", e);
      toast({
        title: "Error enabling notifications",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const disableNotifications = () => {
    setIsEnabled(false);
    toast({ title: "Notifications disabled" });
  };

  // If not on Capacitor, don't render (PushNotificationManager handles web)
  if (!isNative) return null;

  return (
    <Button
      size="sm"
      variant={isEnabled ? "default" : "outline"}
      onClick={isEnabled ? disableNotifications : enableNotifications}
      disabled={isLoading}
      className={
        isEnabled
          ? "bg-green-600 hover:bg-green-700 text-white"
          : "border-slate-700 text-slate-300 hover:bg-slate-800"
      }
      title={isEnabled ? "Notifications ON" : "Enable notifications"}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : isEnabled ? (
        <Bell className="w-4 h-4" />
      ) : (
        <BellOff className="w-4 h-4" />
      )}
    </Button>
  );
};

/**
 * Hook to trigger local notifications on Capacitor when new orders arrive.
 * Call this in MerchantOrders to fire native notifications.
 */
export const useCapacitorOrderNotification = () => {
  const notify = useCallback(async (title: string, body: string) => {
    if (!isCapacitor()) return;
    
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== "granted") return;

      await LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now(),
            title,
            body,
            channelId: "orders",
            smallIcon: "ic_notification",
            largeIcon: "ic_notification",
          },
        ],
      });
    } catch (e) {
      console.error("Local notification error:", e);
    }
  }, []);

  return { notify };
};

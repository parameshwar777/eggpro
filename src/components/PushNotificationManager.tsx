import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from(rawData, char => char.charCodeAt(0));
}

export const PushNotificationManager = () => {
  const { toast } = useToast();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);
    if (supported) checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      }
    } catch (e) {
      console.error("Error checking push subscription:", e);
    }
  };

  const subscribe = async () => {
    setIsLoading(true);
    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast({ title: "Permission denied", description: "Please enable notifications in your browser settings", variant: "destructive" });
        return;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Get or generate VAPID public key
      let vapidPublicKey: string | null = null;

      const { data: vapidData } = await supabase
        .from("admin_settings")
        .select("value")
        .eq("key", "vapid_public_key")
        .single();

      if (vapidData?.value) {
        vapidPublicKey = vapidData.value;
      } else {
        // Generate VAPID keys via edge function
        const { data, error } = await supabase.functions.invoke("setup-web-push");
        if (error) throw error;
        vapidPublicKey = data?.publicKey;
      }

      if (!vapidPublicKey) throw new Error("Could not get VAPID public key");

      // Subscribe to push
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      // Save subscription to backend
      const subJson = subscription.toJSON();
      const { error } = await supabase.functions.invoke("save-push-subscription", {
        body: { subscription: subJson },
      });

      if (error) throw error;

      setIsSubscribed(true);
      toast({ title: "🔔 Notifications enabled!", description: "You'll receive push alerts for new orders" });
    } catch (e: any) {
      console.error("Push subscription error:", e);
      toast({ title: "Error enabling notifications", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) await subscription.unsubscribe();
      }
      setIsSubscribed(false);
      toast({ title: "Notifications disabled" });
    } catch (e) {
      console.error("Unsubscribe error:", e);
    }
  };

  if (!isSupported) return null;

  return (
    <Button
      size="sm"
      variant={isSubscribed ? "default" : "outline"}
      onClick={isSubscribed ? unsubscribe : subscribe}
      disabled={isLoading}
      className={isSubscribed 
        ? "bg-green-600 hover:bg-green-700 text-white" 
        : "border-slate-700 text-slate-300 hover:bg-slate-800"
      }
      title={isSubscribed ? "Notifications ON - click to disable" : "Enable push notifications"}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : isSubscribed ? (
        <Bell className="w-4 h-4" />
      ) : (
        <BellOff className="w-4 h-4" />
      )}
    </Button>
  );
};

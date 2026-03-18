import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

/**
 * Compare two semver strings (e.g. "8.0.0" vs "8.1.0").
 * Returns true if current < required (i.e. update needed).
 */
const isVersionOutdated = (current: string, required: string): boolean => {
  const parseParts = (v: string) => v.split(".").map((n) => parseInt(n, 10) || 0);
  const cur = parseParts(current);
  const req = parseParts(required);
  for (let i = 0; i < Math.max(cur.length, req.length); i++) {
    const c = cur[i] || 0;
    const r = req[i] || 0;
    if (c < r) return true;
    if (c > r) return false;
  }
  return false;
};

export const AppUpdateChecker = () => {
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const checkVersion = async () => {
      try {
        const appInfo = await App.getInfo();
        const currentVersion = appInfo.version;

        const { data } = await supabase
          .from("admin_settings")
          .select("value")
          .eq("key", "app_current_version")
          .single();

        if (data?.value && isVersionOutdated(currentVersion, data.value)) {
          setShowUpdate(true);
        }
      } catch (e) {
        console.error("Version check error:", e);
      }
    };

    checkVersion();
  }, []);

  if (!showUpdate) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
        <div className="text-5xl mb-4">🥚</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Update Available!</h2>
        <p className="text-gray-600 mb-6 text-sm">
          A new version of EggPro is available. Please update to get the latest features and improvements.
        </p>
        <a
          href="https://play.google.com/store/apps/details?id=com.eggpro.app"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          Update Now
        </a>
        <button
          onClick={() => setShowUpdate(false)}
          className="mt-3 text-sm text-gray-400 hover:text-gray-600"
        >
          Later
        </button>
      </div>
    </div>
  );
};

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

const DEFAULT_ANDROID_URL = "https://play.google.com/store/apps/details?id=com.eggpro.app";
const DEFAULT_IOS_URL = "https://apps.apple.com/app/eggpro";

export const AppUpdateChecker = () => {
  const [showUpdate, setShowUpdate] = useState(false);
  const [updateUrl, setUpdateUrl] = useState<string>(DEFAULT_ANDROID_URL);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const platform = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'
    const isIos = platform === "ios";

    // Per-platform keys; fall back to legacy `app_current_version` (Android) for safety.
    const versionKey = isIos ? "app_current_version_ios" : "app_current_version";
    const urlKey = isIos ? "app_update_url_ios" : "app_update_url_android";
    const fallbackUrl = isIos ? DEFAULT_IOS_URL : DEFAULT_ANDROID_URL;

    const checkVersion = async () => {
      try {
        const appInfo = await App.getInfo();
        const currentVersion = appInfo.version;

        const { data: rows } = await supabase
          .from("admin_settings")
          .select("key,value")
          .in("key", [versionKey, urlKey]);

        const requiredVersion = rows?.find((r) => r.key === versionKey)?.value;
        const customUrl = rows?.find((r) => r.key === urlKey)?.value;
        setUpdateUrl(customUrl || fallbackUrl);

        // Only prompt if admin has set a required version for this platform AND user is outdated.
        if (requiredVersion && isVersionOutdated(currentVersion, requiredVersion)) {
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
          href={updateUrl}
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

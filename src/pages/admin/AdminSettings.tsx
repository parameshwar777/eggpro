import { useState, useEffect, useRef } from "react";
import { Save, Phone, Image, Upload, Smartphone, Send, Eye, Gift } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const AdminSettings = () => {
  const { toast } = useToast();
  const [adminWhatsapp, setAdminWhatsapp] = useState("919440229378");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [wallpaperUrl, setWallpaperUrl] = useState("");
  const [isUploadingWallpaper, setIsUploadingWallpaper] = useState(false);
  const [appVersion, setAppVersion] = useState("1.0.0");
  const [appVersionIos, setAppVersionIos] = useState("1.0.0");
  const [updateUrlAndroid, setUpdateUrlAndroid] = useState("");
  const [updateUrlIos, setUpdateUrlIos] = useState("");
  const [isSavingVersion, setIsSavingVersion] = useState(false);
  const [isSavingVersionIos, setIsSavingVersionIos] = useState(false);
  const [isSavingUrls, setIsSavingUrls] = useState(false);
  const [telegramChatIds, setTelegramChatIds] = useState("");
  const [isSavingTelegram, setIsSavingTelegram] = useState(false);
  const [isFetchingChats, setIsFetchingChats] = useState(false);
  const [detectedChats, setDetectedChats] = useState<any[]>([]);
  const [showSubscriptions, setShowSubscriptions] = useState(true);
  const [isSavingSubscription, setIsSavingSubscription] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [isSavingReferral, setIsSavingReferral] = useState(false);
  const [firstOrderDiscount, setFirstOrderDiscount] = useState("50");
  const [firstOrderEnabled, setFirstOrderEnabled] = useState(true);
  const [isSavingFirstOrder, setIsSavingFirstOrder] = useState(false);
  const [isSavingFirstOrderToggle, setIsSavingFirstOrderToggle] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("*")
        .in("key", ["admin_whatsapp", "splash_wallpaper", "app_current_version", "app_current_version_ios", "app_update_url_android", "app_update_url_ios", "telegram_chat_ids", "show_subscriptions", "show_referral", "first_order_discount_percent", "first_order_discount_enabled"]);

      if (!error && data) {
        const whatsapp = data.find(d => d.key === "admin_whatsapp");
        const wallpaper = data.find(d => d.key === "splash_wallpaper");
        const version = data.find(d => d.key === "app_current_version");
        const versionIos = data.find(d => d.key === "app_current_version_ios");
        const urlAndroid = data.find(d => d.key === "app_update_url_android");
        const urlIos = data.find(d => d.key === "app_update_url_ios");
        const telegram = data.find(d => d.key === "telegram_chat_ids");
        const subs = data.find(d => d.key === "show_subscriptions");
        const referral = data.find(d => d.key === "show_referral");
        if (whatsapp) setAdminWhatsapp(whatsapp.value);
        if (wallpaper) setWallpaperUrl(wallpaper.value);
        if (version) setAppVersion(version.value);
        if (versionIos) setAppVersionIos(versionIos.value);
        if (urlAndroid) setUpdateUrlAndroid(urlAndroid.value);
        if (urlIos) setUpdateUrlIos(urlIos.value);
        if (telegram) setTelegramChatIds(telegram.value);
        if (subs) setShowSubscriptions(subs.value === "true");
        if (referral) setShowReferral(referral.value === "true");
        const firstOrder = data.find(d => d.key === "first_order_discount_percent");
        if (firstOrder) setFirstOrderDiscount(firstOrder.value);
        const firstOrderToggle = data.find(d => d.key === "first_order_discount_enabled");
        if (firstOrderToggle) setFirstOrderEnabled(firstOrderToggle.value === "true");
      }

    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("admin_settings")
        .upsert({ 
          key: "admin_whatsapp", 
          value: adminWhatsapp,
          updated_at: new Date().toISOString()
        }, { onConflict: "key" });

      if (error) throw error;
      toast({ title: "Settings saved!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveVersion = async () => {
    setIsSavingVersion(true);
    try {
      const { error } = await supabase
        .from("admin_settings")
        .upsert({ 
          key: "app_current_version", 
          value: appVersion,
          updated_at: new Date().toISOString()
        }, { onConflict: "key" });
      if (error) throw error;
      toast({ title: "App version updated! Users will see the update prompt." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSavingVersion(false);
    }
  };

  const handleSaveVersionIos = async () => {
    setIsSavingVersionIos(true);
    try {
      const { error } = await supabase
        .from("admin_settings")
        .upsert({
          key: "app_current_version_ios",
          value: appVersionIos,
          updated_at: new Date().toISOString()
        }, { onConflict: "key" });
      if (error) throw error;
      toast({ title: "iOS app version updated! iPhone users will see the update prompt." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSavingVersionIos(false);
    }
  };

  const handleSaveUpdateUrls = async () => {
    setIsSavingUrls(true);
    try {
      const rows = [
        { key: "app_update_url_android", value: updateUrlAndroid, updated_at: new Date().toISOString() },
        { key: "app_update_url_ios", value: updateUrlIos, updated_at: new Date().toISOString() },
      ];
      const { error } = await supabase.from("admin_settings").upsert(rows, { onConflict: "key" });
      if (error) throw error;
      toast({ title: "Store update URLs saved!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSavingUrls(false);
    }
  };

  const handleWallpaperUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingWallpaper(true);
    try {
      const fileName = `splash-wallpaper.png`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: settingsError } = await supabase
        .from("admin_settings")
        .upsert({
          key: "splash_wallpaper",
          value: publicUrl,
          updated_at: new Date().toISOString()
        }, { onConflict: "key" });

      if (settingsError) throw settingsError;

      setWallpaperUrl(publicUrl);
      toast({ title: "Wallpaper updated!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsUploadingWallpaper(false);
    }
  };

  const handleSaveFirstOrder = async () => {
    const value = parseFloat(firstOrderDiscount);
    if (isNaN(value) || value < 0 || value > 100) {
      toast({ title: "Invalid value", description: "Enter a number between 0 and 100", variant: "destructive" });
      return;
    }
    setIsSavingFirstOrder(true);
    try {
      const { error } = await supabase.from("admin_settings").upsert({
        key: "first_order_discount_percent",
        value: String(value),
        updated_at: new Date().toISOString(),
      }, { onConflict: "key" });
      if (error) throw error;
      toast({ title: "First-order discount updated!", description: `New users now get ${value}% off their first order.` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSavingFirstOrder(false);
    }
  };

  const handleToggleFirstOrder = async (enabled: boolean) => {
    setFirstOrderEnabled(enabled);
    setIsSavingFirstOrderToggle(true);
    try {
      const { error } = await supabase.from("admin_settings").upsert({
        key: "first_order_discount_enabled",
        value: enabled ? "true" : "false",
        updated_at: new Date().toISOString(),
      }, { onConflict: "key" });
      if (error) throw error;
      toast({ title: enabled ? "Welcome discount enabled" : "Welcome discount disabled", description: enabled ? "New users will get the first-order discount." : "No discount will be applied for new users." });
    } catch (error: any) {
      setFirstOrderEnabled(!enabled);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSavingFirstOrderToggle(false);
    }
  };

  return (
    <AdminLayout title="Settings">
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* WhatsApp Settings */}
          <div className="bg-amber-900/50 rounded-xl border border-amber-800 p-6">
            <h2 className="text-lg font-bold text-amber-100 mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5" />
              WhatsApp Notification Settings
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-amber-300 block mb-2">Admin WhatsApp Number(s)</label>
                <Input
                  value={adminWhatsapp}
                  onChange={(e) => setAdminWhatsapp(e.target.value)}
                  placeholder="919440229378, 919999999999"
                  className="bg-amber-800/50 border-amber-700 text-amber-100 max-w-md"
                />
                <p className="text-xs text-amber-400 mt-2">
                  Order alerts are sent to every number listed here. Separate multiple numbers with a comma.
                  Use country code without + (e.g., <span className="font-mono">919440229378, 919999999999</span>).
                </p>
              </div>
              <Button onClick={handleSave} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </div>

          {/* First-Order Discount */}
          <div className="bg-amber-900/50 rounded-xl border border-amber-800 p-6">
            <h2 className="text-lg font-bold text-amber-100 mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5" />
              First-Order Welcome Discount
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-amber-800/30 p-3 rounded-lg border border-amber-700">
                <div>
                  <p className="text-sm font-semibold text-amber-100">Enable welcome discount</p>
                  <p className="text-xs text-amber-400 mt-1">
                    {firstOrderEnabled ? "New users see the discount banner and get % off at checkout." : "No first-order discount is applied. Banner is hidden."}
                  </p>
                </div>
                <Switch
                  checked={firstOrderEnabled}
                  onCheckedChange={handleToggleFirstOrder}
                  disabled={isSavingFirstOrderToggle}
                />
              </div>
              <div>
                <label className="text-sm text-amber-300 block mb-2">Discount Percentage (0 – 100)</label>
                <div className="flex items-center gap-2 max-w-xs">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={firstOrderDiscount}
                    onChange={(e) => setFirstOrderDiscount(e.target.value)}
                    disabled={!firstOrderEnabled}
                    className="bg-amber-800/50 border-amber-700 text-amber-100 disabled:opacity-50"
                  />
                  <span className="text-amber-100 font-bold">%</span>
                </div>
                <p className="text-xs text-amber-400 mt-2">
                  Applied to every new user's first successful order (calculated off the original MRP).
                </p>
              </div>
              <Button onClick={handleSaveFirstOrder} disabled={isSavingFirstOrder || !firstOrderEnabled} className="bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4 mr-2" />
                {isSavingFirstOrder ? "Saving..." : "Save Discount %"}
              </Button>
            </div>
          </div>



          {/* Splash Wallpaper Settings */}
          <div className="bg-amber-900/50 rounded-xl border border-amber-800 p-6">
            <h2 className="text-lg font-bold text-amber-100 mb-4 flex items-center gap-2">
              <Image className="w-5 h-5" />
              Splash Screen Wallpaper
            </h2>
            <div className="space-y-4">
              {wallpaperUrl && (
                <div className="w-48 h-80 rounded-xl overflow-hidden border border-amber-700">
                  <img src={wallpaperUrl} alt="Current wallpaper" className="w-full h-full object-cover" />
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleWallpaperUpload}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingWallpaper}
                variant="outline"
                className="border-amber-700 text-amber-200 hover:bg-amber-800"
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploadingWallpaper ? "Uploading..." : "Upload New Wallpaper"}
              </Button>
              <p className="text-xs text-amber-400">
                Recommended: Portrait image (1080×1920px) for best results on mobile devices.
              </p>
            </div>
          </div>

          {/* App Version Settings - Android */}
          <div className="bg-amber-900/50 rounded-xl border border-amber-800 p-6">
            <h2 className="text-lg font-bold text-amber-100 mb-4 flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Android App Version (Play Store)
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-amber-300 block mb-2">Current Android Version</label>
                <Input
                  value={appVersion}
                  onChange={(e) => setAppVersion(e.target.value)}
                  placeholder="1.0.0"
                  className="bg-amber-800/50 border-amber-700 text-amber-100 max-w-md"
                />
                <p className="text-xs text-amber-400 mt-2">
                  Update this after publishing a new version to Play Store. Android users with older versions will see an update prompt.
                </p>
              </div>
              <Button onClick={handleSaveVersion} disabled={isSavingVersion} className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-2" />
                {isSavingVersion ? "Saving..." : "Update Android Version"}
              </Button>
            </div>
          </div>

          {/* App Version Settings - iOS */}
          <div className="bg-amber-900/50 rounded-xl border border-amber-800 p-6">
            <h2 className="text-lg font-bold text-amber-100 mb-4 flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              iOS App Version (App Store)
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-amber-300 block mb-2">Current iOS Version</label>
                <Input
                  value={appVersionIos}
                  onChange={(e) => setAppVersionIos(e.target.value)}
                  placeholder="1.0.0"
                  className="bg-amber-800/50 border-amber-700 text-amber-100 max-w-md"
                />
                <p className="text-xs text-amber-400 mt-2">
                  Update this after publishing a new version to the App Store. iPhone/iPad users with older versions will see an update prompt. Leave blank to skip iOS update checks.
                </p>
              </div>
              <Button onClick={handleSaveVersionIos} disabled={isSavingVersionIos} className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-2" />
                {isSavingVersionIos ? "Saving..." : "Update iOS Version"}
              </Button>
            </div>
          </div>

          {/* Store Update URLs (optional) */}
          <div className="bg-amber-900/50 rounded-xl border border-amber-800 p-6">
            <h2 className="text-lg font-bold text-amber-100 mb-4 flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Store Update URLs (optional)
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-amber-300 block mb-2">Android — Play Store URL</label>
                <Input
                  value={updateUrlAndroid}
                  onChange={(e) => setUpdateUrlAndroid(e.target.value)}
                  placeholder="https://play.google.com/store/apps/details?id=com.eggpro.app"
                  className="bg-amber-800/50 border-amber-700 text-amber-100 max-w-md"
                />
              </div>
              <div>
                <label className="text-sm text-amber-300 block mb-2">iOS — App Store URL</label>
                <Input
                  value={updateUrlIos}
                  onChange={(e) => setUpdateUrlIos(e.target.value)}
                  placeholder="https://apps.apple.com/app/idXXXXXXXXX"
                  className="bg-amber-800/50 border-amber-700 text-amber-100 max-w-md"
                />
                <p className="text-xs text-amber-400 mt-2">
                  Leave blank to use the built-in defaults. Setting these does not affect existing Android behavior.
                </p>
              </div>
              <Button onClick={handleSaveUpdateUrls} disabled={isSavingUrls} className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-2" />
                {isSavingUrls ? "Saving..." : "Save Store URLs"}
              </Button>
            </div>
          </div>


          {/* Telegram Notification Settings */}
          <div className="bg-amber-900/50 rounded-xl border border-amber-800 p-6">
            <h2 className="text-lg font-bold text-amber-100 mb-4 flex items-center gap-2">
              <Send className="w-5 h-5" />
              Telegram Notifications
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-amber-300 block mb-2">Telegram Chat IDs (comma-separated)</label>
                <Input
                  value={telegramChatIds}
                  onChange={(e) => setTelegramChatIds(e.target.value)}
                  placeholder="-1001234567890"
                  className="bg-amber-800/50 border-amber-700 text-amber-100 max-w-md"
                />
                <p className="text-xs text-amber-400 mt-2">
                  Add your bot to a group, send a message, then click "Detect Chats" to find the chat ID.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={async () => {
                    setIsFetchingChats(true);
                    try {
                      const { data, error } = await supabase.functions.invoke("telegram-get-chat-id");
                      if (error) throw error;
                      setDetectedChats(data.chats || []);
                      if (data.chats?.length === 0) {
                        toast({ title: "No chats found", description: "Send a message in a group with your bot first" });
                      }
                    } catch (e: any) {
                      toast({ title: "Error", description: e.message, variant: "destructive" });
                    } finally {
                      setIsFetchingChats(false);
                    }
                  }}
                  disabled={isFetchingChats}
                  variant="outline"
                  className="border-amber-700 text-amber-200 hover:bg-amber-800"
                >
                  {isFetchingChats ? "Detecting..." : "🔍 Detect Chats"}
                </Button>
                <Button
                  onClick={async () => {
                    setIsSavingTelegram(true);
                    try {
                      const { error } = await supabase.from("admin_settings").upsert({
                        key: "telegram_chat_ids",
                        value: telegramChatIds,
                        updated_at: new Date().toISOString()
                      }, { onConflict: "key" });
                      if (error) throw error;
                      toast({ title: "Telegram settings saved!" });
                    } catch (e: any) {
                      toast({ title: "Error", description: e.message, variant: "destructive" });
                    } finally {
                      setIsSavingTelegram(false);
                    }
                  }}
                  disabled={isSavingTelegram}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSavingTelegram ? "Saving..." : "Save"}
                </Button>
              </div>
              {detectedChats.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-amber-200 font-medium">Detected chats (click to add):</p>
                  {detectedChats.map((chat: any) => (
                    <button
                      key={chat.id}
                      onClick={() => {
                        const current = telegramChatIds ? telegramChatIds.split(",").map(s => s.trim()) : [];
                        if (!current.includes(String(chat.id))) {
                          setTelegramChatIds([...current, String(chat.id)].filter(Boolean).join(", "));
                        }
                      }}
                      className="block w-full text-left px-3 py-2 bg-amber-800/50 rounded-lg text-amber-100 text-sm hover:bg-amber-700/50 transition"
                    >
                      <span className="font-medium">{chat.title}</span>
                      <span className="text-amber-400 ml-2">({chat.type}) ID: {chat.id}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Subscription Toggle */}
          <div className="bg-amber-900/50 rounded-xl border border-amber-800 p-6">
            <h2 className="text-lg font-bold text-amber-100 mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Subscription Visibility
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 font-medium">Show Subscriptions</p>
                <p className="text-xs text-amber-400 mt-1">
                  When enabled, users can see subscription options. When disabled, only "Buy Once" is shown.
                </p>
              </div>
              <Switch
                checked={showSubscriptions}
                onCheckedChange={async (checked) => {
                  setShowSubscriptions(checked);
                  setIsSavingSubscription(true);
                  try {
                    const { error } = await supabase.from("admin_settings").upsert({
                      key: "show_subscriptions",
                      value: String(checked),
                      updated_at: new Date().toISOString()
                    }, { onConflict: "key" });
                    if (error) throw error;
                    toast({ title: checked ? "Subscriptions enabled" : "Subscriptions hidden" });
                  } catch (e: any) {
                    toast({ title: "Error", description: e.message, variant: "destructive" });
                    setShowSubscriptions(!checked);
                  } finally {
                    setIsSavingSubscription(false);
                  }
                }}
              />
            </div>
          </div>

          {/* Referral Toggle */}
          <div className="bg-amber-900/50 rounded-xl border border-amber-800 p-6">
            <h2 className="text-lg font-bold text-amber-100 mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Refer & Earn
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 font-medium">Show Refer & Earn</p>
                <p className="text-xs text-amber-400 mt-1">
                  When enabled, users can see the Refer tab and share referral codes to earn rewards.
                </p>
              </div>
              <Switch
                checked={showReferral}
                onCheckedChange={async (checked) => {
                  setShowReferral(checked);
                  setIsSavingReferral(true);
                  try {
                    const { error } = await supabase.from("admin_settings").upsert({
                      key: "show_referral",
                      value: String(checked),
                      updated_at: new Date().toISOString()
                    }, { onConflict: "key" });
                    if (error) throw error;
                    toast({ title: checked ? "Refer & Earn enabled" : "Refer & Earn hidden" });
                  } catch (e: any) {
                    toast({ title: "Error", description: e.message, variant: "destructive" });
                    setShowReferral(!checked);
                  } finally {
                    setIsSavingReferral(false);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
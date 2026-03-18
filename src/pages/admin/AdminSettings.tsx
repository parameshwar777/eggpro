import { useState, useEffect, useRef } from "react";
import { Save, Phone, Image, Upload, Smartphone, Send } from "lucide-react";
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
  const [isSavingVersion, setIsSavingVersion] = useState(false);
  const [telegramChatIds, setTelegramChatIds] = useState("");
  const [isSavingTelegram, setIsSavingTelegram] = useState(false);
  const [isFetchingChats, setIsFetchingChats] = useState(false);
  const [detectedChats, setDetectedChats] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("*")
        .in("key", ["admin_whatsapp", "splash_wallpaper", "app_current_version", "telegram_chat_ids"]);

      if (!error && data) {
        const whatsapp = data.find(d => d.key === "admin_whatsapp");
        const wallpaper = data.find(d => d.key === "splash_wallpaper");
        const version = data.find(d => d.key === "app_current_version");
        const telegram = data.find(d => d.key === "telegram_chat_ids");
        if (whatsapp) setAdminWhatsapp(whatsapp.value);
        if (wallpaper) setWallpaperUrl(wallpaper.value);
        if (version) setAppVersion(version.value);
        if (telegram) setTelegramChatIds(telegram.value);
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
                <label className="text-sm text-amber-300 block mb-2">Admin WhatsApp Number</label>
                <Input
                  value={adminWhatsapp}
                  onChange={(e) => setAdminWhatsapp(e.target.value)}
                  placeholder="919440229378"
                  className="bg-amber-800/50 border-amber-700 text-amber-100 max-w-md"
                />
                <p className="text-xs text-amber-400 mt-2">
                  Enter number with country code without + (e.g., 919440229378)
                </p>
              </div>
              <Button onClick={handleSave} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Saving..." : "Save Settings"}
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

          {/* App Version Settings */}
          <div className="bg-amber-900/50 rounded-xl border border-amber-800 p-6">
            <h2 className="text-lg font-bold text-amber-100 mb-4 flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              App Version (Play Store)
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-amber-300 block mb-2">Current App Version</label>
                <Input
                  value={appVersion}
                  onChange={(e) => setAppVersion(e.target.value)}
                  placeholder="1.0.0"
                  className="bg-amber-800/50 border-amber-700 text-amber-100 max-w-md"
                />
                <p className="text-xs text-amber-400 mt-2">
                  Update this after publishing a new version to Play Store. Users with older versions will see an update prompt.
                </p>
              </div>
              <Button onClick={handleSaveVersion} disabled={isSavingVersion} className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-2" />
                {isSavingVersion ? "Saving..." : "Update Version"}
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
        </div>
      )}
    </AdminLayout>
  );
};
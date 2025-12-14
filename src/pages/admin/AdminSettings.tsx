import { useState, useEffect } from "react";
import { Save, Phone } from "lucide-react";
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

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("*")
        .eq("key", "admin_whatsapp")
        .single();

      if (!error && data) {
        setAdminWhatsapp(data.value);
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
        }, { 
          onConflict: "key" 
        });

      if (error) throw error;

      toast({ title: "Settings saved!", description: "WhatsApp number updated successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
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
                  Enter number with country code without + (e.g., 919440229378 for +91 9440229378)
                </p>
              </div>

              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

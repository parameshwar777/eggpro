import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, MapPin, Trash2, Pencil, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Community {
  id: string;
  name: string;
  city: string;
  radius: number;
  delivery_hours: string;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  pincode: string;
  is_visible_production: boolean;
}

export const AdminCommunities = () => {
  const { toast } = useToast();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCommunity, setEditingCommunity] = useState<Community | null>(null);
  const [formData, setFormData] = useState({
    name: "", city: "Hyderabad", radius: "1.5", delivery_hours: "6 AM - 9 AM", latitude: "", longitude: "", pincode: ""
  });

  useEffect(() => { fetchCommunities(); }, []);

  const fetchCommunities = async () => {
    const { data, error } = await supabase.from("communities").select("*").order("name");
    if (!error) setCommunities((data as Community[]) || []);
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast({ title: "Error", description: "Please enter community name", variant: "destructive" });
      return;
    }

    const communityData = {
      name: formData.name,
      city: formData.city,
      radius: parseFloat(formData.radius),
      delivery_hours: formData.delivery_hours,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      pincode: formData.pincode,
    };

    try {
      if (editingCommunity) {
        const { error } = await supabase.from("communities").update(communityData).eq("id", editingCommunity.id);
        if (error) throw error;
        toast({ title: "Success", description: "Community updated" });
      } else {
        const { error } = await supabase.from("communities").insert(communityData);
        if (error) throw error;
        toast({ title: "Success", description: "Community added" });
      }
      setDialogOpen(false);
      setEditingCommunity(null);
      setFormData({ name: "", city: "Hyderabad", radius: "1.5", delivery_hours: "6 AM - 9 AM", latitude: "", longitude: "", pincode: "" });
      fetchCommunities();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (community: Community) => {
    setEditingCommunity(community);
    setFormData({
      name: community.name,
      city: community.city,
      radius: community.radius.toString(),
      delivery_hours: community.delivery_hours,
      latitude: community.latitude?.toString() || "",
      longitude: community.longitude?.toString() || "",
      pincode: community.pincode || "",
    });
    setDialogOpen(true);
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from("communities").update({ is_active: !currentStatus }).eq("id", id);
    if (!error) fetchCommunities();
  };

  const toggleProductionVisibility = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from("communities").update({ is_visible_production: !currentStatus }).eq("id", id);
    if (!error) {
      fetchCommunities();
      toast({ title: !currentStatus ? "Visible in production" : "Hidden from production" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this community?")) return;
    const { error } = await supabase.from("communities").delete().eq("id", id);
    if (!error) {
      toast({ title: "Deleted" });
      fetchCommunities();
    }
  };

  return (
    <AdminLayout title="Communities" headerActions={
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button size="sm" onClick={() => { setEditingCommunity(null); setFormData({ name: "", city: "Hyderabad", radius: "1.5", delivery_hours: "6 AM - 9 AM", latitude: "", longitude: "", pincode: "" }); }}>
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingCommunity ? "Edit" : "Add"} Community</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Community Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="City" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
              <Input placeholder="Pincode" value={formData.pincode} onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} maxLength={6} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Radius (km)" type="number" value={formData.radius} onChange={(e) => setFormData({ ...formData, radius: e.target.value })} />
              <Input placeholder="Delivery Hours" value={formData.delivery_hours} onChange={(e) => setFormData({ ...formData, delivery_hours: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Latitude" type="number" step="any" value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} />
              <Input placeholder="Longitude" type="number" step="any" value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} />
            </div>
            <Button onClick={handleSubmit} className="w-full">{editingCommunity ? "Update" : "Add"} Community</Button>
          </div>
        </DialogContent>
      </Dialog>
    }>
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {communities.map((c) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-amber-900/50 rounded-xl p-4 border border-amber-800">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-amber-100">{c.name}</h3>
                </div>
                <div className="flex gap-1">
                  <Badge variant={c.is_active ? "default" : "secondary"} className="text-xs">{c.is_active ? "Active" : "Inactive"}</Badge>
                  {c.is_visible_production && (
                    <Badge className="bg-green-600 text-xs">Production</Badge>
                  )}
                </div>
              </div>
              <p className="text-sm text-amber-300 mb-1">{c.city} {c.pincode && `- ${c.pincode}`}</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-amber-400 mb-3">
                <div>Radius: <span className="text-amber-200">{c.radius} km</span></div>
                <div>Hours: <span className="text-amber-200">{c.delivery_hours}</span></div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button size="sm" variant="outline" className="flex-1 border-amber-700 text-amber-200 hover:bg-amber-800" onClick={() => toggleProductionVisibility(c.id, c.is_visible_production)}>
                  {c.is_visible_production ? <><EyeOff className="w-3 h-3 mr-1" /> Hide</> : <><Eye className="w-3 h-3 mr-1" /> Show in Prod</>}
                </Button>
                <Button size="sm" variant="ghost" className="text-amber-300" onClick={() => handleEdit(c)}><Pencil className="w-4 h-4" /></Button>
                <Button size="sm" variant="ghost" className="text-red-400" onClick={() => handleDelete(c.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};
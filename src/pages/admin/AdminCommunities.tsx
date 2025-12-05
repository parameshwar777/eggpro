import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, MapPin, Trash2, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
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
}

export const AdminCommunities = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCommunity, setEditingCommunity] = useState<Community | null>(null);
  const [formData, setFormData] = useState({
    name: "", city: "Hyderabad", radius: "1.5", delivery_hours: "6 AM - 9 AM", latitude: "", longitude: ""
  });

  useEffect(() => {
    if (!authLoading && !isAdmin) navigate("/admin");
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => { fetchCommunities(); }, []);

  const fetchCommunities = async () => {
    const { data, error } = await supabase.from("communities").select("*").order("name");
    if (!error) setCommunities(data || []);
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
      setFormData({ name: "", city: "Hyderabad", radius: "1.5", delivery_hours: "6 AM - 9 AM", latitude: "", longitude: "" });
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
    });
    setDialogOpen(true);
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from("communities").update({ is_active: !currentStatus }).eq("id", id);
    if (!error) fetchCommunities();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this community?")) return;
    const { error } = await supabase.from("communities").delete().eq("id", id);
    if (!error) {
      toast({ title: "Deleted" });
      fetchCommunities();
    }
  };

  if (authLoading || isLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/admin")} className="p-2 rounded-full bg-slate-100"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-lg font-bold">Communities</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => { setEditingCommunity(null); setFormData({ name: "", city: "Hyderabad", radius: "1.5", delivery_hours: "6 AM - 9 AM", latitude: "", longitude: "" }); }}>
              <Plus className="w-4 h-4 mr-1" /> Add Community
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingCommunity ? "Edit" : "Add"} Community</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Community Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              <Input placeholder="City" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
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
      </div>

      <div className="p-4 grid gap-3 md:grid-cols-2">
        {communities.map((c) => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <h3 className="font-semibold">{c.name}</h3>
              </div>
              <Badge variant={c.is_active ? "default" : "secondary"}>{c.is_active ? "Active" : "Inactive"}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-1">{c.city}</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
              <div>Radius: <span className="text-foreground">{c.radius} km</span></div>
              <div>Hours: <span className="text-foreground">{c.delivery_hours}</span></div>
            </div>
            {c.latitude && c.longitude && (
              <p className="text-xs text-primary mb-3">{c.latitude}, {c.longitude}</p>
            )}
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => toggleActive(c.id, c.is_active)}>
                {c.is_active ? "Deactivate" : "Activate"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleEdit(c)}><Pencil className="w-4 h-4" /></Button>
              <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(c.id)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
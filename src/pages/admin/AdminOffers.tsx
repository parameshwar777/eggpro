import { useState, useEffect } from "react";
import { Plus, Trash2, Upload, X, Image as ImageIcon, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Offer {
  id: string;
  title: string;
  description: string | null;
  discount_percentage: number | null;
  code: string | null;
  is_active: boolean | null;
  valid_from: string | null;
  valid_until: string | null;
  image_url: string | null;
  created_at: string;
}

const emptyForm = {
  title: "",
  description: "",
  discount_percentage: "",
  code: "",
  valid_from: "",
  valid_until: "",
  image_url: "",
};

export const AdminOffers = () => {
  const { toast } = useToast();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchOffers(); }, []);

  const fetchOffers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from("offers").select("*").order("created_at", { ascending: false });
    if (!error) setOffers((data || []) as Offer[]);
    setIsLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `offers/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
      setFormData((f) => ({ ...f, image_url: publicUrl }));
      toast({ title: "Image uploaded" });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setFormData({ ...emptyForm });
    setDialogOpen(true);
  };

  const openEdit = (o: Offer) => {
    setEditingId(o.id);
    setFormData({
      title: o.title || "",
      description: o.description || "",
      discount_percentage: o.discount_percentage?.toString() || "",
      code: o.code || "",
      valid_from: o.valid_from ? new Date(o.valid_from).toISOString().slice(0, 16) : "",
      valid_until: o.valid_until ? new Date(o.valid_until).toISOString().slice(0, 16) : "",
      image_url: o.image_url || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    if (!formData.discount_percentage) {
      toast({ title: "Discount % is required", variant: "destructive" });
      return;
    }
    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      discount_percentage: parseInt(formData.discount_percentage),
      code: formData.code.trim().toUpperCase() || null,
      valid_from: formData.valid_from ? new Date(formData.valid_from).toISOString() : null,
      valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
      image_url: formData.image_url || null,
    };
    try {
      if (editingId) {
        const { error } = await supabase.from("offers").update(payload).eq("id", editingId);
        if (error) throw error;
        toast({ title: "Offer updated" });
      } else {
        const { error } = await supabase.from("offers").insert({ ...payload, is_active: true });
        if (error) throw error;
        toast({ title: "Offer created" });
      }
      setDialogOpen(false);
      fetchOffers();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("offers").update({ is_active: !current }).eq("id", id);
    fetchOffers();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this offer?")) return;
    await supabase.from("offers").delete().eq("id", id);
    toast({ title: "Offer deleted" });
    fetchOffers();
  };

  const fmt = (d: string | null) => d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

  return (
    <AdminLayout title="Offers & Coupons">
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Offers & Coupons</h1>
            <p className="text-sm text-muted-foreground mt-1">Festival banners and coupon codes shown to customers</p>
          </div>
          <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" /> New Offer</Button>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Offer" : "Create New Offer"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Offer Title *</Label>
                <p className="text-xs text-muted-foreground mb-1">Short name shown on the banner (e.g. "Diwali Special")</p>
                <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Diwali Special" />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <p className="text-xs text-muted-foreground mb-1">Tagline displayed below the title</p>
                <Textarea id="description" rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Flat 20% off on all eggs" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="discount">Discount % *</Label>
                  <p className="text-xs text-muted-foreground mb-1">Applied at checkout</p>
                  <Input id="discount" type="number" min="1" max="100" value={formData.discount_percentage} onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })} placeholder="20" />
                </div>
                <div>
                  <Label htmlFor="code">Coupon Code</Label>
                  <p className="text-xs text-muted-foreground mb-1">User types this</p>
                  <Input id="code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="DIWALI20" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="from">Valid From</Label>
                  <p className="text-xs text-muted-foreground mb-1">Offer starts</p>
                  <Input id="from" type="datetime-local" value={formData.valid_from} onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="until">Valid Until</Label>
                  <p className="text-xs text-muted-foreground mb-1">Offer expires</p>
                  <Input id="until" type="datetime-local" value={formData.valid_until} onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })} />
                </div>
              </div>

              <div>
                <Label>Banner Image</Label>
                <p className="text-xs text-muted-foreground mb-1">Shown on the home page (recommended 1200×600)</p>
                {formData.image_url ? (
                  <div className="relative">
                    <img src={formData.image_url} alt="" className="w-full h-40 object-cover rounded-lg border" />
                    <button onClick={() => setFormData({ ...formData, image_url: "" })} className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-full">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                    <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                    <span className="text-sm text-muted-foreground">{uploading ? "Uploading..." : "Click to upload"}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                  </label>
                )}
              </div>

              <Button onClick={handleSubmit} className="w-full" disabled={uploading}>
                {editingId ? "Save Changes" : "Create Offer"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
        ) : offers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
            No offers yet. Create one to show a banner on the home page.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {offers.map((offer) => (
              <div key={offer.id} className="bg-card rounded-xl border overflow-hidden">
                {offer.image_url ? (
                  <img src={offer.image_url} alt={offer.title} className="w-full h-36 object-cover" />
                ) : (
                  <div className="w-full h-36 bg-muted flex items-center justify-center text-muted-foreground">
                    <ImageIcon className="w-10 h-10" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold truncate">{offer.title}</h3>
                        <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full whitespace-nowrap">{offer.discount_percentage}% OFF</span>
                      </div>
                      {offer.description && <p className="text-sm text-muted-foreground mt-1">{offer.description}</p>}
                      {offer.code && <p className="text-primary font-mono text-sm mt-2">Code: {offer.code}</p>}
                      <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
                        <p>From: {fmt(offer.valid_from)}</p>
                        <p>Until: {fmt(offer.valid_until)}</p>
                      </div>
                    </div>
                    <Switch checked={!!offer.is_active} onCheckedChange={() => toggleActive(offer.id, !!offer.is_active)} />
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(offer)}>
                      <Pencil className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-500" onClick={() => handleDelete(offer.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

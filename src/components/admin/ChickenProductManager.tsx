import { useEffect, useRef, useState } from "react";
import { Plus, Pencil, Crop, Upload, Archive, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SafeImage } from "@/components/BrandLogo";
import { BusinessImageCropDialog } from "@/components/admin/BusinessImageCropDialog";
import { mediaUrl, uploadBusinessImage, logAdminAction } from "@/lib/media";
import { CHICKEN_WEIGHTS, groupChickenProducts } from "@/lib/chickenProducts";
import { useToast } from "@/hooks/use-toast";

type Row = { id: string; name: string; description: string | null; image_path: string | null; weight: string | null; price: number; offer_price: number | null; active: boolean; available: boolean; display_order: number };
type Variant = { id?: string; weight: string; price: string; offer_price: string; available: boolean; enabled: boolean };
const empty = () => ({ name: "", description: "", image_path: null as string | null, active: true, display_order: 0 });
export function ChickenProductManager() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty());
  const [variants, setVariants] = useState<Variant[]>([]);
  const [originalIds, setOriginalIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  async function load() {
    const { data, error } = await supabase.from("chicken_products").select("*").eq("archived", false).order("display_order");
    if (error) toast({ title: "Could not load products", description: error.message, variant: "destructive" });
    setRows(data || []); setLoading(false);
  }
  useEffect(() => { void load(); }, []);
  function edit(group: Row[] = []) {
    const first = group[0];
    setForm(first ? { name: first.name, description: first.description || "", image_path: first.image_path, active: group.some(r => r.active), display_order: first.display_order } : empty());
    setOriginalIds(group.map(r => r.id));
    const list: Variant[] = CHICKEN_WEIGHTS.map(w => {
      const r = group.find(row => row.weight === w.value);
      return { id: r?.id, weight: w.value, price: r ? String(r.price) : "", offer_price: r?.offer_price ? String(r.offer_price) : "", available: r?.available ?? true, enabled: r ? true : !first && w.value === "1 kg" };
    });
    group.filter(r => !CHICKEN_WEIGHTS.some(w => w.value === r.weight)).forEach(r => list.push({ id: r.id, weight: r.weight || "", price: String(r.price), offer_price: r.offer_price ? String(r.offer_price) : "", available: r.available, enabled: true }));
    setVariants(list); setOpen(true);
  }
  function change(index: number, patch: Partial<Variant>) { setVariants(prev => prev.map((v, i) => i === index ? { ...v, ...patch } : v)); }
  async function save() {
    const selected = variants.filter(v => v.enabled);
    if (!form.name.trim() || !selected.length || selected.some(v => !v.weight.trim() || !(Number(v.price) > 0) || (v.offer_price !== "" && !(Number(v.offer_price) > 0)))) return toast({ title: "Enter a name, weight and valid prices", variant: "destructive" });
    if (new Set(selected.map(v => v.weight.trim())).size !== selected.length) return toast({ title: "Each weight must be unique", variant: "destructive" });
    if (rows.some(r => !originalIds.includes(r.id) && r.name === form.name.trim())) return toast({ title: "This product already exists. Edit its weights instead.", variant: "destructive" });
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const payload = selected.map(v => ({ id: v.id || crypto.randomUUID(), name: form.name.trim(), description: form.description.trim() || null, image_path: form.image_path, active: form.active, archived: false, display_order: Number(form.display_order) || 0, weight: v.weight.trim(), price: Number(v.price), offer_price: v.offer_price === "" ? null : Number(v.offer_price), available: v.available, updated_by: auth.user?.id }));
      const { error } = await supabase.from("chicken_products").upsert(payload);
      if (error) throw error;
      const removed = originalIds.filter(id => !selected.some(v => v.id === id));
      if (removed.length) {
        const result = await supabase.from("chicken_products").update({ active: false, archived: true }).in("id", removed);
        if (result.error) throw result.error;
      }
      await logAdminAction("chicken_products", originalIds[0] || payload[0]?.id || null, "save_weight_group", payload);
      setOpen(false); toast({ title: "Product and weights saved" }); await load();
    } catch (error) { toast({ title: "Save failed", description: error instanceof Error ? error.message : "Please try again", variant: "destructive" }); }
    finally { setSaving(false); }
  }
  async function updateGroup(group: Row[], patch: { active?: boolean; archived?: boolean }) {
    const { error } = await supabase.from("chicken_products").update(patch).in("id", group.map(r => r.id));
    if (error) return toast({ title: "Update failed", description: error.message, variant: "destructive" });
    await logAdminAction("chicken_products", group[0]?.id || null, "update_weight_group", patch); await load();
  }
  return <div className="space-y-4">
    <Button className="h-12" onClick={() => edit()}><Plus />ADD CHICKEN PRODUCT</Button>
    {loading ? <Loader2 className="animate-spin text-primary" /> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{groupChickenProducts(rows).map(group => {
      const first = group[0];
      return <article key={first.name} className="rounded-lg overflow-hidden bg-card text-card-foreground border border-border">
        <SafeImage src={mediaUrl(first.image_path)} alt={first.name} fit="contain" className="w-full aspect-square max-h-64" />
        <div className="p-4 space-y-3"><h3 className="text-lg">{first.name}</h3>
          {group.map(v => <div key={v.id} className="flex justify-between gap-2 text-sm"><span>{v.weight || "Standard"}{!v.available && " · Out of stock"}</span><span>₹{v.price}{v.offer_price ? ` · Offer ₹${v.offer_price}` : ""}</span></div>)}
          <div className="flex justify-between items-center gap-3"><label className="font-bold text-sm">Show in app</label><Switch aria-label={`Show ${first.name} in app`} checked={group.some(r => r.active)} onCheckedChange={active => void updateGroup(group, { active })} /></div>
          <div className="flex gap-2"><Button variant="secondary" className="h-12 flex-1" onClick={() => edit(group)}><Pencil />EDIT</Button><Button variant="outline" size="icon" className="h-12 w-12" aria-label={`Archive ${first.name}`} onClick={() => { if (confirm(`Archive ${first.name} and all weights?`)) void updateGroup(group, { archived: true, active: false }); }}><Archive /></Button></div>
        </div></article>;
    })}</div>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>{originalIds.length ? "Edit Chicken Product" : "Add Chicken Product"}</DialogTitle></DialogHeader>
      <div className="space-y-4">
        <label className="block">Product name<Input aria-label="Product name" className="h-12 mt-1" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
        <label className="block">Description<Textarea aria-label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
        <SafeImage src={mediaUrl(form.image_path)} alt="Product photo" fit="contain" className="w-full aspect-square max-h-64" />
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => { setCropFile(e.target.files?.[0] || null); e.target.value = ""; }} />
        <div className="flex flex-wrap gap-2"><Button variant="secondary" className="h-12" disabled={uploading} onClick={() => fileRef.current?.click()}><Upload />{form.image_path ? "REPLACE PHOTO" : "UPLOAD PHOTO"}</Button>{form.image_path && <><Button variant="outline" className="h-12" onClick={async () => { try { const response = await fetch(mediaUrl(form.image_path) || ""); if (!response.ok) throw new Error("Photo unavailable"); const blob = await response.blob(); setCropFile(new File([blob], "photo", { type: blob.type })); } catch { toast({ title: "Could not open photo", variant: "destructive" }); } }}><Crop />CROP</Button><Button variant="outline" className="h-12" onClick={() => setForm({ ...form, image_path: null })}>REMOVE</Button></>}</div>
        <h3 className="text-lg border-t border-border pt-4">Weights &amp; prices</h3>
        {variants.map((v, i) => <section key={i} className="border-b border-border pb-4 space-y-3">
          <div className="flex items-center justify-between"><label>{CHICKEN_WEIGHTS.find(w => w.value === v.weight)?.label || v.weight || "Custom weight"}</label><Switch aria-label={`Enable ${v.weight || "custom weight"}`} checked={v.enabled} onCheckedChange={enabled => change(i, { enabled })} /></div>
          {v.enabled && <>{!CHICKEN_WEIGHTS.some(w => w.value === v.weight) && <Input aria-label="Custom weight" className="h-12" value={v.weight} onChange={e => change(i, { weight: e.target.value })} />}<div className="grid grid-cols-2 gap-3"><label>Price (₹)<Input aria-label={`Price ${v.weight}`} className="h-12" type="number" min="0.01" value={v.price} onChange={e => change(i, { price: e.target.value })} /></label><label>Offer price (₹)<Input aria-label={`Offer price ${v.weight}`} className="h-12" type="number" min="0.01" value={v.offer_price} onChange={e => change(i, { offer_price: e.target.value })} /></label></div><div className="flex justify-between"><span>In stock</span><Switch aria-label={`In stock ${v.weight}`} checked={v.available} onCheckedChange={available => change(i, { available })} /></div></>}
        </section>)}
        <Button variant="outline" className="h-12" onClick={() => setVariants(prev => [...prev, { weight: "", price: "", offer_price: "", available: true, enabled: true }])}><Plus />CUSTOM WEIGHT</Button>
        <div className="flex justify-between"><span>Show in app</span><Switch aria-label="Show product in app" checked={form.active} onCheckedChange={active => setForm({ ...form, active })} /></div>
        <label className="block">Display order<Input type="number" className="h-12" value={form.display_order} onChange={e => setForm({ ...form, display_order: Number(e.target.value) })} /></label>
        <Button className="h-12 w-full" disabled={saving || uploading} onClick={() => void save()}>{saving && <Loader2 className="animate-spin" />}SAVE PRODUCT</Button>
      </div></DialogContent></Dialog>
    <BusinessImageCropDialog file={cropFile} aspect={1} onClose={() => setCropFile(null)} onSelect={async file => { setUploading(true); try { const path = await uploadBusinessImage(file, "chicken/products"); setForm(prev => ({ ...prev, image_path: path })); } catch (error) { toast({ title: "Upload failed", description: error instanceof Error ? error.message : "Try again", variant: "destructive" }); throw error; } finally { setUploading(false); } }} />
  </div>;
}
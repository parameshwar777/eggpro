import { useEffect, useRef, useState } from "react";
import { Plus, Pencil, Upload, Trash2, Loader2, Eye, EyeOff, Crop } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { SafeImage } from "@/components/BrandLogo";
import { uploadBusinessImage, removeBusinessImage, mediaUrl, logAdminAction } from "@/lib/media";
import { BusinessImageCropDialog } from "@/components/admin/BusinessImageCropDialog";

export type FieldType = "text" | "textarea" | "number" | "boolean" | "image";
export interface FieldDef { key: string; label: string; type: FieldType; required?: boolean; placeholder?: string; help?: string }

interface Props {
  table: "chicken_products" | "chicken_pickup_centers" | "cafe_locations";
  entityLabel: string;
  addLabel: string;
  imageFolder: string;
  imageButton: string;
  fields: FieldDef[];
  /** Fields shown on each card under the title. */
  summary: (row: any) => React.ReactNode;
  defaults: Record<string, any>;
  /** Extra filter for archived etc. */
  hideRow?: (row: any) => boolean;
  extraActions?: (row: any, reload: () => void) => React.ReactNode;
}

export const AdminCrudManager = ({ table, entityLabel, addLabel, imageFolder, imageButton, fields, summary, defaults, hideRow, extraActions }: Props) => {
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, any>>(defaults);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const imageAspect = table === "chicken_products" ? 1 : 16 / 9;

  const cropExisting = async () => {
    const url = mediaUrl(form.image_path);
    if (!url) return;
    setUploading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Could not open photo");
      const blob = await response.blob();
      setCropFile(new File([blob], "photo", { type: blob.type }));
    } catch (e) {
      toast({ title: "Could not open photo", description: e instanceof Error ? e.message : "Try replacing the photo", variant: "destructive" });
    } finally { setUploading(false); }
  };

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase.from(table) as any).select("*").order("display_order").order("created_at");
    if (error) toast({ title: "Could not load", description: error.message, variant: "destructive" });
    setRows((data || []).filter((r: any) => !hideRow?.(r)));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const startAdd = () => { setEditingId(null); setForm({ ...defaults, display_order: rows.length + 1 }); setOpen(true); };
  const startEdit = (r: any) => { setEditingId(r.id); setForm({ ...r }); setOpen(true); };

  const onFile = async (f?: File) => {
    if (!f) return;
    setUploading(true);
    try {
      const path = await uploadBusinessImage(f, imageFolder);
      setForm((s) => ({ ...s, image_path: path }));
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
      throw e;
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async () => {
    for (const f of fields) {
      if (f.required && (form[f.key] === undefined || form[f.key] === null || String(form[f.key]).trim() === "")) {
        return toast({ title: `${f.label} is required`, variant: "destructive" });
      }
    }
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const payload: Record<string, any> = { updated_by: u.user?.id };
    for (const f of fields) {
      let v = form[f.key];
      if (f.type === "number") v = v === "" || v === null || v === undefined ? null : Number(v);
      if (f.type === "text" || f.type === "textarea") v = typeof v === "string" ? v.trim() : v ?? null;
      payload[f.key] = v === "" ? null : v;
    }
    if ("address" in payload && payload.address === null) payload.address = "";
    payload.display_order = Number(form.display_order) || 0;
    const q = supabase.from(table) as any;
    const { error } = editingId ? await q.update(payload).eq("id", editingId) : await q.insert(payload);
    setSaving(false);
    if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
    // clean old image if replaced
    const old = rows.find((r) => r.id === editingId);
    if (old?.image_path && old.image_path !== payload.image_path) removeBusinessImage(old.image_path);
    logAdminAction(table, editingId, editingId ? "update" : "create", payload);
    toast({ title: "Saved" });
    setOpen(false);
    load();
  };

  const toggleActive = async (r: any) => {
    const { error } = await (supabase.from(table) as any).update({ active: !r.active }).eq("id", r.id);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    logAdminAction(table, r.id, r.active ? "disable" : "enable");
    load();
  };

  return (
    <div className="space-y-4">
      <Button onClick={startAdd} className="w-full sm:w-auto h-12 font-bold"><Plus className="w-5 h-5 mr-2" />{addLabel}</Button>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-amber-300" /></div>
      ) : rows.length === 0 ? (
        <p className="text-amber-300 font-semibold">No {entityLabel.toLowerCase()} yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => (
            <div key={r.id} className="bg-amber-900/50 border border-amber-800 rounded-xl overflow-hidden">
              <SafeImage src={mediaUrl(r.image_path)} alt={r.name} fit="contain" className={`w-full ${table === "chicken_products" ? "aspect-square max-h-72" : "aspect-video"}`} label="No image" />
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-amber-100">{r.name}</p>
                  <span className={`text-[10px] font-extrabold px-2 py-1 rounded-full ${r.active ? "bg-green-600 text-white" : "bg-stone-600 text-stone-200"}`}>{r.active ? "ACTIVE" : "DISABLED"}</span>
                </div>
                <div className="text-sm text-amber-300 space-y-0.5">{summary(r)}</div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button size="sm" variant="secondary" className="h-10" onClick={() => startEdit(r)}><Pencil className="w-4 h-4 mr-1" />EDIT</Button>
                  <Button size="sm" variant="outline" className="h-10" onClick={() => toggleActive(r)}>
                    {r.active ? <><EyeOff className="w-4 h-4 mr-1" />DISABLE</> : <><Eye className="w-4 h-4 mr-1" />ENABLE</>}
                  </Button>
                  {extraActions?.(r, load)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? `Edit ${entityLabel}` : addLabel.replace("+ ", "")}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="text-sm font-bold block mb-1">{f.label}{f.required && " *"}</label>
                {f.type === "text" && <Input className="h-12" value={form[f.key] ?? ""} placeholder={f.placeholder} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />}
                {f.type === "number" && <Input className="h-12" type="number" inputMode="decimal" value={form[f.key] ?? ""} placeholder={f.placeholder} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />}
                {f.type === "textarea" && <Textarea value={form[f.key] ?? ""} placeholder={f.placeholder} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />}
                {f.type === "boolean" && <div className="flex items-center gap-3 h-12"><Switch checked={!!form[f.key]} onCheckedChange={(v) => setForm({ ...form, [f.key]: v })} /><span className="text-sm">{form[f.key] ? "Yes" : "No"}</span></div>}
                {f.type === "image" && (
                  <div className="space-y-2">
                    <SafeImage src={mediaUrl(form.image_path)} alt="Photo preview" fit="contain" className={`w-full rounded-lg ${table === "chicken_products" ? "aspect-square max-h-72" : "aspect-video"}`} label="No image (optional)" />
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) setCropFile(file); e.target.value = ""; }} />
                    <div className="flex gap-2">
                      <Button type="button" variant="secondary" className="h-12 flex-1" disabled={uploading} onClick={() => fileRef.current?.click()}>
                        {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                        {form.image_path ? "REPLACE IMAGE" : imageButton}
                      </Button>
                      {form.image_path && <Button type="button" variant="destructive" className="h-12" onClick={() => setForm({ ...form, image_path: null })}><Trash2 className="w-4 h-4" /></Button>}
                    </div>
                    {form.image_path && <Button type="button" variant="outline" className="h-12 w-full" disabled={uploading} onClick={() => void cropExisting()}><Crop />CROP IMAGE</Button>}
                  </div>
                )}
                {f.help && <p className="text-xs text-muted-foreground mt-1">{f.help}</p>}
              </div>
            ))}
            <div>
              <label className="text-sm font-bold block mb-1">Display Order</label>
              <Input className="h-12" type="number" value={form.display_order ?? 0} onChange={(e) => setForm({ ...form, display_order: e.target.value })} />
              <p className="text-xs text-muted-foreground mt-1">Lower numbers appear first.</p>
            </div>
            <Button onClick={save} disabled={saving || uploading} className="w-full h-12 font-bold">{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}SAVE</Button>
          </div>
        </DialogContent>
      </Dialog>
      <BusinessImageCropDialog file={cropFile} aspect={imageAspect} onClose={() => setCropFile(null)} onSelect={onFile} />
    </div>
  );
};

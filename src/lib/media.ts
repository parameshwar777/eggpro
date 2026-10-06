import { supabase } from "@/integrations/supabase/client";

const BUCKET = "product-images";
const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

/** Resize/compress an image in the browser (max 1600px, JPEG/WEBP ~0.82). */
async function compress(file: File): Promise<Blob> {
  if (file.size < 400 * 1024) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const type = file.type === "image/png" ? "image/webp" : "image/jpeg";
    return await new Promise<Blob>((res) => canvas.toBlob((b) => res(b || file), type, 0.82));
  } catch {
    return file;
  }
}

/** Uploads an image from the device and returns its storage path. */
export async function uploadBusinessImage(file: File, folder: string): Promise<string> {
  if (!ALLOWED.includes(file.type)) throw new Error("Please choose a JPG, PNG or WEBP image");
  const blob = await compress(file);
  const ext = blob.type === "image/webp" ? "webp" : blob.type === "image/png" ? "png" : "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: blob.type || file.type });
  if (error) throw error;
  return path;
}

export async function removeBusinessImage(path?: string | null) {
  if (!path || path.startsWith("http")) return;
  await supabase.storage.from(BUCKET).remove([path]);
}

/** Public URL for a stored path; returns null when nothing is set. */
export function mediaUrl(path?: string | null): string | null {
  if (!path || !path.trim()) return null;
  if (path.startsWith("http")) return path;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function logAdminAction(entity: string, entityId: string | null, action: string, details?: unknown) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase.from("admin_audit_log").insert({ actor_id: data.user.id, entity, entity_id: entityId, action, details: (details ?? null) as any });
}

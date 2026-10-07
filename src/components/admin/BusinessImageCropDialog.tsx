import { useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Crop, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
  file: File | null;
  aspect: number;
  onClose: () => void;
  onSelect: (file: File) => Promise<void>;
}

export function BusinessImageCropDialog({ file, aspect, onClose, onSelect }: Props) {
  const [url, setUrl] = useState("");
  const [cropping, setCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    setCropping(false);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setArea(null);
    setError("");
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const select = async (useCrop: boolean) => {
    if (!file || (useCrop && !area)) return;
    setBusy(true);
    setError("");
    try {
      let output = file;
      if (useCrop && area) {
        const bitmap = await createImageBitmap(file);
        try {
          const canvas = document.createElement("canvas");
          const scale = Math.min(1, 1600 / Math.max(area.width, area.height));
          canvas.width = Math.round(area.width * scale);
          canvas.height = Math.round(area.height * scale);
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Could not crop this photo");
          ctx.drawImage(bitmap, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);
          const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.9));
          if (!blob) throw new Error("Could not save this crop");
          output = new File([blob], "cropped-photo.webp", { type: "image/webp" });
        } finally {
          bitmap.close();
        }
      }
      await onSelect(output);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save this photo");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!file} onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
        <DialogHeader><DialogTitle>{cropping ? "Crop photo" : "Photo preview"}</DialogTitle></DialogHeader>
        <div className="relative h-72 sm:h-80 bg-muted overflow-hidden rounded-lg">
          {url && (cropping ? (
            <Cropper image={url} crop={crop} zoom={zoom} aspect={aspect} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, pixels) => setArea(pixels)} />
          ) : <img src={url} alt="Selected photo" className="w-full h-full object-contain" />)}
        </div>
        {cropping && <div className="space-y-2"><label className="text-sm font-bold">Zoom</label><Slider aria-label="Photo zoom" value={[zoom]} min={1} max={3} step={0.05} onValueChange={([value]) => setZoom(value)} /></div>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={busy} className="h-12 flex-1" onClick={() => cropping ? setCropping(false) : setCropping(true)}><Crop />{cropping ? "Full photo" : "Crop photo"}</Button>
          <Button disabled={busy || (cropping && !area)} className="h-12 flex-1" onClick={() => void select(cropping)}>{busy && <Loader2 className="animate-spin" />}{cropping ? "Use crop" : "Use full photo"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
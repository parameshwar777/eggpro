import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** Opens the back camera and returns the first pickup code it reads. */
export function PickupQrScanner({ open, onClose, onCode }: { open: boolean; onClose: () => void; onCode: (code: string) => void }) {
  const [error, setError] = useState("");
  const done = useRef(false);
  useEffect(() => {
    if (!open) return;
    done.current = false; setError("");
    let scanner: Html5Qrcode | null = null;
    const t = setTimeout(() => {
      scanner = new Html5Qrcode("pickup-qr-reader");
      scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: 230 }, text => {
        if (done.current) return; done.current = true;
        onCode(text.trim().toUpperCase());
      }, () => {}).catch(() => setError("Camera could not start. Allow camera access, or type the code in search."));
    }, 150);
    return () => { clearTimeout(t); if (scanner?.isScanning) void scanner.stop().catch(() => {}); };
  }, [open, onCode]);
  return <Dialog open={open} onOpenChange={o => !o && onClose()}>
    <DialogContent className="max-w-sm">
      <DialogHeader><DialogTitle>Scan pickup QR</DialogTitle></DialogHeader>
      <div id="pickup-qr-reader" className="w-full min-h-64 rounded-lg overflow-hidden bg-muted" />
      {error && <p role="alert" className="text-destructive font-semibold text-sm">{error}</p>}
    </DialogContent>
  </Dialog>;
}

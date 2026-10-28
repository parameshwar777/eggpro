import { useEffect, useState } from "react";
import { Store } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useChickenSettings } from "@/lib/chickenSettings";

/** Popup + banner shown on chicken pages while admin has closed the chicken store. */
export const ChickenClosedNotice = () => {
  const { settings, loaded } = useChickenSettings();
  const [open, setOpen] = useState(false);
  useEffect(() => { if (loaded && settings.store_closed) setOpen(true); }, [loaded, settings.store_closed]);
  if (!loaded || !settings.store_closed) return null;
  const msg = settings.closed_message?.trim() || "EggPro Chicken is temporarily closed. We will be back soon!";
  return (
    <>
      <div className="mx-4 mt-3 rounded-xl border-2 border-destructive bg-destructive/10 p-3 text-sm font-bold text-destructive whitespace-pre-line" role="status">
        Chicken store closed — {msg}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader className="items-center text-center">
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-2"><Store className="w-7 h-7 text-destructive" /></div>
            <DialogTitle className="text-xl font-extrabold">Chicken Store Closed</DialogTitle>
            <DialogDescription className="text-base font-semibold text-foreground whitespace-pre-line">{msg}</DialogDescription>
          </DialogHeader>
          <Button className="w-full h-12 font-bold" onClick={() => setOpen(false)}>OK</Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

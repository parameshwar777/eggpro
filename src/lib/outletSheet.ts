export interface OutletOrder {
  id: string;
  customer_name: string | null;
  phone: string;
  items: { name: string; quantity: number; weight?: string }[];
  total_amount: number;
  order_status: string | null;
  pickup_center_id: string;
  pickup: { pickup_code?: string; pickup_status: string; expires_at: string | null; handed_over_at: string | null } | null;
}
/** Matches a search term against name, phone digits and pickup code. A name search never matches every phone. */
export function matchesOutletSearch(o: OutletOrder, raw: string): boolean {
  const term = raw.trim().toLowerCase();
  if (!term) return true;
  if ((o.customer_name || "").toLowerCase().includes(term)) return true;
  const code = (o.pickup?.pickup_code || "").toLowerCase();
  if (code && code.replace(/[^a-z0-9]/g, "").includes(term.replace(/[^a-z0-9]/g, ""))) return true;
  const digits = term.replace(/\D/g, "");
  return digits.length > 0 && digits.length === term.replace(/[\s+\-]/g, "").length && (o.phone || "").replace(/\D/g, "").includes(digits);
}
async function savePng(canvas: HTMLCanvasElement, filename: string) {
  const blob: Blob | null = await new Promise(r => canvas.toBlob(r, "image/png"));
  if (!blob) throw new Error("Could not create the image");
  const file = new File([blob], filename, { type: "image/png" });
  // Phone apps and mobile browsers often ignore <a download>; the share sheet lets users save to Photos/Files or send on WhatsApp.
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    try { await nav.share({ files: [file], title: filename }); return; }
    catch (e) { if ((e as Error).name === "AbortError") return; }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a"); link.download = filename; link.href = url;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
export async function downloadOutletSheet(orders: OutletOrder[], outlet: string, date: string) {
  const palette = getComputedStyle(document.documentElement);
  const color = (token: string) => `hsl(${palette.getPropertyValue(token).trim()})`;
  const wrap = (ctx: CanvasRenderingContext2D, text: string, width: number) => {
    const lines: string[] = []; let line = "";
    for (const word of text.split(/\s+/)) {
      if (line && ctx.measureText(`${line} ${word}`).width > width) { lines.push(line); line = word; }
      else line = line ? `${line} ${word}` : word;
    }
    lines.push(line); return lines;
  };
  // Separate PNG pages avoid mobile canvas height limits without omitting any orders.
  for (let offset = 0; offset < orders.length; offset += 30) {
    const canvas = document.createElement("canvas"); canvas.width = 1200;
    const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Image download is not available");
    ctx.font = "600 21px Arial";
    const page = orders.slice(offset, offset + 30).map(o => ({ o, lines: wrap(ctx, o.items.map(i => `${i.name} × ${i.quantity}`).join("; "), 470), name: wrap(ctx, o.customer_name || "Customer", 220) }));
    const heights = page.map(r => Math.max(94, Math.max(r.lines.length,r.name.length + 1) * 29 + 28));
    canvas.height = 220 + heights.reduce((a,b) => a+b,0);
    ctx.fillStyle = color("--card"); ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = color("--foreground"); ctx.font = "bold 30px Arial";
    wrap(ctx, `EggPro Chicken · ${outlet}`,1120).forEach((line,i) => ctx.fillText(line,32,44+i*36));
    ctx.font = "600 23px Arial"; ctx.fillText(`Supply: ${date} · ${orders.length} orders · Page ${Math.floor(offset/30)+1}`,32,124);
    ctx.fillStyle = color("--secondary"); ctx.fillRect(24,145,1152,48);
    ctx.fillStyle = color("--foreground"); ctx.font = "bold 21px Arial";
    [["#",36],["Customer / Phone",90],["Products / Quantity",330],["Paid (Rs.)",830],["Status",980]].forEach(([label,x]) => ctx.fillText(String(label),Number(x),176));
    let y = 203; ctx.font = "600 21px Arial";
    page.forEach(({o,lines,name},i) => {
      ctx.fillStyle = color("--foreground"); ctx.fillText(String(offset+i+1),36,y+27);
      name.forEach((line,k) => ctx.fillText(line,90,y+27+k*29)); ctx.fillText(`${o.phone}${o.pickup?.pickup_code ? ` · ${o.pickup.pickup_code}` : ""}`,90,y+27+name.length*29);
      lines.forEach((line,k) => ctx.fillText(line,330,y+27+k*29));
      ctx.fillText(String(o.total_amount),830,y+27);
      ctx.fillText(o.pickup?.pickup_status === "HANDED_OVER" || o.order_status === "delivered" ? "DONE" : (o.pickup?.pickup_status === "CANCELLED" ? "CANCELLED" : o.pickup?.pickup_status === "EXPIRED" ? "EXPIRED" : "PENDING"),980,y+27);
      y += heights[i]; ctx.strokeStyle = color("--border"); ctx.beginPath(); ctx.moveTo(24,y); ctx.lineTo(1176,y); ctx.stroke();
    });
    await savePng(canvas, `chicken-${outlet.replace(/[^a-z0-9]/gi,"-")}-${date}-${Math.floor(offset/30)+1}.png`);
  }
}
/** Only open secure links; never execute a URL pasted into an admin form. */
export function cafeMapLink(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}
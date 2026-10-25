/** Admin offer dates are wall-clock times in India, independent of device timezone. */
export function offerInputToIso(value: string): string | null {
  if (!value) return null;
  const timestamp = Date.parse(`${value}:00+05:30`);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

export function offerIsoToInput(value: string | null): string {
  if (!value) return "";
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "";
  return new Date(timestamp + 330 * 60_000).toISOString().slice(0, 16);
}

export function isOfferLive(offer: { valid_from?: string | null; valid_until?: string | null; is_active?: boolean | null }, now = Date.now()): boolean {
  return offer.is_active !== false &&
    (!offer.valid_from || Date.parse(offer.valid_from) <= now) &&
    (!offer.valid_until || Date.parse(offer.valid_until) >= now);
}

export function isOfferWindowValid(from: string | null, until: string | null): boolean {
  return !from || !until || Date.parse(until) > Date.parse(from);
}
/** Café opens at midnight India time on 16 October 2026. */
export const CAFE_OPENING_AT = Date.parse("2026-10-16T00:00:00+05:30");

/** Remaining time until opening, or null once open. */
export function timeLeft(now: number) {
  const ms = CAFE_OPENING_AT - now;
  if (ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

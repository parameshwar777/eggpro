import { describe, it, expect } from "vitest";
import { chickenBookingOpen } from "../../supabase/functions/_shared/chickenSchedule";
const base = { booking_days: [1, 2, 3, 4, 5], pickup_day: 0, sunday_evening_start: "18:00" } as any;
const mondayNoonIST = new Date("2026-10-26T06:30:00Z");
describe("chicken store closure", () => {
  it("booking is open on Monday when store is open", () => expect(chickenBookingOpen(base, mondayNoonIST)).toBe(true));
  it("booking is closed when admin closes the chicken store", () => expect(chickenBookingOpen({ ...base, store_closed: true }, mondayNoonIST)).toBe(false));
});

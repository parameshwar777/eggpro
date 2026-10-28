import { test } from "node:test";
import assert from "node:assert/strict";
import { chickenBookingOpen } from "../supabase/functions/_shared/chickenSchedule";

const base = { booking_days: [1, 2, 3, 4, 5], pickup_day: 0, sunday_evening_start: "18:00" } as any;
const mondayNoonIST = new Date("2026-10-26T06:30:00Z");

test("booking is open on Monday when chicken store is open", () => {
  assert.equal(chickenBookingOpen(base, mondayNoonIST), true);
});

test("booking is closed when admin closes the chicken store", () => {
  assert.equal(chickenBookingOpen({ ...base, store_closed: true }, mondayNoonIST), false);
});

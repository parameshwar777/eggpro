import { test } from "node:test";
import assert from "node:assert/strict";
import { chickenBookingOpen, chickenSupplyDeadline, canManageChicken, canCompleteChicken } from "../supabase/functions/_shared/chickenSchedule";
import { groupChickenProducts } from "../src/lib/chickenProducts";
const s = { booking_days: [1,2,3,4,5,6], pickup_day: 0, cutoff_time: "10:00", sunday_evening_start: "18:00" };
test("Sunday evening opens at 6 PM IST, not before", () => {
  assert.equal(chickenBookingOpen(s, new Date("2026-10-25T12:29:59Z")), false);
  assert.equal(chickenBookingOpen(s, new Date("2026-10-25T12:30:00Z")), true);
});
test("Sunday evening orders are supplied next Sunday", () => {
  assert.equal(chickenSupplyDeadline(s, new Date("2026-10-25T12:30:00Z")).toISOString(), "2026-11-01T04:30:00.000Z");
});
test("Saturday booking is supplied on the next day", () => {
  assert.equal(chickenBookingOpen(s, new Date("2026-10-24T10:00:00Z")), true);
  assert.equal(chickenSupplyDeadline(s, new Date("2026-10-24T10:00:00Z")).toISOString(), "2026-10-25T04:30:00.000Z");
});
test("admin and merchant may manage pickups, customers and chicken staff may not", () => {
  assert.equal(canManageChicken(["admin"]), true);
  assert.equal(canManageChicken(["merchant"]), true);
  assert.equal(canManageChicken(["user"]), false);
  assert.equal(canManageChicken(["chicken_staff"]), false);
});
test("only paid chicken pickups from the selected outlet can be marked done", () => {
  const order = { business: "chicken", payment_status: "completed", fulfillment_type: "pickup", pickup_center_id: "outlet-1", order_status: "confirmed" };
  assert.equal(canCompleteChicken(order, "outlet-1"), true);
  assert.equal(canCompleteChicken(order, "outlet-2"), false);
  assert.equal(canCompleteChicken({ ...order, business: "eggs" }, "outlet-1"), false);
  assert.equal(canCompleteChicken({ ...order, payment_status: "pending" }, "outlet-1"), false);
  assert.equal(canCompleteChicken(order, "outlet-1", "CANCELLED"), false);
});
test("1 kg and half kg of the same chicken are one group retaining prices and IDs", () => {
  const groups = groupChickenProducts([{ id: "one", name: "Chicken", weight: "1 kg", price: 459 }, { id: "half", name: "Chicken", weight: "500 g", price: 230 }]);
  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].map(p => [p.id, p.weight, p.price]), [["one", "1 kg", 459], ["half", "500 g", 230]]);
});
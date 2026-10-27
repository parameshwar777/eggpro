import { describe, it, expect } from "vitest";
import { matchesOutletSearch, type OutletOrder } from "./outletSheet";

const o = (name: string, phone: string, code: string): OutletOrder => ({ id: "x", customer_name: name, phone, items: [], total_amount: 1, order_status: "confirmed", pickup_center_id: "c", pickup: { pickup_code: code, pickup_status: "PENDING_PICKUP", expires_at: null, handed_over_at: null } });

describe("outlet search", () => {
  it("name search does not match every order", () => {
    expect(matchesOutletSearch(o("Ravi", "9440229378", "CHKN-AAAAAA"), "sita")).toBe(false);
    expect(matchesOutletSearch(o("Sita", "9000000000", "CHKN-BBBBBB"), "sita")).toBe(true);
  });
  it("matches phone digits and scanned pickup code", () => {
    expect(matchesOutletSearch(o("Ravi", "9440229378", "CHKN-4GQWEQ"), "29378")).toBe(true);
    expect(matchesOutletSearch(o("Ravi", "9440229378", "CHKN-4GQWEQ"), "CHKN-4GQWEQ")).toBe(true);
  });
});

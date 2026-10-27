import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { matchesOutletSearch, type OutletOrder } from "../src/lib/outletSheet";

const o = (name: string, phone: string, code: string): OutletOrder => ({ id: "x", customer_name: name, phone, items: [], total_amount: 1, order_status: "confirmed", pickup_center_id: "c", pickup: { pickup_code: code, pickup_status: "PENDING_PICKUP", expires_at: null, handed_over_at: null } });

describe("outlet search", () => {
  it("name search does not match every order", () => {
    assert.equal(matchesOutletSearch(o("Ravi", "9440229378", "CHKN-AAAAAA"), "sita"), false);
    assert.equal(matchesOutletSearch(o("Sita", "9000000000", "CHKN-BBBBBB"), "sita"), true);
  });
  it("matches phone digits and scanned pickup code", () => {
    assert.equal(matchesOutletSearch(o("Ravi", "9440229378", "CHKN-4GQWEQ"), "29378"), true);
    assert.equal(matchesOutletSearch(o("Ravi", "9440229378", "CHKN-4GQWEQ"), "CHKN-4GQWEQ"), true);
  });
});

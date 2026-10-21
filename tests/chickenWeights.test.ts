import { test } from "node:test";
import assert from "node:assert/strict";
import { CHICKEN_WEIGHTS } from "../src/lib/chickenProducts";

test("quarter kilogram is available as 250 g", () => {
  assert.equal(CHICKEN_WEIGHTS.find((option) => option.label.startsWith("Quarter kg"))?.value, "250 g");
});
test("half kilogram is available as 500 g", () => {
  assert.equal(CHICKEN_WEIGHTS.find((option) => option.label.startsWith("Half kg"))?.value, "500 g");
});
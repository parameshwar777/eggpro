import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { CAFE_OPENING_AT, timeLeft } from "./cafeOpening";
import { cafeMapLink } from "./cafeMaps";

describe("Café opening", () => {
  test("opens on 16 October 2026 at midnight IST", () => {
    assert.equal(CAFE_OPENING_AT, Date.parse("2026-10-15T18:30:00Z"));
    assert.deepEqual(timeLeft(CAFE_OPENING_AT - 1000), { d: 0, h: 0, m: 0, s: 1 });
    assert.equal(timeLeft(CAFE_OPENING_AT), null);
    assert.equal(timeLeft(Date.parse("2026-10-17T18:35:00Z")), null);
  });
  test("opens the admin's secure map link unchanged", () => {
    assert.equal(cafeMapLink("https://maps.app.goo.gl/example"), "https://maps.app.goo.gl/example");
    assert.equal(cafeMapLink(null), null);
    assert.equal(cafeMapLink("javascript:alert(1)"), null);
    assert.equal(cafeMapLink("not a link"), null);
  });
});
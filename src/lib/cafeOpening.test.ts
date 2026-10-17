import { describe, expect, test } from "bun:test";
import { CAFE_OPENING_AT, timeLeft } from "./cafeOpening";
import { cafeMapLink } from "./cafeMaps";

describe("Café opening", () => {
  test("opens on 16 October 2026 at midnight IST", () => {
    expect(CAFE_OPENING_AT).toBe(Date.parse("2026-10-15T18:30:00Z"));
    expect(timeLeft(CAFE_OPENING_AT - 1000)).toEqual({ d: 0, h: 0, m: 0, s: 1 });
    expect(timeLeft(CAFE_OPENING_AT)).toBeNull();
    expect(timeLeft(Date.parse("2026-10-17T18:35:00Z"))).toBeNull();
  });
  test("opens the admin's secure map link unchanged", () => {
    expect(cafeMapLink("https://maps.app.goo.gl/example")).toBe("https://maps.app.goo.gl/example");
    expect(cafeMapLink(null)).toBeNull();
    expect(cafeMapLink("javascript:alert(1)")).toBeNull();
    expect(cafeMapLink("not a link")).toBeNull();
  });
});
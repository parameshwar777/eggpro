import { test } from "node:test";
import assert from "node:assert/strict";
import { offerInputToIso, offerIsoToInput, isOfferLive, isOfferWindowValid } from "../src/lib/offerValidity";

test("offer dates round-trip without shifting India time", () => {
  assert.equal(offerInputToIso("2026-10-25T18:00"), "2026-10-25T12:30:00.000Z");
  assert.equal(offerIsoToInput("2026-10-25T12:30:00Z"), "2026-10-25T18:00");
});
test("valid from prevents early offers", () => {
  const offer = { valid_from: "2026-10-25T12:30:00Z" };
  assert.equal(isOfferLive(offer, Date.parse("2026-10-25T12:29:59Z")), false);
  assert.equal(isOfferLive(offer, Date.parse("2026-10-25T12:30:00Z")), true);
});
test("valid until removes expired offers", () => {
  const offer = { valid_until: "2026-10-25T14:30:00Z" };
  assert.equal(isOfferLive(offer, Date.parse("2026-10-25T14:30:00Z")), true);
  assert.equal(isOfferLive(offer, Date.parse("2026-10-25T14:30:01Z")), false);
});
test("date range must end after it starts", () => {
  assert.equal(isOfferWindowValid("2026-10-25T12:30:00Z", "2026-10-25T11:30:00Z"), false);
  assert.equal(isOfferWindowValid("2026-10-25T12:30:00Z", "2026-10-25T12:30:00Z"), false);
  assert.equal(isOfferWindowValid("2026-10-25T12:30:00Z", "2026-10-26T12:30:00Z"), true);
  assert.equal(isOfferWindowValid(null, null), true);
});
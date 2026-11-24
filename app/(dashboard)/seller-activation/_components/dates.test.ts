import { test } from "node:test";
import assert from "node:assert/strict";
import { formatDateParis } from "./dates.ts";

test("a date near midnight is the Paris calendar day, whatever the machine's timezone", () => {
  // 23:30 UTC on 31 Dec is already 1 Jan in Paris (00:30 CET).
  assert.equal(formatDateParis("2026-12-31T23:30:00.000Z"), "01/01/2027");
  // 22:30 UTC in July is 00:30 CEST the next day.
  assert.equal(formatDateParis("2026-07-14T22:30:00.000Z"), "15/07/2026");
  // Mid-day is unchanged.
  assert.equal(formatDateParis("2026-12-10T12:00:00.000Z"), "10/12/2026");
});

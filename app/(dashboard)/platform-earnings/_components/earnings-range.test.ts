import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultRange, formatUtcDay, tryApplyRange, validateRange } from "./earnings-range.ts";

test("default range is the last 30 UTC days ending today, inclusive", () => {
  const r = defaultRange(new Date("2026-10-31T23:30:00.000Z"));
  assert.deepEqual(r, { from: "2026-10-02", to: "2026-10-31" });
  assert.equal(validateRange(r.from, r.to), null);
});

test("default range uses the UTC day, not the local one", () => {
  // 00:10 UTC on 1 Nov is still 31 Oct evening in the Americas.
  assert.equal(defaultRange(new Date("2026-11-01T00:10:00.000Z")).to, "2026-11-01");
});

test("92 days inclusive is accepted, 93 is rejected", () => {
  assert.equal(validateRange("2026-01-01", "2026-04-02"), null); // 92 days
  assert.match(validateRange("2026-01-01", "2026-04-03") ?? "", /92 jours/);
});

test("to before from is rejected", () => {
  assert.match(validateRange("2026-03-10", "2026-03-09") ?? "", /ne peut pas précéder/);
});

test("single-day range is accepted", () => {
  assert.equal(validateRange("2026-03-10", "2026-03-10"), null);
});

test("empty or impossible dates are rejected", () => {
  assert.ok(validateRange("", "2026-03-10"));
  assert.ok(validateRange("2026-03-10", ""));
  assert.ok(validateRange("2026-02-31", "2026-03-10"));
});

test("an invalid range is rejected before apply (no request) is called", () => {
  let applied = 0;
  const err = tryApplyRange("2026-01-01", "2026-12-31", () => applied++);
  assert.ok(err);
  assert.equal(applied, 0);
  assert.ok(tryApplyRange("2026-03-10", "2026-03-01", () => applied++));
  assert.equal(applied, 0);
});

test("a valid range is applied once and clears the error", () => {
  const seen: unknown[] = [];
  assert.equal(tryApplyRange("2026-03-01", "2026-03-31", (r) => seen.push(r)), null);
  assert.deepEqual(seen, [{ from: "2026-03-01", to: "2026-03-31" }]);
});

test("boundary days are displayed as given, without timezone shifts", () => {
  assert.equal(formatUtcDay("2026-10-01"), "01/10/2026");
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseTrialDays, trialSettingsChanges } from "./trial-settings";

const saved = { autoRequest: false, days: 60, minDays: 7, maxDays: 365 };

describe("parseTrialDays", () => {
  it("accepts whole days inside the bounds", () => {
    assert.equal(parseTrialDays("60", 7, 365), 60);
    assert.equal(parseTrialDays(" 7 ", 7, 365), 7);
    assert.equal(parseTrialDays("365", 7, 365), 365);
  });
  it("rejects everything else", () => {
    for (const v of ["", "6", "366", "4.5", "-30", "abc", "1e2"]) assert.equal(parseTrialDays(v, 7, 365), null);
  });
});

describe("trialSettingsChanges", () => {
  it("is null when nothing changed or the length is invalid", () => {
    assert.equal(trialSettingsChanges(saved, { autoRequest: false, days: "60" }), null);
    assert.equal(trialSettingsChanges(saved, { autoRequest: true, days: "3" }), null);
  });
  it("sends only what changed", () => {
    assert.deepEqual(trialSettingsChanges(saved, { autoRequest: true, days: "60" }), { autoRequest: true });
    assert.deepEqual(trialSettingsChanges(saved, { autoRequest: false, days: "45" }), { days: 45 });
    assert.deepEqual(trialSettingsChanges(saved, { autoRequest: true, days: "45" }), { autoRequest: true, days: 45 });
  });

  it("an invalid stored length (null) needs a valid one typed, whatever the switch says", () => {
    const broken = { autoRequest: false, days: null, minDays: 7, maxDays: 365 };
    assert.equal(trialSettingsChanges(broken, { autoRequest: false, days: "" }), null); // nothing changed
    // ... but the switch alone can still be saved while the stored length is invalid and untouched
    assert.deepEqual(trialSettingsChanges(broken, { autoRequest: true, days: "" }), { autoRequest: true });
    assert.equal(trialSettingsChanges(broken, { autoRequest: true, days: "3" }), null); // a typed bad length blocks
    assert.deepEqual(trialSettingsChanges(broken, { autoRequest: false, days: "60" }), { days: 60 });
  });
});

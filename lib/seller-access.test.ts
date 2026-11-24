import { test } from "node:test";
import assert from "node:assert/strict";
import { formatTrialDate, isTrialOnly, trialState, trialText } from "./seller-access.ts";

const NOW = new Date("2026-12-10T10:00:00.000Z");
const FUTURE = "2027-01-10T00:00:00.000Z";
const PAST = "2026-11-01T00:00:00.000Z";

test("no trial fields (older server, or never granted): nothing about trials", () => {
  assert.equal(trialState({}, NOW), null);
  assert.equal(trialState({ platformTrialEndsAt: null }, NOW), null);
  assert.equal(isTrialOnly({}), false);
});

test("running, ended and revoked trials", () => {
  assert.deepEqual(trialState({ platformTrialEndsAt: FUTURE }, NOW), { kind: "running", date: FUTURE });
  assert.deepEqual(trialState({ platformTrialEndsAt: PAST }, NOW), { kind: "ended", date: PAST });
  // the end moment itself is over
  assert.equal(trialState({ platformTrialEndsAt: NOW.toISOString() }, NOW)?.kind, "ended");
  // a revoked trial reports the revocation, not its original future end
  const revoked = trialState({ platformTrialEndsAt: FUTURE, platformTrialRevokedAt: "2026-12-01T00:00:00.000Z" }, NOW);
  assert.deepEqual(revoked, { kind: "revoked", date: "2026-12-01T00:00:00.000Z" });
});

test("a trial under a store subscription is still reported, and the source stays 'store'", () => {
  const f = {
    access: { active: true, source: "store" as const, endsAt: FUTURE },
    platformTrialEndsAt: FUTURE,
  };
  assert.equal(isTrialOnly(f), false); // today's store label is kept
  assert.equal(trialState(f, NOW)?.kind, "running"); // ...with the trial as a note
});

test("trial-only is recognised from the access source", () => {
  assert.equal(isTrialOnly({ access: { active: true, source: "platform_trial", endsAt: FUTURE } }), true);
  assert.equal(isTrialOnly({ access: { active: false, source: null, endsAt: null } }), false);
});

test("French wording and Paris-time dates", () => {
  assert.equal(trialText({ kind: "running", date: FUTURE }), "Essai offert jusqu’au 10/01/2027");
  assert.equal(trialText({ kind: "ended", date: PAST }), "Essai terminé le 01/11/2026");
  assert.equal(trialText({ kind: "revoked", date: "2026-12-01T00:00:00.000Z" }), "Essai révoqué le 01/12/2026");
  // 23:30 UTC on 31 Dec is already 1 Jan in Paris, whatever the machine's timezone
  assert.equal(formatTrialDate("2026-12-31T23:30:00.000Z"), "01/01/2027");
});

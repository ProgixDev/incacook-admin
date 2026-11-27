import { test } from "node:test";
import assert from "node:assert/strict";
import {
  actionErrorMessage,
  availableActions,
  buildActionBody,
  reasonRequired,
  duplicateReasonLabel,
  factsFromActivationRow,
  factsFromTrialItem,
  nextStepLabel,
  shouldRefetchAfterError,
  validateAction,
  type TrialFacts,
} from "./trial-model.ts";
import type { ActivationRow, TrialListItem } from "./types.ts";

const NOW = new Date("2026-12-10T10:00:00.000Z");
const FUTURE = "2027-01-10T00:00:00.000Z";
const PAST = "2026-11-01T00:00:00.000Z";

const facts = (over: Partial<TrialFacts>): TrialFacts => ({
  requestState: "none",
  accessActive: false,
  trialEndsAt: null,
  trialRevokedAt: null,
  ...over,
});

test("a seller without access can be granted, and only that", () => {
  assert.deepEqual(availableActions(facts({}), NOW), ["grant"]);
});

test("a running trial can be extended or revoked, not granted again", () => {
  const a = availableActions(facts({ accessActive: true, trialEndsAt: FUTURE, requestState: "granted" }), NOW);
  assert.deepEqual(a, ["extend", "revoke"]);
});

test("an ended trial can be extended (restarts from now) or re-granted, not revoked", () => {
  const a = availableActions(facts({ trialEndsAt: PAST, requestState: "granted" }), NOW);
  assert.deepEqual(a, ["grant", "extend"]);
});

test("a revoked trial can only be granted again", () => {
  const a = availableActions(
    facts({ trialEndsAt: FUTURE, trialRevokedAt: "2026-12-01T00:00:00.000Z", requestState: "granted" }),
    NOW,
  );
  assert.deepEqual(a, ["grant"]);
});

test("a pending request can be refused, alongside a grant", () => {
  assert.deepEqual(availableActions(facts({ requestState: "pending" }), NOW), ["grant", "refuse"]);
});

test("a refused or paying seller is not offered the wrong actions", () => {
  assert.deepEqual(availableActions(facts({ requestState: "refused" }), NOW), ["grant"]);
  assert.deepEqual(availableActions(facts({ accessActive: true }), NOW), []);
});

test("unknown access (trial lists) still offers grant", () => {
  assert.deepEqual(availableActions(facts({ accessActive: undefined }), NOW), ["grant"]);
});

const row = (
  over: Partial<ActivationRow["access"]>,
  trialRequest: ActivationRow["trialRequest"] = "none",
  more: Partial<ActivationRow> = {},
): ActivationRow => ({
  sellerId: "s1",
  displayName: "Rosa",
  email: "r@x.fr",
  category: "FAIT_MAISON",
  signedUpAt: PAST,
  isTestAccount: false,
  isSuspended: false,
  nextStep: null,
  kycState: "APPROVED",
  canList: true,
  onboardingUnavailable: false,
  access: { active: false, source: null, endsAt: null, ...over },
  trialEndsAt: null,
  trialRevokedAt: null,
  listings: 0,
  orders: 0,
  trialRequest,
  ...more,
});

test("the trial's own dates are used, whatever the access source", () => {
  // trial alone
  const alone = factsFromActivationRow(row({ active: true, source: "platform_trial", endsAt: FUTURE }, "granted", { trialEndsAt: FUTURE }));
  assert.equal(alone.trialEndsAt, FUTURE);
  // store + longer trial: access.endsAt is the later end, the trial's end is reported separately
  const LATER = "2027-03-01T00:00:00.000Z";
  const both = factsFromActivationRow(row({ active: true, source: "store", endsAt: LATER }, "granted", { trialEndsAt: FUTURE }));
  assert.equal(both.trialEndsAt, FUTURE);
  // ...so a seller who pays AND has a running trial can still have it extended or revoked
  assert.deepEqual(availableActions(both, NOW), ["extend", "revoke"]);
});

test("a revoked trial is reported as revoked on activation rows too", () => {
  const f = factsFromActivationRow(row({}, "granted", { trialEndsAt: FUTURE, trialRevokedAt: "2026-12-01T00:00:00.000Z", canList: true }));
  assert.deepEqual(availableActions(f, NOW), ["grant"]);
});

test("Accorder is only offered to sellers whose onboarding is complete", () => {
  const incomplete = factsFromActivationRow(row({}, "none", { canList: false }));
  assert.deepEqual(availableActions(incomplete, NOW), []);
  const unreadable = factsFromActivationRow(row({}, "none", { canList: null }));
  assert.deepEqual(availableActions(unreadable, NOW), []);
  // a pending request from an incomplete seller can still be refused
  const pending = factsFromActivationRow(row({}, "pending", { canList: false }));
  assert.deepEqual(availableActions(pending, NOW), ["refuse"]);
  const ready = factsFromActivationRow(row({}, "none", { canList: true }));
  assert.deepEqual(availableActions(ready, NOW), ["grant"]);
});

test("trial-list items carry their own trial dates", () => {
  const item: TrialListItem = {
    sellerId: "s1", displayName: null, email: "r@x.fr", category: null, signedUpAt: PAST,
    requestState: "granted", requestedAt: null, trialEndsAt: FUTURE, trialRevokedAt: null, duplicates: [],
  };
  assert.deepEqual(factsFromTrialItem(item), {
    requestState: "granted", accessActive: undefined, ready: undefined, trialEndsAt: FUTURE, trialRevokedAt: null, trialTier: undefined, suspended: false, offeredDays: null,
  });
});

test("a pending seller carries the length the seller was offered (the default of a grant to them)", () => {
  const item: TrialListItem = {
    sellerId: "s1", displayName: null, email: "r@x.fr", category: null, signedUpAt: PAST,
    requestState: "pending", requestedAt: PAST, requestSource: "auto", offeredDays: 45,
    trialEndsAt: null, trialRevokedAt: null, duplicates: [],
  };
  assert.equal(factsFromTrialItem(item).offeredDays, 45);
});

test("a pending seller who subscribed meanwhile is not offered a grant (list access), only a refusal", () => {
  const item: TrialListItem = {
    sellerId: "s1", displayName: null, email: "r@x.fr", category: null, signedUpAt: PAST,
    requestState: "pending", requestedAt: PAST, trialEndsAt: null, trialRevokedAt: null,
    access: { active: true, source: "store", endsAt: FUTURE }, duplicates: [],
  };
  assert.deepEqual(availableActions(factsFromTrialItem(item), NOW), ["refuse"]);
  const without = { ...item, access: { active: false, source: null, endsAt: null } };
  assert.deepEqual(availableActions(factsFromTrialItem(without), NOW), ["grant", "refuse"]);
});

test("grant and extend need a whole number of days between 1 and 365", () => {
  for (const days of ["", "0", "-3", "1.5", "366", "abc"]) {
    assert.match(validateAction("grant", { days, reason: "" }) ?? "", /durée/, days);
    assert.match(validateAction("extend", { days, reason: "" }) ?? "", /durée/, days);
  }
  assert.equal(validateAction("grant", { days: "60", reason: "" }), null);
  assert.equal(validateAction("extend", { days: "365", reason: "" }), null);
});

test("revoke and refuse require a non-blank reason, grant and extend do not", () => {
  assert.match(validateAction("revoke", { days: "", reason: "   " }) ?? "", /motif/);
  assert.match(validateAction("refuse", { days: "", reason: "" }) ?? "", /motif/);
  assert.equal(validateAction("revoke", { days: "", reason: "Doublon" }), null);
  assert.equal(validateAction("grant", { days: "60", reason: "" }), null);
  assert.match(validateAction("revoke", { days: "", reason: "x".repeat(501) }) ?? "", /500/);
});

test("request bodies carry exactly what the server expects", () => {
  assert.deepEqual(buildActionBody("grant", { days: "60", reason: " Pilote " }, null), { days: 60, reason: "Pilote" });
  assert.deepEqual(buildActionBody("grant", { days: "30", reason: "" }, null), { days: 30 });
  assert.deepEqual(buildActionBody("extend", { days: "10", reason: "" }, FUTURE), { days: 10, expectedEndsAt: FUTURE });
  assert.deepEqual(buildActionBody("revoke", { days: "60", reason: "Abus" }, FUTURE), { reason: "Abus" });
  assert.deepEqual(buildActionBody("refuse", { days: "", reason: "Doublon" }, null), { reason: "Doublon" });
});

test("known error codes get a French message, unknown ones the server's", () => {
  assert.match(actionErrorMessage("INCACOOK_TRIAL_STALE", "x"), /modifié entre-temps/);
  assert.match(actionErrorMessage("INCACOOK_TRIAL_ALREADY_ACTIVE", "x"), /déjà accès/);
  assert.match(actionErrorMessage("INCACOOK_TRIAL_NO_PENDING_REQUEST", "x"), /en attente/);
  assert.match(actionErrorMessage("INCACOOK_TRIAL_NOT_GRANTED", "x"), /n’est pas possible sur l’essai/);
  assert.equal(actionErrorMessage("INCACOOK_SOMETHING", "message serveur"), "message serveur");
  assert.equal(actionErrorMessage(undefined, "message serveur"), "message serveur");
});

test("only state conflicts trigger a refetch", () => {
  for (const c of ["INCACOOK_TRIAL_STALE", "INCACOOK_TRIAL_ALREADY_ACTIVE", "INCACOOK_TRIAL_NOT_GRANTED", "INCACOOK_TRIAL_NO_PENDING_REQUEST"]) {
    assert.equal(shouldRefetchAfterError(c), true, c);
  }
  assert.equal(shouldRefetchAfterError("INCACOOK_FORBIDDEN"), false);
  assert.equal(shouldRefetchAfterError(undefined), false);
});

test("labels for duplicate reasons and onboarding steps", () => {
  assert.equal(duplicateReasonLabel(["email", "pickup_address"]), "même e-mail, même adresse de retrait");
  assert.equal(nextStepLabel("kyc_id"), "Pièce d’identité");
  assert.equal(nextStepLabel("brand_new_step"), "brand_new_step");
  assert.equal(nextStepLabel(null), "—");
});

test("a pending request whose seller is no longer ready (or unreadable) cannot be granted, only refused", () => {
  const base: TrialListItem = {
    sellerId: "s1", displayName: null, email: "r@x.fr", category: null, signedUpAt: PAST,
    requestState: "pending", requestedAt: PAST, trialEndsAt: null, trialRevokedAt: null,
    access: { active: false, source: null, endsAt: null }, duplicates: [],
  };
  assert.deepEqual(availableActions(factsFromTrialItem({ ...base, ready: false }), NOW), ["refuse"]);
  assert.deepEqual(availableActions(factsFromTrialItem({ ...base, ready: null }), NOW), ["refuse"]);
  assert.deepEqual(availableActions(factsFromTrialItem({ ...base, ready: true }), NOW), ["grant", "refuse"]);
  // an older server without the field: no block
  assert.deepEqual(availableActions(factsFromTrialItem(base), NOW), ["grant", "refuse"]);
});

test("a suspended seller is not offered a grant (the trial would run unusable) but can still be refused or revoked", () => {
  const suspended = factsFromActivationRow(row({}, "pending", { isSuspended: true }));
  assert.deepEqual(availableActions(suspended, NOW), ["refuse"]);
  const runningAndSuspended = factsFromActivationRow(
    row({ active: true, source: "platform_trial", endsAt: FUTURE }, "granted", { isSuspended: true, trialEndsAt: FUTURE }),
  );
  assert.deepEqual(availableActions(runningAndSuspended, NOW), ["extend", "revoke"]);
});

test("a suspended seller on the pending list is not offered a grant, only a refusal", () => {
  const item: TrialListItem = {
    sellerId: "s1", displayName: "Rosa", email: "r@x.fr", category: null, signedUpAt: PAST,
    requestState: "pending", requestedAt: PAST, trialEndsAt: null, trialRevokedAt: null, duplicates: [],
    access: { active: false, source: null, endsAt: null }, ready: true, suspended: true,
  };
  assert.deepEqual(availableActions(factsFromTrialItem(item), NOW), ["refuse"]);
  assert.deepEqual(availableActions(factsFromTrialItem({ ...item, suspended: false }), NOW), ["grant", "refuse"]);
});

test("a Premium grant needs a reason and names its tier; a Standard grant stays as it was", () => {
  assert.equal(reasonRequired("grant"), false);
  assert.equal(reasonRequired("grant", "STANDARD"), false);
  assert.equal(reasonRequired("grant", "PREMIUM"), true);
  assert.match(validateAction("grant", { days: "60", reason: "  ", tier: "PREMIUM" }) ?? "", /motif.*Premium offert/i);
  assert.equal(validateAction("grant", { days: "60", reason: "Partenaire", tier: "PREMIUM" }), null);
  assert.equal(validateAction("grant", { days: "60", reason: "", tier: "STANDARD" }), null);
  assert.deepEqual(buildActionBody("grant", { days: "30", reason: " Partenaire ", tier: "PREMIUM" }, null), {
    days: 30,
    tier: "PREMIUM",
    reason: "Partenaire",
  });
  // Standard sends no tier at all (servers without Premium grants reject unknown fields).
  assert.deepEqual(buildActionBody("grant", { days: "60", reason: "", tier: "STANDARD" }, null), { days: 60 });
  assert.deepEqual(buildActionBody("grant", { days: "60", reason: "" }, null), { days: 60 });
  // The tier is only ever SENT with a grant (an extension keeps the grant's own tier)...
  assert.deepEqual(buildActionBody("extend", { days: "10", reason: "", tier: "PREMIUM" }, "2027-01-01T00:00:00.000Z"), {
    days: 10,
    expectedEndsAt: "2027-01-01T00:00:00.000Z",
  });
  // ...but extending a Premium grant costs as much as granting it, so it needs a reason too.
  assert.equal(reasonRequired("extend", "PREMIUM"), true);
  assert.equal(reasonRequired("extend", "STANDARD"), false);
  assert.equal(reasonRequired("extend"), false);
  assert.match(validateAction("extend", { days: "10", reason: " ", tier: "PREMIUM" }) ?? "", /motif.*Premium offert/i);
  assert.equal(validateAction("extend", { days: "10", reason: "Partenariat", tier: "PREMIUM" }), null);
  assert.equal(validateAction("extend", { days: "10", reason: "", tier: "STANDARD" }), null);
  assert.deepEqual(
    buildActionBody("extend", { days: "10", reason: "Partenariat", tier: "PREMIUM" }, "2027-01-01T00:00:00.000Z"),
    { days: 10, expectedEndsAt: "2027-01-01T00:00:00.000Z", reason: "Partenariat" },
  );
});

test("the server's Premium-reason refusal has a French message", () => {
  assert.match(actionErrorMessage("INCACOOK_TRIAL_PREMIUM_REASON_REQUIRED", "x"), /raison d’un Premium offert/);
});

test("the facts carry the tier of the grant, from both lists, so an extension knows it", () => {
  const row = { ...({} as ActivationRow), trialTier: "PREMIUM" as const, access: { active: true, source: "platform_trial" as const, endsAt: null }, canList: true };
  assert.equal(factsFromActivationRow(row as ActivationRow).trialTier, "PREMIUM");
  const item = { requestState: "granted", trialTier: "PREMIUM", trialEndsAt: null, trialRevokedAt: null, duplicates: [] };
  assert.equal(factsFromTrialItem(item as unknown as TrialListItem).trialTier, "PREMIUM");
  assert.equal(factsFromTrialItem({ ...item, trialTier: undefined } as unknown as TrialListItem).trialTier, undefined);
});

test("a row of the full list carries the length its pending request was made under", () => {
  const row = {
    sellerId: "s1", displayName: null, email: "r@x.fr", category: null, signedUpAt: PAST,
    kycState: "APPROVED", nextStep: null, canList: true, onboardingUnavailable: false,
    isTestAccount: false, isSuspended: false,
    access: { active: false, source: null, endsAt: null }, trialEndsAt: null, trialRevokedAt: null,
    listings: 0, orders: 0, trialRequest: "pending", requestSource: "auto", offeredDays: 45,
  } as unknown as ActivationRow;
  assert.equal(factsFromActivationRow(row).offeredDays, 45);
  assert.equal(factsFromActivationRow({ ...row, offeredDays: undefined }).offeredDays, null);
});

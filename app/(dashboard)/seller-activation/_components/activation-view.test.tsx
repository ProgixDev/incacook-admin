import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { AccessBadge, CountersGrid, DuplicateHints, OnboardingCell, RequestBadge, SellerCell } from "./activation-view.tsx";
import type { ActivationRow } from "./types.ts";

const counters = { signups: 3, ready: 2, onboardingUnavailable: 0, withAccess: 1, firstListing: 0 };
const text = (node: React.ReactElement) => renderToStaticMarkup(node).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

test("shows the four counters with their values", () => {
  const html = text(<CountersGrid counters={counters} windowDays={30} capped={false} />);
  assert.match(html, /Inscrits 3/);
  assert.match(html, /Prêts à vendre 2/);
  assert.match(html, /Avec accès 1/);
  assert.match(html, /Première annonce 0/);
  assert.doesNotMatch(html, /sous-estimés|illisible/);
});

test("warns when onboarding states were unreadable or the cohort was capped", () => {
  const html = text(<CountersGrid counters={{ ...counters, onboardingUnavailable: 2 }} windowDays={30} capped />);
  assert.match(html, /2 vendeur\(s\).*illisible/);
  assert.match(html, /sous-estimés/);
});

test("labels the access source: trial, store, none", () => {
  const end = "2027-01-10T00:00:00.000Z";
  assert.match(text(<AccessBadge access={{ active: true, source: "platform_trial", endsAt: end }} />), /Essai offert · jusqu’au 10\/01\/2027/);
  // A store subscriber never shows a date: the server's endsAt can be a trial's end then.
  const store = text(<AccessBadge access={{ active: true, source: "store", endsAt: end }} />);
  assert.match(store, /Abonné/);
  assert.doesNotMatch(store, /jusqu’au|2027/);
  assert.match(text(<AccessBadge access={{ active: false, source: null, endsAt: null }} />), /Aucun accès/);
});

test("flags test and suspended accounts and survives a missing or very long name", () => {
  const long = "A".repeat(200);
  const html = renderToStaticMarkup(<SellerCell name={long} email="x@y.fr" isTestAccount isSuspended />);
  assert.match(html, /Test/);
  assert.match(html, /Suspendu/);
  assert.match(html, /truncate/); // long names are cut, not overflowing
  assert.match(text(<SellerCell name={null} email="x@y.fr" />), /Sans nom/);
});

test("request states and duplicate hints render readably", () => {
  assert.match(text(<RequestBadge state="pending" />), /Demande en attente/);
  assert.match(text(<DuplicateHints hints={[{ sellerId: "s2", displayName: "Rosa 2", reasons: ["email", "phone"] }]} />), /Rosa 2 : même e-mail, même téléphone/);
  assert.match(text(<DuplicateHints hints={[]} />), /—/);
});

const row = (over: Partial<ActivationRow>): ActivationRow => ({
  sellerId: "s1", displayName: "R", email: "r@x.fr", category: null, signedUpAt: "2026-12-01T00:00:00.000Z",
  isTestAccount: false, isSuspended: false, nextStep: null, kycState: null, canList: false, onboardingUnavailable: false,
  access: { active: false, source: null, endsAt: null }, trialEndsAt: null, trialRevokedAt: null, listings: 0, orders: 0, trialRequest: "none", ...over,
});

test("onboarding cell: ready, first missing step, unreadable, waiting for validation", () => {
  assert.match(text(<OnboardingCell row={row({ canList: true })} />), /Prêt/);
  assert.match(text(<OnboardingCell row={row({ nextStep: "kyc_id" })} />), /Pièce d’identité/);
  assert.match(text(<OnboardingCell row={row({ canList: null, onboardingUnavailable: true })} />), /illisible/);
  assert.match(text(<OnboardingCell row={row({})} />), /Validation en cours/);
});

test("a Premium grant reads Premium offert in the access column; Standard (or no tier) keeps Essai offert", () => {
  const end = "2027-01-10T00:00:00.000Z";
  const access = { active: true, source: "platform_trial" as const, endsAt: end };
  assert.match(text(<AccessBadge access={access} tier="PREMIUM" />), /Premium offert · jusqu’au 10\/01\/2027/);
  assert.doesNotMatch(text(<AccessBadge access={access} tier="PREMIUM" />), /Essai/);
  assert.match(text(<AccessBadge access={access} tier="STANDARD" />), /Essai offert/);
  assert.match(text(<AccessBadge access={access} />), /Essai offert/);
  // A store subscriber is never labelled by a grant's tier.
  assert.match(text(<AccessBadge access={{ ...access, source: "store" }} tier="PREMIUM" />), /Abonné/);
});

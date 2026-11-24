import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { SellerAccessCell, type AdminSeller } from "./seller-model.tsx";
import { SubscriptionAccessCell, type AdminSubscription } from "../../subscriptions/_components/subscription-model.tsx";

const text = (node: React.ReactElement) => renderToStaticMarkup(node).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const FUTURE = new Date(Date.now() + 40 * 86_400_000).toISOString();
const LATER = new Date(Date.now() + 90 * 86_400_000).toISOString();
const PAST = "2026-01-10T00:00:00.000Z";
const REVOKED_AT = "2026-02-01T00:00:00.000Z";
const d = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", year: "numeric" });

const seller = (over: Partial<AdminSeller>): AdminSeller => ({
  id: "s1", name: "Rosa", email: "r@x.fr", category: "FAIT_MAISON", rating: null, ratingCount: 0, totalSales: 0,
  totalRevenueCents: 0, activeListings: 0, subscriptionTier: "free", subscriptionStatus: "NONE",
  stripeDetailsSubmitted: false, stripeChargesEnabled: false, stripePayoutsEnabled: false, stripeOnboardingCompleted: false,
  isSuspended: false, createdAt: "2026-01-01T00:00:00.000Z", ...over,
});

test("sellers: trial-only reads 'Essai offert' with its end date instead of 'Gratuit'", () => {
  const html = text(<SellerAccessCell seller={seller({ access: { active: true, source: "platform_trial", endsAt: FUTURE }, platformTrialEndsAt: FUTURE })} />);
  assert.match(html, /Essai offert/);
  assert.match(html, new RegExp(`jusqu’au ${d(FUTURE)}`));
  assert.doesNotMatch(html, /Gratuit/);
});

test("sellers: a store subscriber keeps today's label", () => {
  const html = text(<SellerAccessCell seller={seller({ subscriptionTier: "premium", subscriptionStatus: "ACTIVE", access: { active: true, source: "store", endsAt: null } })} />);
  assert.match(html, /Premium/);
  assert.doesNotMatch(html, /Essai/);
});

test("sellers: store + trial keeps the store label and shows the trial as a note", () => {
  const html = text(<SellerAccessCell seller={seller({ subscriptionTier: "standard", subscriptionStatus: "ACTIVE", access: { active: true, source: "store", endsAt: LATER }, platformTrialEndsAt: FUTURE })} />);
  assert.match(html, /Standard/);
  assert.match(html, new RegExp(`Essai offert jusqu’au ${d(FUTURE)}`));
});

test("sellers: revoked and ended trials are notes on the unchanged label, with the right date", () => {
  const revoked = text(<SellerAccessCell seller={seller({ access: { active: false, source: null, endsAt: null }, platformTrialEndsAt: FUTURE, platformTrialRevokedAt: REVOKED_AT })} />);
  assert.match(revoked, /Gratuit/);
  assert.match(revoked, new RegExp(`Essai révoqué le ${d(REVOKED_AT)}`));
  assert.doesNotMatch(revoked, new RegExp(d(FUTURE))); // never the original end
  const ended = text(<SellerAccessCell seller={seller({ access: { active: false, source: null, endsAt: null }, platformTrialEndsAt: PAST })} />);
  assert.match(ended, /Gratuit/);
  assert.match(ended, new RegExp(`Essai terminé le ${d(PAST)}`));
});

test("sellers: an older server without trial fields changes nothing", () => {
  const html = text(<SellerAccessCell seller={seller({ subscriptionTier: "standard" })} />);
  assert.match(html, /Standard/);
  assert.doesNotMatch(html, /Essai/);
});

const sub = (over: Partial<AdminSubscription>): AdminSubscription => ({
  sellerId: "s1", name: "Rosa", email: "r@x.fr", subscriptionStatus: "NONE", plan: null, isPremium: false, category: null,
  currentPeriodEnd: null, trialEndsAt: null, provider: "none", createdAt: "2026-01-01T00:00:00.000Z", ...over,
});

test("subscriptions: trial-only reads 'Essai offert' instead of 'Aucun'", () => {
  const html = text(<SubscriptionAccessCell sub={sub({ access: { active: true, source: "platform_trial", endsAt: FUTURE }, platformTrialEndsAt: FUTURE })} />);
  assert.match(html, /Essai offert/);
  assert.doesNotMatch(html, /Aucun/);
});

test("subscriptions: store status unchanged, trial as a note when overlapping, revoked/ended notes", () => {
  assert.match(text(<SubscriptionAccessCell sub={sub({ subscriptionStatus: "ACTIVE", access: { active: true, source: "store", endsAt: null } })} />), /Actif/);
  const both = text(<SubscriptionAccessCell sub={sub({ subscriptionStatus: "ACTIVE", access: { active: true, source: "store", endsAt: LATER }, platformTrialEndsAt: FUTURE })} />);
  assert.match(both, /Actif/);
  assert.match(both, /Essai offert jusqu’au/);
  const revoked = text(<SubscriptionAccessCell sub={sub({ access: { active: false, source: null, endsAt: null }, platformTrialEndsAt: FUTURE, platformTrialRevokedAt: REVOKED_AT })} />);
  assert.match(revoked, /Aucun/);
  assert.match(revoked, /Essai révoqué le/);
  assert.match(text(<SubscriptionAccessCell sub={sub({ platformTrialEndsAt: PAST })} />), /Essai terminé le/);
});

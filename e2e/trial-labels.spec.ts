import { test, expect } from "@playwright/test";
import type { Page, Route } from "@playwright/test";

/**
 * TASK-041: "Essai offert" in the sellers and subscriptions views, against a MOCKED API.
 *   E2E_API_BASE_URL=http://127.0.0.1:4010 pnpm e2e e2e/trial-labels.spec.ts --project=chromium
 */
const API = process.env.E2E_API_BASE_URL ? new URL(process.env.E2E_API_BASE_URL).origin : "http://127.0.0.1:4010";
test.skip(!process.env.E2E_API_BASE_URL, "Set E2E_API_BASE_URL to an unused origin (e.g. http://127.0.0.1:4010).");

const meta = { timestamp: "2026-12-10T10:00:00.000Z", version: "v1" };
const FUTURE = new Date(Date.now() + 40 * 86_400_000).toISOString();
const LATER = new Date(Date.now() + 90 * 86_400_000).toISOString();
const NONE = { active: false, source: null, endsAt: null };

const seller = (over: Record<string, unknown>) => ({
  id: "s1", name: "Rosa", email: "r@x.fr", category: "FAIT_MAISON", rating: null, ratingCount: 0, totalSales: 0,
  totalRevenueCents: 0, activeListings: 0, subscriptionTier: "free", subscriptionStatus: "NONE",
  stripeDetailsSubmitted: false, stripeChargesEnabled: false, stripePayoutsEnabled: false, stripeOnboardingCompleted: false,
  isSuspended: false, createdAt: "2026-01-01T00:00:00.000Z", access: NONE, platformTrialEndsAt: null, platformTrialRevokedAt: null, ...over,
});
const sub = (over: Record<string, unknown>) => ({
  sellerId: "s1", name: "Rosa", email: "r@x.fr", subscriptionStatus: "NONE", plan: null, isPremium: false, category: null,
  currentPeriodEnd: null, trialEndsAt: null, provider: "none", createdAt: "2026-01-01T00:00:00.000Z",
  access: NONE, platformTrialEndsAt: null, platformTrialRevokedAt: null, ...over,
});

const SELLERS = [
  seller({ id: "t", name: "Trial Tom", access: { active: true, source: "platform_trial", endsAt: FUTURE }, platformTrialEndsAt: FUTURE }),
  seller({ id: "p", name: "Paid Pia", subscriptionTier: "premium", subscriptionStatus: "ACTIVE", access: { active: true, source: "store", endsAt: null } }),
  seller({ id: "b", name: "Both Bea", subscriptionTier: "standard", subscriptionStatus: "ACTIVE", access: { active: true, source: "store", endsAt: LATER }, platformTrialEndsAt: FUTURE }),
  seller({ id: "r", name: "Revoked Rex", platformTrialEndsAt: FUTURE, platformTrialRevokedAt: "2026-12-01T00:00:00.000Z" }),
  seller({ id: "e", name: "Ended Eva", platformTrialEndsAt: "2026-01-10T00:00:00.000Z" }),
];
const SUBS = [
  sub({ sellerId: "t", name: "Trial Tom", access: { active: true, source: "platform_trial", endsAt: FUTURE }, platformTrialEndsAt: FUTURE }),
  sub({ sellerId: "p", name: "Paid Pia", subscriptionStatus: "ACTIVE", access: { active: true, source: "store", endsAt: null } }),
];

const json = (route: Route, data: unknown) =>
  route.fulfill({
    status: 200,
    headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*" },
    contentType: "application/json",
    body: JSON.stringify({ success: true, data, meta, pagination: { hasMore: false, limit: 20 } }),
  });

async function mock(page: Page) {
  await page.route(`${API}/**`, async (route) => {
    const req = route.request();
    if (req.method() === "OPTIONS") {
      return route.fulfill({ status: 204, headers: { "access-control-allow-origin": req.headers()["origin"] ?? "*", "access-control-allow-headers": "*", "access-control-allow-methods": "GET,OPTIONS" } });
    }
    const path = new URL(req.url()).pathname.replace(/^\/v1/, "");
    if (path === "/users/me") return json(route, { id: "a", email: "a@x.test", phone: null, role: "ADMIN", firstName: "A", lastName: "D", avatarPath: null, emailVerified: true, phoneVerified: false, createdAt: "2026-01-01T00:00:00.000Z" });
    if (path === "/admin/sellers") return json(route, SELLERS);
    if (path === "/admin/subscriptions") return json(route, SUBS);
    return json(route, []);
  });
  await page.addInitScript(() => {
    localStorage.setItem("incacook.admin.access_token", "fake");
    localStorage.setItem("incacook.admin.refresh_token", "fake");
    localStorage.setItem("incacook.admin.expires_at", String(Math.floor(Date.now() / 1000) + 86_400));
  });
}

test("sellers list: trial-only, store, store + trial, revoked and ended", async ({ page }) => {
  await mock(page);
  await page.goto("/sellers");
  const row = (name: RegExp) => page.getByRole("row", { name });
  await expect(row(/Trial Tom/)).toContainText("Essai offert", { timeout: 30_000 });
  await expect(row(/Trial Tom/)).toContainText(/jusqu’au/);
  await expect(row(/Trial Tom/)).not.toContainText("Gratuit");
  await expect(row(/Paid Pia/)).toContainText("Premium");
  await expect(row(/Paid Pia/)).not.toContainText("Essai");
  await expect(row(/Both Bea/)).toContainText("Standard");
  await expect(row(/Both Bea/)).toContainText(/Essai offert jusqu’au/);
  await expect(row(/Revoked Rex/)).toContainText("Gratuit");
  await expect(row(/Revoked Rex/)).toContainText("Essai révoqué le 01/12/2026");
  await expect(row(/Ended Eva/)).toContainText("Essai terminé le 10/01/2026");
  await page.screenshot({ path: "test-results/sellers-trial-labels.png", fullPage: true });
});

test("seller drawer shows the same label", async ({ page }) => {
  await mock(page);
  await page.goto("/sellers");
  await page.getByRole("row", { name: /Trial Tom/ }).click();
  await expect(page.getByRole("dialog")).toContainText("Essai offert");
});

test("subscriptions list: 'Essai offert' instead of 'Aucun' for a trial-only seller", async ({ page }) => {
  await mock(page);
  await page.goto("/subscriptions");
  const tom = page.getByRole("row", { name: /Trial Tom/ });
  await expect(tom).toContainText("Essai offert", { timeout: 30_000 });
  await expect(tom).not.toContainText("Aucun");
  await expect(page.getByRole("row", { name: /Paid Pia/ })).toContainText("Actif");
});

test("390 px: the sellers page does not scroll sideways as a whole", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mock(page);
  await page.goto("/sellers");
  await expect(page.getByText("Trial Tom")).toBeVisible({ timeout: 30_000 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

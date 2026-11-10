import { expect, test } from "@playwright/test";

const ACCESS_KEY = "incacook.admin.access_token";
const REFRESH_KEY = "incacook.admin.refresh_token";
const EXPIRES_KEY = "incacook.admin.expires_at";
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "GET,OPTIONS",
};

async function mockAdmin(page: import("@playwright/test").Page, driver: Record<string, unknown>) {
  await page.addInitScript(({ ACCESS_KEY, REFRESH_KEY, EXPIRES_KEY }) => {
    localStorage.setItem(ACCESS_KEY, "mock-access");
    localStorage.setItem(REFRESH_KEY, "mock-refresh");
    localStorage.setItem(EXPIRES_KEY, String(Math.floor(Date.now() / 1000) + 86_400));
  }, { ACCESS_KEY, REFRESH_KEY, EXPIRES_KEY });
  await page.route("**/v1/**", async (route) => {
    const request = route.request();
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS });
    const path = new URL(request.url()).pathname;
    const data = path.endsWith("/users/me")
      ? { id: "u1", email: "admin@example.com", role: "ADMIN", firstName: "Admin", lastName: "User", createdAt: "2026-01-01T00:00:00.000Z" }
      : path.endsWith("/admin/drivers") ? [driver] : [];
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: CORS,
      body: JSON.stringify({ success: true, data, meta: { timestamp: new Date().toISOString() } }),
    });
  });
}

const driver = {
  id: "d1", name: "Amine Benali", email: "amine@example.com", vehicleType: "BICYCLE",
  kycStatus: "APPROVED", isOnline: true, lastSeenAt: "2026-11-10T10:00:00.000Z",
  averageRating: 4.8, totalDeliveries: 142, stripeDetailsSubmitted: true,
  stripeChargesEnabled: true, stripePayoutsEnabled: true, stripeOnboardingCompleted: true,
  isSuspended: false, createdAt: "2024-03-12T00:00:00.000Z",
};

test("direct /zones visit shows the approved French not-found page", async ({ page }) => {
  const response = await page.goto("/zones");
  expect(response?.status()).toBe(404);
  await expect(page.getByText("Cette page est introuvable.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Retour à l’accueil" })).toBeVisible();
});

for (const legacy of [false, true]) {
  test(`driver list and drawer work with ${legacy ? "legacy" : "current"} payload`, async ({ page }) => {
    const payload = legacy ? { ...driver, zones: ["Paris Centre"] } : driver;
    await mockAdmin(page, payload);
    await page.goto("/drivers");
    await expect(page.getByText("Amine Benali").first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("columnheader", { name: "Zones" })).toHaveCount(0);
    await expect(page.getByText("Supervision des livreurs : véhicule, KYC, activité")).toBeVisible();
    await page.getByText("Amine Benali").first().click();
    await expect(page.getByText("Stripe Connect", { exact: true })).toBeVisible();
    await expect(page.getByText("Zones d’opération")).toHaveCount(0);
  });
}

test("driver drawer remains readable at narrow width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockAdmin(page, { ...driver, zones: ["Paris Centre"] });
  await page.goto("/drivers");
  await page.getByText("Amine Benali").first().click();
  await expect(page.getByText("Stripe Connect", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await expect(page.getByText("Zones d’opération")).toHaveCount(0);
});

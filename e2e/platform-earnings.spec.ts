import { test, expect, type Page, type Route } from "@playwright/test";

/**
 * Platform earnings page (TASK-032) — backend-free. The browser talks to a
 * mocked `/v1` API (no real backend, no credentials): the signed-in role comes
 * from a stubbed `GET /v1/users/me`, and the report from a stubbed
 * `GET /v1/admin/platform-earnings`. This proves the route is admin-only and
 * the page issues no request for an invalid range.
 */
const ACCESS_KEY = "incacook.admin.access_token";
const REFRESH_KEY = "incacook.admin.refresh_token";
const EXPIRES_KEY = "incacook.admin.expires_at";

const REPORT = {
  from: "2026-10-02",
  to: "2026-10-31",
  currency: "eur",
  commissionCents: 123456,
  platformBuyerFeeCents: 20000,
  stripeFeesCents: 5050,
  ordersWithoutStripeFee: 2,
  netPlatformCents: 138406,
  owedToUsersCents: 98765,
};

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
};

function envelope(data: unknown) {
  return { success: true, data, meta: { timestamp: new Date().toISOString() } };
}

async function mockApi(page: Page, role: string, earnings: unknown = REPORT) {
  const earningsRequests: string[] = [];
  await page.addInitScript(
    ({ ACCESS_KEY, REFRESH_KEY, EXPIRES_KEY }) => {
      localStorage.setItem(ACCESS_KEY, "mock-access");
      localStorage.setItem(REFRESH_KEY, "mock-refresh");
      localStorage.setItem(EXPIRES_KEY, String(Math.floor(Date.now() / 1000) + 86_400));
    },
    { ACCESS_KEY, REFRESH_KEY, EXPIRES_KEY },
  );
  await page.route("**/v1/**", async (route: Route) => {
    const req = route.request();
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS });
    const url = new URL(req.url());
    const json = (data: unknown) =>
      route.fulfill({ status: 200, contentType: "application/json", headers: CORS, body: JSON.stringify(envelope(data)) });
    if (url.pathname.endsWith("/users/me")) {
      return json({
        id: "u1", email: "mock@example.com", phone: null, role, firstName: "Mock", lastName: "User",
        avatarPath: null, emailVerified: true, phoneVerified: false, createdAt: "2026-01-01T00:00:00.000Z",
      });
    }
    if (url.pathname.endsWith("/admin/platform-earnings")) {
      earningsRequests.push(url.search);
      return json(earnings);
    }
    return json([]);
  });
  return earningsRequests;
}

test.describe("platform earnings route", () => {
  test("an ADMIN sees the nav entry and the report in euros, read-only", async ({ page }) => {
    const requests = await mockApi(page, "ADMIN");
    await page.goto("/platform-earnings");
    await expect(page.getByTestId("platform-earnings-report")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole("link", { name: "Revenus plateforme" })).toBeVisible();
    await expect(page.getByTestId("metric-net")).toContainText("1 384,06");
    await expect(page.getByTestId("orders-without-stripe-fee")).toContainText("2 commande(s)");
    await expect(page.getByTestId("earnings-help")).toContainText("platform-payouts.md");
    // Default range = 30 UTC days, sent as from/to query params.
    expect(requests.length).toBeGreaterThanOrEqual(1);
    expect(requests[0]).toMatch(/from=\d{4}-\d{2}-\d{2}/);
    expect(requests[0]).toMatch(/to=\d{4}-\d{2}-\d{2}/);
    // No write action on the page: only the range submit button inside main.
    await expect(page.locator("main button")).toHaveCount(1);
  });

  test("a MODERATOR cannot use the page and has no nav entry", async ({ page }) => {
    const requests = await mockApi(page, "MODERATOR");
    await page.goto("/platform-earnings");
    await expect(page.getByText("Accès réservé aux administrateurs")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole("link", { name: "Revenus plateforme" })).toHaveCount(0);
    expect(requests).toHaveLength(0);
  });

  test("a BUYER is stopped by the dashboard guard", async ({ page }) => {
    const requests = await mockApi(page, "BUYER");
    await page.goto("/platform-earnings");
    await expect(page.getByText(/Accès non autorisé/)).toBeVisible({ timeout: 60_000 });
    expect(requests).toHaveLength(0);
  });

  test("an invalid range is rejected in the picker before any request", async ({ page }) => {
    const requests = await mockApi(page, "ADMIN");
    await page.goto("/platform-earnings");
    await expect(page.getByTestId("platform-earnings-report")).toBeVisible({ timeout: 60_000 });
    // React strict mode (dev) may issue the initial request twice; count from here.
    const baseline = requests.length;

    await page.locator('input[name="from"]').fill("2026-01-01");
    await page.locator('input[name="to"]').fill("2026-06-30");
    await page.getByRole("button", { name: "Afficher" }).click();
    await expect(page.getByTestId("range-error")).toContainText("92 jours");

    await page.locator('input[name="from"]').fill("2026-06-30");
    await page.locator('input[name="to"]').fill("2026-06-01");
    await page.getByRole("button", { name: "Afficher" }).click();
    await expect(page.getByTestId("range-error")).toContainText("précéder");

    expect(requests).toHaveLength(baseline); // no request for either rejected range

    await page.locator('input[name="from"]').fill("2026-06-01");
    await page.locator('input[name="to"]').fill("2026-06-30");
    await page.getByRole("button", { name: "Afficher" }).click();
    await expect(page.getByTestId("range-error")).toHaveCount(0);
    await expect.poll(() => requests.length).toBe(baseline + 1);
    expect(requests[baseline]).toContain("from=2026-06-01");
    expect(requests[baseline]).toContain("to=2026-06-30");
  });

  test("a Stripe-error report shows net as unavailable with the error text", async ({ page }) => {
    await mockApi(page, "ADMIN", {
      ...REPORT,
      stripeFeesCents: null,
      stripeFeesError: "StripeAPIError: rate_limit",
      netPlatformCents: null,
    });
    await page.goto("/platform-earnings");
    await expect(page.getByTestId("stripe-fees-unavailable")).toContainText("StripeAPIError: rate_limit", { timeout: 60_000 });
    await expect(page.getByTestId("metric-net")).toContainText("Indisponible");
  });
});

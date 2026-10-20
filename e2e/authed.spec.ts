import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";
import path from "node:path";

/**
 * Authenticated end-to-end flows — REQUIRE a reachable backend + an
 * Admin/Moderator account. They reuse the session saved by auth.setup.ts
 * (no per-test login) and self-skip unless creds are set.
 *
 * Run:  E2E_API_BASE_URL=… E2E_ADMIN_EMAIL=… E2E_ADMIN_PASSWORD=… pnpm e2e
 */
const HAS_CREDS = !!(
  process.env.E2E_ADMIN_EMAIL &&
  process.env.E2E_ADMIN_PASSWORD &&
  process.env.E2E_API_BASE_URL
);

const API_ORIGIN = process.env.E2E_API_BASE_URL
  ? new URL(process.env.E2E_API_BASE_URL).origin
  : "";

/**
 * Opens `route`, waits for its list request to come back 200 from the real
 * API, then asserts the table settled into rows or the page's empty state —
 * never a skeleton or an error alert.
 */
async function expectListLoaded(page: Page, route: string, apiPath: string, empty: RegExp) {
  const listResponse = page.waitForResponse(
    (r) =>
      r.request().method() === "GET" &&
      r.url().startsWith(`${API_ORIGIN}/v1${apiPath}`),
    { timeout: 30_000 },
  );
  await page.goto(route);
  expect((await listResponse).status()).toBe(200);

  const main = page.locator("main");
  await expect(main.locator("tbody .animate-pulse")).toHaveCount(0, { timeout: 30_000 });
  await expect(main.getByRole("alert")).toHaveCount(0);
  await expect(main.locator("table tbody tr").or(main.getByText(empty)).first()).toBeVisible();
}

test.describe("authenticated admin flows", () => {
  test.skip(!HAS_CREDS, "Set E2E_API_BASE_URL + E2E_ADMIN_EMAIL + E2E_ADMIN_PASSWORD to run.");
  test.use({ storageState: path.join(__dirname, ".auth", "admin.json") });

  test("overview loads real KPIs (no perpetual skeleton, no error)", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("link", { name: /utilisateurs/i })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/^chargement…?$/i)).toHaveCount(0, { timeout: 30_000 });
  });

  test("users list renders rows from /v1/admin/users", async ({ page }) => {
    await page.goto("/users");
    await expect(page.locator("table tbody tr").first()).toBeVisible({ timeout: 30_000 });
  });

  test("KYC queue renders (table or empty state, no error)", async ({ page }) => {
    await page.goto("/kyc");
    await expect(page.locator("main")).toBeVisible();
    await expect(page.getByText(/réf\.|internal server|500/i)).toHaveCount(0, { timeout: 30_000 });
  });

  test("disputes page renders (table or empty state, no error)", async ({ page }) => {
    await page.goto("/disputes");
    await expect(page.locator("main")).toBeVisible();
    await expect(page.getByText(/réf\.|internal server|500/i)).toHaveCount(0, { timeout: 30_000 });
  });

  test("orders list loads from /v1/admin/orders", async ({ page }) => {
    await expectListLoaded(page, "/orders", "/admin/orders", /^Aucune commande\.$/);
  });

  test("payment oversight loads wallet balances from /v1/admin/wallets", async ({ page }) => {
    await expectListLoaded(page, "/payouts", "/admin/wallets", /^Aucun solde\.$/);
  });

  for (const route of ["/sellers", "/drivers", "/listings", "/catalog", "/subscriptions", "/zones", "/legal", "/geography"]) {
    test(`${route} renders without error`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator("main")).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText(/internal server|500 |unauthor/i)).toHaveCount(0, { timeout: 30_000 });
    });
  }
});

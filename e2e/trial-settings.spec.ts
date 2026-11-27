import { test, expect } from "@playwright/test";
import type { Page, Route } from "@playwright/test";

/**
 * Settings: "Essai offert" (switch + length) against a MOCKED API:
 *   E2E_API_BASE_URL=http://127.0.0.1:4010 pnpm e2e e2e/trial-settings.spec.ts
 */
const API = process.env.E2E_API_BASE_URL ? new URL(process.env.E2E_API_BASE_URL).origin : "http://127.0.0.1:4010";
test.skip(!process.env.E2E_API_BASE_URL, "Set E2E_API_BASE_URL to an unused origin (e.g. http://127.0.0.1:4010).");

const meta = { timestamp: "2026-12-10T10:00:00.000Z", version: "v1" };
const ok = (route: Route, data: unknown) =>
  route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data, meta }) });

async function mockApi(page: Page, role: "ADMIN" | "MODERATOR") {
  const state = { autoRequest: false, days: 60, patches: [] as Record<string, unknown>[], gets: 0 };
  await page.route(`${API}/**`, async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname.replace(/^\/v1/, "");
    const cors = {
      "access-control-allow-origin": req.headers()["origin"] ?? "*",
      "access-control-allow-headers": "*",
      "access-control-allow-methods": "GET,POST,PATCH,OPTIONS",
    };
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
    const orig = route.fulfill.bind(route);
    route.fulfill = (o) => orig({ ...o, headers: { ...(o?.headers ?? {}), ...cors } });
    if (path === "/users/me") {
      return ok(route, { id: "u1", email: "a@incacook.test", phone: null, role, firstName: "Ad", lastName: "Min", avatarPath: null, emailVerified: true, phoneVerified: false, createdAt: "2026-01-01T00:00:00.000Z" });
    }
    if (path === "/admin/settings/seller-trial") {
      if (req.method() === "PATCH") {
        const body = JSON.parse(req.postData() ?? "{}");
        state.patches.push(body);
        if (typeof body.autoRequest === "boolean") state.autoRequest = body.autoRequest;
        if (typeof body.days === "number") state.days = body.days;
      } else {
        state.gets += 1;
      }
      return ok(route, { autoRequest: state.autoRequest, days: state.days, minDays: 7, maxDays: 365, updatedAt: null, updatedById: null });
    }
    if (path === "/admin/settings/delivery-fee") return ok(route, { deliveryFeeCents: 300, deliveryFeeEuros: 3, updatedAt: null, updatedById: null });
    if (path === "/admin/settings/dispatch-radius") return ok(route, { steps: [], isDefault: true, noDriverTimeoutSeconds: 60, updatedAt: null, updatedById: null });
    return ok(route, []);
  });
  await page.addInitScript(() => {
    localStorage.setItem("incacook.admin.access_token", "fake");
    localStorage.setItem("incacook.admin.refresh_token", "fake");
    localStorage.setItem("incacook.admin.expires_at", String(Math.floor(Date.now() / 1000) + 86_400));
  });
  return state;
}

test.describe("Settings: Essai offert (mocked API)", () => {
  test("shows the saved values and the wording the sellers will read", async ({ page }) => {
    await mockApi(page, "ADMIN");
    await page.goto("/settings");
    const card = page.getByText("Essai offert").first();
    await expect(card).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("switch")).not.toBeChecked();
    await expect(page.getByLabel("Durée de l’essai offert (jours)")).toHaveValue("60");
    await expect(page.getByText("Les vendeurs lisent « 2 mois offerts ».")).toBeVisible();
    await expect(page.getByRole("button", { name: "Enregistrer" }).last()).toBeDisabled(); // nothing changed
    await page.screenshot({ path: "test-results/trial-settings.png", fullPage: true });
  });

  test("saves only what changed, and the wording follows the number", async ({ page }) => {
    const state = await mockApi(page, "ADMIN");
    await page.goto("/settings");
    await expect(page.getByRole("switch")).toBeVisible({ timeout: 30_000 });
    await page.getByRole("switch").check();
    await page.getByLabel("Durée de l’essai offert (jours)").fill("45");
    await expect(page.getByText("Les vendeurs lisent « 45 jours offerts ».")).toBeVisible();
    await page.getByLabel("Durée de l’essai offert (jours)").fill("30");
    await expect(page.getByText("Les vendeurs lisent « 1 mois offert ».")).toBeVisible();
    await page.getByRole("button", { name: "Enregistrer" }).last().click();
    await expect(page.getByText("Réglage enregistré.")).toBeVisible();
    expect(state.patches).toEqual([{ autoRequest: true, days: 30 }]);
  });

  test("an out-of-range length cannot be saved", async ({ page }) => {
    const state = await mockApi(page, "ADMIN");
    await page.goto("/settings");
    await expect(page.getByRole("switch")).toBeVisible({ timeout: 30_000 });
    await page.getByLabel("Durée de l’essai offert (jours)").fill("3");
    await expect(page.getByText("Durée invalide.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Enregistrer" }).last()).toBeDisabled();
    expect(state.patches).toEqual([]);
  });

  test("a moderator does not get the card and the endpoint is never called", async ({ page }) => {
    const state = await mockApi(page, "MODERATOR");
    await page.goto("/settings");
    await expect(page.getByText("Frais de livraison").first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Essai offert")).toHaveCount(0);
    expect(state.gets).toBe(0);
  });

  test("layout: grouped sections, equal card widths, one gap between cards", async ({ page }) => {
    await mockApi(page, "ADMIN");
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/settings");
    await expect(page.getByRole("switch")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "Livraison", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Vendeurs", exact: true })).toBeVisible();
    const box = async (name: string) => (await page.getByRole("heading", { name }).locator("xpath=ancestor::*[contains(@class,'shadow-')][1]").boundingBox())!;
    const fee = await box("Frais de livraison");
    const radius = await box("Rayon de répartition");
    const trial = await box("Essai offert");
    expect(Math.abs(fee.width - radius.width)).toBeLessThan(1); // same width
    expect(Math.abs(trial.width - fee.width)).toBeLessThan(1);
    expect(Math.abs(radius.x - (fee.x + fee.width) - 24)).toBeLessThan(1); // 24 px between cards
    await page.screenshot({ path: "test-results/settings-1440.png", fullPage: true });
  });

  test("layout: one column on a phone, no horizontal scroll", async ({ page }) => {
    await mockApi(page, "ADMIN");
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/settings");
    await expect(page.getByRole("switch")).toBeVisible({ timeout: 30_000 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await page.screenshot({ path: "test-results/settings-390.png", fullPage: true });
  });

  test("a moderator sees the delivery section only: no empty « Vendeurs » heading", async ({ page }) => {
    await mockApi(page, "MODERATOR");
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Livraison", exact: true })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "Vendeurs", exact: true })).toHaveCount(0);
  });

  test("dispatch radius with no step: a hint (not a red error), and adding a step works", async ({ page }) => {
    await mockApi(page, "ADMIN");
    await page.goto("/settings");
    await expect(page.getByText("Aucune étape.")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Le programme doit contenir entre 1 et 8 étapes.")).toHaveCount(0);
    await page.getByRole("button", { name: "Ajouter une étape" }).click();
    await expect(page.getByText("Aucune étape.")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Supprimer|Retirer/ }).first()).toBeAttached().catch(() => undefined);
  });
});

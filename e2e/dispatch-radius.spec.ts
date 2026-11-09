import { expect, test, type Page, type Route } from "@playwright/test";

const ACCESS_KEY = "incacook.admin.access_token";
const REFRESH_KEY = "incacook.admin.refresh_token";
const EXPIRES_KEY = "incacook.admin.expires_at";
interface MockSetting {
  steps: Array<{ afterSeconds: number; radiusMeters: number | null }>;
  isDefault: boolean;
  noDriverTimeoutSeconds: number;
  updatedAt: string | null;
  updatedById: string | null;
}
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "GET,PATCH,OPTIONS",
};
const OPEN: MockSetting = {
  steps: [{ afterSeconds: 0, radiusMeters: null }],
  isDefault: true,
  noDriverTimeoutSeconds: 900,
  updatedAt: null,
  updatedById: null,
};

function envelope(data: unknown) {
  return { success: true, data, meta: { timestamp: new Date().toISOString() } };
}

async function mockApi(page: Page, role: string, getFailure?: "forbidden" | "unreachable") {
  const calls: Array<{ method: string; body?: unknown }> = [];
  let setting = OPEN;
  await page.addInitScript(({ ACCESS_KEY, REFRESH_KEY, EXPIRES_KEY }) => {
    localStorage.setItem(ACCESS_KEY, "mock-access");
    localStorage.setItem(REFRESH_KEY, "mock-refresh");
    localStorage.setItem(EXPIRES_KEY, String(Math.floor(Date.now() / 1000) + 86_400));
  }, { ACCESS_KEY, REFRESH_KEY, EXPIRES_KEY });
  await page.route("**/v1/**", async (route: Route) => {
    const req = route.request();
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS });
    const url = new URL(req.url());
    const json = (data: unknown, status = 200) => route.fulfill({
      status,
      contentType: "application/json",
      headers: CORS,
      body: JSON.stringify(status >= 400 ? { success: false, error: { code: "BAD_REQUEST", message: "Schedule rejected by server." } } : envelope(data)),
    });
    if (url.pathname.endsWith("/users/me")) {
      return json({ id: "u1", email: "mock@example.com", phone: null, role, firstName: "Mock", lastName: "User", avatarPath: null, emailVerified: true, phoneVerified: false, createdAt: "2026-01-01T00:00:00.000Z" });
    }
    if (url.pathname.endsWith("/admin/settings/delivery-fee")) {
      return json({ deliveryFeeCents: 500, deliveryFeeEuros: 5, updatedAt: null, updatedById: null });
    }
    if (url.pathname.endsWith("/admin/settings/dispatch-radius")) {
      if (req.method() === "GET") {
        calls.push({ method: "GET" });
        if (getFailure === "forbidden") return json(null, 403);
        if (getFailure === "unreachable") return route.abort("failed");
        return json(setting);
      }
      if (req.method() === "PATCH") {
        const body = req.postDataJSON() as { steps: Array<{ afterSeconds: number; radiusMeters: number | null }> };
        calls.push({ method: "PATCH", body });
        if (body.steps.length === 2) return json(null, 400);
        setting = { ...setting, steps: body.steps, isDefault: false, updatedAt: "2026-11-05T12:00:00.000Z", updatedById: "u1" };
        return json(setting);
      }
    }
    return json([]);
  });
  return calls;
}

test.describe("dispatch radius settings", () => {
  test("disable discards an unsaved radius edit and shows the server schedule", async ({ page }) => {
    const calls = await mockApi(page, "ADMIN");
    await page.goto("/settings");
    await expect(page.getByLabel("Rayon étape 1")).toHaveValue("");

    await page.getByLabel("Rayon étape 1").fill("2,5");
    page.on("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Désactiver le rayon (répartition ouverte)" }).click();

    await expect.poll(() => calls.filter((call) => call.method === "PATCH").length).toBe(1);
    expect(calls.find((call) => call.method === "PATCH")?.body).toEqual({ steps: [{ afterSeconds: 0, radiusMeters: null }] });
    await expect(page.getByText("Aucun rayon configuré : la répartition est ouverte à tous les livreurs en ligne.")).toBeVisible();
    await expect(page.getByLabel("Délai étape 1")).toHaveValue("00:00");
    await expect(page.getByLabel("Rayon étape 1")).toHaveValue("");
    await expect(page.getByLabel(/^Délai étape/)).toHaveCount(1);
  });

  test("loads default, saves/read-backs, surfaces server 400, and confirms disable", async ({ page }) => {
    const calls = await mockApi(page, "ADMIN");
    await page.goto("/settings");
    await expect(page.getByText("Aucun rayon configuré : la répartition est ouverte à tous les livreurs en ligne.")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByLabel("Délai étape 1")).toHaveValue("00:00");
    await expect(page.getByText("Illimité", { exact: true })).toBeVisible();

    await page.getByLabel("Rayon étape 1").fill("2,5");
    await page.getByRole("button", { name: "Enregistrer" }).last().click();
    await expect.poll(() => calls.filter((call) => call.method === "PATCH").length).toBe(1);
    expect(calls.at(-1)?.body).toEqual({ steps: [{ afterSeconds: 0, radiusMeters: 2500 }] });
    await expect(page.getByText("Administrateur u1")).toBeVisible();

    await page.getByLabel("Rayon étape 1").fill("0x10");
    await expect(page.getByText("Chaque rayon doit être un nombre décimal en km.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Enregistrer" }).last()).toBeDisabled();
    await page.getByLabel("Rayon étape 1").fill("2,5");

    await page.getByRole("button", { name: "Ajouter une étape" }).click();
    await page.getByLabel("Délai étape 2").fill("01:00");
    await page.getByLabel("Rayon étape 2").fill("3");
    await page.getByRole("button", { name: "Enregistrer" }).last().click();
    await expect(page.getByText("Schedule rejected by server.")).toBeVisible();

    page.on("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Désactiver le rayon (répartition ouverte)" }).click();
    await expect.poll(() => calls.filter((call) => call.method === "PATCH").length).toBe(3);
    expect(calls.at(-1)?.body).toEqual({ steps: [{ afterSeconds: 0, radiusMeters: null }] });
    await expect(page.getByText("Aucun rayon configuré : la répartition est ouverte à tous les livreurs en ligne.")).toBeVisible();
  });

  test("a Moderator sees the full-Admin message without requesting settings", async ({ page }) => {
    const calls = await mockApi(page, "MODERATOR");
    await page.goto("/settings");
    await expect(page.getByText("Accès réservé aux administrateurs").first()).toBeVisible({ timeout: 60_000 });
    expect(calls.filter((call) => call.method === "GET" || call.method === "PATCH")).toHaveLength(0);
  });

  for (const failure of ["forbidden", "unreachable"] as const) {
    test(`${failure} GET shows the standard retryable error`, async ({ page }) => {
      const calls = await mockApi(page, "ADMIN", failure);
      await page.goto("/settings");
      await expect(page.getByText("Schedule rejected by server.").or(page.getByText(/échec|réseau|network|fetch/i)).first()).toBeVisible({ timeout: 20_000 });
      await expect(page.getByRole("button", { name: /réessayer/i }).first()).toBeVisible();
      expect(calls.filter((call) => call.method === "PATCH")).toHaveLength(0);
    });
  }
});

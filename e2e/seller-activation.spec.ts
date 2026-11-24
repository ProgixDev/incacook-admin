import { test, expect } from "@playwright/test";
import type { Page, Route } from "@playwright/test";

/**
 * "Activation vendeurs" (TASK-040) against a MOCKED API: no backend needed.
 * Run with an API origin nothing listens on, so only the mocks answer:
 *   E2E_API_BASE_URL=http://127.0.0.1:4010 pnpm e2e e2e/seller-activation.spec.ts
 */
const API = process.env.E2E_API_BASE_URL ? new URL(process.env.E2E_API_BASE_URL).origin : "http://127.0.0.1:4010";
test.skip(!process.env.E2E_API_BASE_URL, "Set E2E_API_BASE_URL to an unused origin (e.g. http://127.0.0.1:4010).");

const ACCESS_KEY = "incacook.admin.access_token";
const REFRESH_KEY = "incacook.admin.refresh_token";
const EXPIRES_KEY = "incacook.admin.expires_at";
const meta = { timestamp: "2026-12-10T10:00:00.000Z", version: "v1" };
const FUTURE = new Date(Date.now() + 40 * 86_400_000).toISOString();
const LATER = new Date(Date.now() + 90 * 86_400_000).toISOString();

const row = (over: Record<string, unknown>) => ({
  sellerId: "s1",
  displayName: "Chez Rosa",
  email: "rosa@example.fr",
  category: "FAIT_MAISON",
  signedUpAt: "2026-12-01T10:00:00.000Z",
  isTestAccount: false,
  isSuspended: false,
  nextStep: null,
  kycState: "APPROVED",
  canList: true,
  onboardingUnavailable: false,
  access: { active: false, source: null, endsAt: null },
  trialEndsAt: null,
  trialRevokedAt: null,
  listings: 0,
  orders: 0,
  trialRequest: "none",
  ...over,
});

const activation = (sellers: unknown[], counters: Record<string, number> = {}) => ({
  windowDays: 30,
  counters: { signups: 3, ready: 2, onboardingUnavailable: 0, withAccess: 1, firstListing: 0, ...counters },
  countersCapped: false,
  sellers,
  pagination: { limit: 20, offset: 0, hasMore: false },
});

const ok = (route: Route, data: unknown, extra: Record<string, unknown> = {}) =>
  route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data, meta, ...extra }) });
const fail = (route: Route, status: number, code: string, message: string) =>
  route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify({ success: false, error: { statusCode: status, code, message, error: "Conflict", timestamp: meta.timestamp, path: "/" } }),
  });

interface Calls { activation: number; trials: number; posts: Array<{ url: string; body: Record<string, unknown> }>; patches: string[] }

async function mockApi(page: Page, role: "ADMIN" | "MODERATOR", handlers: { post?: (url: string, route: Route) => Promise<boolean> } = {}) {
  const calls: Calls = { activation: 0, trials: 0, posts: [], patches: [] };
  await page.route(`${API}/**`, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname.replace(/^\/v1/, "");
    const method = req.method();
    const cors = { "access-control-allow-origin": req.headers()["origin"] ?? "*", "access-control-allow-headers": "*", "access-control-allow-methods": "GET,POST,PATCH,OPTIONS" };
    if (method === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
    // Every response needs CORS headers: wrap fulfill.
    const orig = route.fulfill.bind(route);
    route.fulfill = (o) => orig({ ...o, headers: { ...(o?.headers ?? {}), ...cors } });

    if (path === "/users/me") {
      return ok(route, { id: "admin-1", email: "admin@incacook.test", phone: null, role, firstName: "Ad", lastName: "Min", avatarPath: null, emailVerified: true, phoneVerified: false, createdAt: "2026-01-01T00:00:00.000Z" });
    }
    if (path === "/admin/seller-activation") {
      calls.activation += 1;
      const includeTest = url.searchParams.get("includeTest") === "true";
      const sellers = [
        row({ sellerId: "s1", displayName: "Chez Rosa", canList: true }),
        row({ sellerId: "s2", displayName: "A".repeat(120), email: "long@example.fr", nextStep: "kyc_id", canList: false, trialRequest: "pending" }),
        row({ sellerId: "s3", displayName: "Trial Tom", email: "tom@example.fr", access: { active: true, source: "platform_trial", endsAt: FUTURE }, trialEndsAt: FUTURE, trialRequest: "granted", listings: 2, orders: 1 }),
        // Store subscription overlapping a longer trial: the trial can still be extended or revoked.
        row({ sellerId: "s5", displayName: "Both Bea", email: "bea@example.fr", access: { active: true, source: "store", endsAt: LATER }, trialEndsAt: FUTURE, trialRequest: "granted" }),
        ...(includeTest ? [row({ sellerId: "s4", displayName: "QA bot", email: "qa@example.fr", isTestAccount: true })] : []),
      ];
      return ok(route, activation(sellers));
    }
    if (path === "/admin/seller-trials") {
      calls.trials += 1;
      const filter = url.searchParams.get("filter");
      const items =
        filter === "pending"
          ? [{ sellerId: "s2", displayName: "Pending Pat", email: "pat@example.fr", category: "FAIT_MAISON", signedUpAt: "2026-12-02T10:00:00.000Z", requestState: "pending", requestedAt: "2026-12-03T10:00:00.000Z", trialEndsAt: null, trialRevokedAt: null, access: { active: false, source: null, endsAt: null }, duplicates: [{ sellerId: "s9", displayName: "Pat bis", reasons: ["email", "phone"] }] },
              // Asked for a trial, then subscribed through the store: a grant could only fail.
              { sellerId: "s7", displayName: "Sub Sam", email: "sam@example.fr", category: "FAIT_MAISON", signedUpAt: "2026-12-02T10:00:00.000Z", requestState: "pending", requestedAt: "2026-12-03T11:00:00.000Z", trialEndsAt: null, trialRevokedAt: null, access: { active: true, source: "store", endsAt: FUTURE }, duplicates: [] }]
          : [{ sellerId: "s1", displayName: "Chez Rosa", email: "rosa@example.fr", category: "FAIT_MAISON", signedUpAt: "2026-12-01T10:00:00.000Z", requestState: "none", requestedAt: null, trialEndsAt: null, trialRevokedAt: null, duplicates: [] }];
      // The server flattens `{ items, hasMore }` to data = items + a top-level pagination block.
      return ok(route, items, { pagination: { hasMore: false, limit: 20 } });
    }
    if (method === "POST" && /\/admin\/sellers\/[^/]+\/trial\//.test(path)) {
      const body = JSON.parse(req.postData() ?? "{}");
      calls.posts.push({ url: path, body });
      if (handlers.post && (await handlers.post(path, route))) return;
      return ok(route, { sellerId: "s1", requestState: "granted", endsAt: FUTURE, accessActive: true });
    }
    if (method === "PATCH" && /test-account/.test(path)) {
      calls.patches.push(path);
      return ok(route, { userId: "s1", isTestAccount: true });
    }
    return ok(route, []);
  });
  await page.addInitScript(
    ({ ACCESS_KEY, REFRESH_KEY, EXPIRES_KEY }) => {
      localStorage.setItem(ACCESS_KEY, "fake");
      localStorage.setItem(REFRESH_KEY, "fake");
      localStorage.setItem(EXPIRES_KEY, String(Math.floor(Date.now() / 1000) + 86_400));
    },
    { ACCESS_KEY, REFRESH_KEY, EXPIRES_KEY },
  );
  return calls;
}

test.describe("Activation vendeurs (mocked API)", () => {
  test("admin: nav entry, counters, rows, test accounts hidden by default", async ({ page }) => {
    await mockApi(page, "ADMIN");
    await page.goto("/seller-activation");
    await expect(page.getByRole("heading", { name: "Activation vendeurs" })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("link", { name: "Activation vendeurs" })).toBeVisible();
    const funnel = page.getByRole("region", { name: /Entonnoir/ });
    await expect(funnel).toContainText("Inscrits");
    await expect(funnel).toContainText("3");
    await expect(page.getByText("Chez Rosa")).toBeVisible();
    await expect(page.getByText("Pièce d’identité")).toBeVisible(); // first incomplete step
    await expect(page.getByText(/Essai offert · jusqu’au/)).toBeVisible();
    await expect(page.getByText("QA bot")).toHaveCount(0); // test account excluded by default
    await page.getByLabel("Inclure les comptes test").check();
    await expect(page.getByText("QA bot")).toBeVisible();
    await page.screenshot({ path: "test-results/seller-activation-desktop.png", fullPage: true });
  });

  test("actions follow the seller's real state: incomplete onboarding cannot be granted, store + trial can be managed", async ({ page }) => {
    await mockApi(page, "ADMIN");
    await page.goto("/seller-activation");
    await expect(page.getByText("Both Bea")).toBeVisible({ timeout: 30_000 });
    const incomplete = page.getByRole("row", { name: /AAAA/ });
    await expect(incomplete.getByRole("button", { name: "Accorder" })).toHaveCount(0); // onboarding not finished
    await expect(incomplete.getByRole("button", { name: "Refuser" })).toBeVisible(); // its pending request can be refused
    const both = page.getByRole("row", { name: /Both Bea/ });
    await expect(both.getByRole("button", { name: "Prolonger" })).toBeVisible();
    await expect(both.getByRole("button", { name: "Révoquer" })).toBeVisible();
    await expect(both.getByRole("button", { name: "Accorder" })).toHaveCount(0);
  });

  test("moderator does not see the nav entry and gets the access-denied panel", async ({ page }) => {
    await mockApi(page, "MODERATOR");
    await page.goto("/seller-activation");
    await expect(page.getByText("Accès réservé aux administrateurs")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("link", { name: "Activation vendeurs" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Accorder" })).toHaveCount(0);
  });

  test("filters: ready without access, pending requests with duplicate hints", async ({ page }) => {
    await mockApi(page, "ADMIN");
    await page.goto("/seller-activation");
    await page.getByRole("tab", { name: "Prêts sans accès" }).click();
    await expect(page.getByText("Chez Rosa")).toBeVisible();
    await page.getByRole("tab", { name: "Demandes en attente" }).click();
    await expect(page.getByText("Pending Pat")).toBeVisible();
    await expect(page.getByText("Pat bis : même e-mail, même téléphone")).toBeVisible();
    await expect(page.getByRole("button", { name: "Refuser" }).first()).toBeVisible();
    // The subscriber is only offered a refusal, never a grant that would answer 409.
    const sam = page.getByRole("row", { name: /Sub Sam/ });
    await expect(sam.getByRole("button", { name: "Refuser" })).toBeVisible();
    await expect(sam.getByRole("button", { name: "Accorder" })).toHaveCount(0);
  });

  test("grant: confirmation, default 60 days, server state refetched", async ({ page }) => {
    const calls = await mockApi(page, "ADMIN");
    await page.goto("/seller-activation");
    await expect(page.getByText("Chez Rosa")).toBeVisible({ timeout: 30_000 });
    const before = calls.activation;
    await page.getByRole("row", { name: /Chez Rosa/ }).getByRole("button", { name: "Accorder" }).click();
    await expect(page.getByRole("dialog")).toContainText("Accorder · Chez Rosa");
    await expect(page.getByLabel("Durée (jours)")).toHaveValue("60");
    await page.getByRole("button", { name: /Confirmer : accorder/ }).click();
    await expect(page.getByRole("status")).toContainText("Essai accordé à Chez Rosa");
    expect(calls.posts).toEqual([{ url: "/admin/sellers/s1/trial/grant", body: { days: 60 } }]);
    await expect.poll(() => calls.activation).toBeGreaterThan(before); // refetched, not assumed
  });

  test("revoke needs a reason: nothing is sent until one is typed", async ({ page }) => {
    const calls = await mockApi(page, "ADMIN");
    await page.goto("/seller-activation");
    await page.getByRole("row", { name: /Trial Tom/ }).getByRole("button", { name: "Révoquer" }).click();
    await page.getByRole("button", { name: /Confirmer : révoquer/ }).click();
    await expect(page.getByRole("alert")).toContainText("Le motif est obligatoire");
    expect(calls.posts).toHaveLength(0);
    await page.getByLabel(/Motif/).fill("Compte en double");
    await page.getByRole("button", { name: /Confirmer : révoquer/ }).click();
    await expect(page.getByRole("status")).toContainText("révoqué");
    expect(calls.posts[0]).toEqual({ url: "/admin/sellers/s3/trial/revoke", body: { reason: "Compte en double" } });
  });

  test("extend sends the end date the admin saw", async ({ page }) => {
    const calls = await mockApi(page, "ADMIN");
    await page.goto("/seller-activation");
    await page.getByRole("row", { name: /Trial Tom/ }).getByRole("button", { name: "Prolonger" }).click();
    await page.getByRole("button", { name: /Confirmer : prolonger/ }).click();
    await expect(page.getByRole("status")).toContainText("prolongé");
    expect(calls.posts[0].body).toEqual({ days: 30, expectedEndsAt: FUTURE });
  });

  test("a seller already granted by another admin: French message and the list is refetched", async ({ page }) => {
    const calls = await mockApi(page, "ADMIN", {
      post: async (_url, route) => {
        await fail(route, 409, "INCACOOK_TRIAL_ALREADY_ACTIVE", "Ce vendeur a déjà accès à la plateforme");
        return true;
      },
    });
    await page.goto("/seller-activation");
    await expect(page.getByText("Chez Rosa")).toBeVisible({ timeout: 30_000 });
    const before = calls.activation;
    await page.getByRole("row", { name: /Chez Rosa/ }).getByRole("button", { name: "Accorder" }).click();
    await page.getByRole("button", { name: /Confirmer : accorder/ }).click();
    await expect(page.getByRole("dialog").getByRole("alert")).toContainText("Prolonge son essai");
    await expect.poll(() => calls.activation).toBeGreaterThan(before);
    // (The refetch shows what the server now says; a list row without access information is covered by the unit tests.)
  });

  test("a stale end date closes the dialog, says so, and refetches (no re-sending the old date)", async ({ page }) => {
    const calls = await mockApi(page, "ADMIN", {
      post: async (_url, route) => {
        await fail(route, 409, "INCACOOK_TRIAL_STALE", "stale");
        return true;
      },
    });
    await page.goto("/seller-activation");
    await expect(page.getByText("Trial Tom")).toBeVisible({ timeout: 30_000 });
    const before = calls.activation;
    await page.getByRole("row", { name: /Trial Tom/ }).getByRole("button", { name: "Prolonger" }).click();
    await page.getByRole("button", { name: /Confirmer : prolonger/ }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator("main").getByRole("alert")).toContainText("modifié entre-temps");
    await expect.poll(() => calls.activation).toBeGreaterThan(before);
    expect(calls.posts).toHaveLength(1);
  });

  test("an emptied page steps back instead of leaving a dead end (phone)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockApi(page, "ADMIN");
    await page.route(`${API}/v1/admin/seller-activation*`, (route) => {
      const offset = Number(new URL(route.request().url()).searchParams.get("offset") ?? "0");
      const data = offset > 0 ? { ...activation([]) } : { ...activation([row({ sellerId: "s1", displayName: "Chez Rosa" })]), pagination: { limit: 20, offset: 0, hasMore: true } };
      return route.fulfill({ status: 200, headers: { "access-control-allow-origin": "*" }, contentType: "application/json", body: JSON.stringify({ success: true, data, meta }) });
    });
    await page.goto("/seller-activation");
    await expect(page.getByText("Chez Rosa")).toBeVisible({ timeout: 30_000 });
    await page.getByRole("button", { name: "Suivant" }).click();
    // Page 2 is empty: the page goes back to 1 by itself.
    await expect(page.getByText("Page 1")).toBeVisible();
    await expect(page.getByText("Chez Rosa")).toBeVisible();
  });

  test("test-account toggle calls the API and refetches", async ({ page }) => {
    const calls = await mockApi(page, "ADMIN");
    await page.goto("/seller-activation");
    await page.getByRole("row", { name: /Chez Rosa/ }).getByRole("button", { name: /Marquer comme compte test/ }).click();
    await expect.poll(() => calls.patches).toEqual(["/admin/users/s1/test-account"]);
  });

  test("usable at 390 px: no page-wide horizontal scroll, long names are cut", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockApi(page, "ADMIN");
    await page.goto("/seller-activation");
    await expect(page.getByText("Chez Rosa")).toBeVisible({ timeout: 30_000 });
    // The actions are reachable without sideways scrolling: cards, not a clipped table.
    await expect(page.getByRole("button", { name: "Accorder" }).first()).toBeVisible();
    const box = await page.getByRole("button", { name: "Accorder" }).first().boundingBox();
    expect(box && box.x + box.width <= 390).toBe(true);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await page.screenshot({ path: "test-results/seller-activation-390.png", fullPage: true });
  });

  test("empty table shows a message", async ({ page }) => {
    await mockApi(page, "ADMIN");
    await page.route(`${API}/v1/admin/seller-activation*`, (route) =>
      route.fulfill({ status: 200, headers: { "access-control-allow-origin": "*" }, contentType: "application/json", body: JSON.stringify({ success: true, data: activation([], { signups: 0, ready: 0, withAccess: 0 }), meta }) }),
    );
    await page.goto("/seller-activation");
    await expect(page.getByText("Aucun vendeur.")).toBeVisible({ timeout: 30_000 });
  });
});

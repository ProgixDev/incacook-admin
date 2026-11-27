import { test, expect } from "@playwright/test";
import type { Page, Route } from "@playwright/test";

/**
 * Admin home "À traiter" against a MOCKED API (no backend):
 *   E2E_API_BASE_URL=http://127.0.0.1:4010 pnpm e2e e2e/home-todo.spec.ts
 */
const API = process.env.E2E_API_BASE_URL
  ? new URL(process.env.E2E_API_BASE_URL).origin
  : "http://127.0.0.1:4010";
test.skip(
  !process.env.E2E_API_BASE_URL,
  "Set E2E_API_BASE_URL to an unused origin (e.g. http://127.0.0.1:4010).",
);

const meta = { timestamp: "2026-12-10T10:00:00.000Z", version: "v1" };
const ok = (route: Route, data: unknown, extra: Record<string, unknown> = {}) =>
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ success: true, data, meta, ...extra }),
  });

type Todo = Record<string, number | null>;

async function mockApi(
  page: Page,
  todo: Todo | "error",
  role: "ADMIN" | "MODERATOR" = "ADMIN",
) {
  let todoCalls = 0;
  await page.route(`${API}/**`, async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname.replace(/^\/v1/, "");
    const cors = {
      "access-control-allow-origin": req.headers()["origin"] ?? "*",
      "access-control-allow-headers": "*",
      "access-control-allow-methods": "GET,POST,PATCH,OPTIONS",
    };
    if (req.method() === "OPTIONS")
      return route.fulfill({ status: 204, headers: cors });
    const orig = route.fulfill.bind(route);
    route.fulfill = (o) =>
      orig({ ...o, headers: { ...(o?.headers ?? {}), ...cors } });
    if (path === "/users/me") {
      return ok(route, {
        id: "admin-1",
        email: "admin@incacook.test",
        phone: null,
        role,
        firstName: "Ad",
        lastName: "Min",
        avatarPath: null,
        emailVerified: true,
        phoneVerified: false,
        createdAt: "2026-01-01T00:00:00.000Z",
      });
    }
    if (path === "/admin/todo") {
      todoCalls += 1;
      if (todo === "error") {
        return route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            error: {
              statusCode: 500,
              code: "X",
              message: "boom",
              error: "x",
              timestamp: meta.timestamp,
              path: "/",
            },
          }),
        });
      }
      return ok(route, todo);
    }
    if (path === "/admin/seller-trials")
      return ok(route, [], { pagination: { hasMore: false, limit: 20 } });
    if (path === "/admin/seller-activation") {
      return ok(route, {
        windowDays: 30,
        counters: {
          signups: 0,
          ready: 0,
          onboardingUnavailable: 0,
          withAccess: 0,
          firstListing: 0,
        },
        countersCapped: false,
        sellers: [],
        pagination: { limit: 20, offset: 0, hasMore: false },
      });
    }
    return ok(route, []);
  });
  await page.addInitScript(() => {
    localStorage.setItem("incacook.admin.access_token", "fake");
    localStorage.setItem("incacook.admin.refresh_token", "fake");
    localStorage.setItem(
      "incacook.admin.expires_at",
      String(Math.floor(Date.now() / 1000) + 86_400),
    );
  });
  return () => todoCalls;
}

const all0 = {
  kycPeople: 0,
  trialRequests: 0,
  readyWithoutAccess: 0,
  reports: 0,
  disputes: 0,
  catalogClaims: 0,
};

test.describe("Home: À traiter (mocked API)", () => {
  test("lists only what is waiting, each line links to its page", async ({
    page,
  }) => {
    await mockApi(page, {
      ...all0,
      kycPeople: 3,
      trialRequests: 2,
      reports: 1,
    });
    await page.goto("/dashboard");
    const todo = page.getByRole("region", { name: "À traiter" });
    await expect(
      todo.getByRole("link", { name: /Vérifications KYC/ }),
    ).toHaveAttribute("href", "/kyc");
    await expect(
      todo.getByRole("link", { name: /Demandes d’essai offert/ }),
    ).toHaveAttribute("href", "/seller-activation?view=pending");
    await expect(
      todo.getByRole("link", { name: /Signalements/ }),
    ).toHaveAttribute("href", "/reports");
    await expect(todo.getByRole("link", { name: /Litiges/ })).toHaveCount(0); // nothing waiting: not listed
    await page.screenshot({
      path: "test-results/home-todo.png",
      fullPage: true,
    });
  });

  test("says so when nothing is waiting", async ({ page }) => {
    await mockApi(page, all0);
    await page.goto("/dashboard");
    await expect(
      page.getByText("Rien à traiter pour le moment."),
    ).toBeVisible();
  });

  test("an unreadable count is reported, never shown as nothing to do", async ({
    page,
  }) => {
    await mockApi(page, { ...all0, kycPeople: null, reports: 4 });
    await page.goto("/dashboard");
    const todo = page.getByRole("region", { name: "À traiter" });
    await expect(
      todo.getByRole("link", { name: /Signalements/ }),
    ).toBeVisible();
    await expect(
      todo.getByText(/Compteur indisponible : Vérifications KYC/),
    ).toBeVisible();
    await expect(page.getByText("Rien à traiter pour le moment.")).toHaveCount(
      0,
    );
  });

  test("a failed list offers a retry and does not break the page", async ({
    page,
  }) => {
    await mockApi(page, "error");
    await page.goto("/dashboard");
    await expect(
      page.getByText("La liste « À traiter » est indisponible."),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Réessayer" })).toBeVisible();
  });

  test("the activation page opens on the view the home linked to", async ({
    page,
  }) => {
    await mockApi(page, all0);
    await page.goto("/seller-activation?view=pending");
    await expect(
      page.getByRole("tab", { name: "Demandes en attente" }),
    ).toHaveAttribute("aria-selected", "true");
    await page.goto("/seller-activation");
    await expect(
      page.getByRole("tab", { name: "Tous les vendeurs" }),
    ).toHaveAttribute("aria-selected", "true");
  });

  test("a moderator does not get the list (admin-only endpoint): no section, no request", async ({
    page,
  }) => {
    const todoCalls = await mockApi(page, all0, "MODERATOR");
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: "Vue d'ensemble" }),
    ).toBeVisible();
    await expect(page.getByRole("region", { name: "À traiter" })).toHaveCount(
      0,
    );
    await expect(
      page.getByText("La liste « À traiter » est indisponible."),
    ).toHaveCount(0);
    expect(todoCalls()).toBe(0);
  });
});

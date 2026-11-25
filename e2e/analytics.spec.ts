import { test, expect } from "@playwright/test";
import type { Page, Route } from "@playwright/test";

/**
 * Admin « Analytics » page against a MOCKED API (no backend). Run with an API origin nothing listens on:
 *   NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:4010 E2E_API_BASE_URL=http://127.0.0.1:4010 pnpm e2e e2e/analytics.spec.ts
 */
const API = process.env.E2E_API_BASE_URL
  ? new URL(process.env.E2E_API_BASE_URL).origin
  : "http://127.0.0.1:4010";
test.skip(
  !process.env.E2E_API_BASE_URL,
  "Set E2E_API_BASE_URL to an unused origin (e.g. http://127.0.0.1:4010).",
);

const meta = { timestamp: "2026-12-10T10:00:00.000Z", version: "v1" };
const ok = (route: Route, data: unknown) =>
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ success: true, data, meta }),
  });
const fail = (route: Route, status: number, code: string, message: string) =>
  route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify({
      success: false,
      error: {
        statusCode: status,
        code,
        message,
        error: "Bad Gateway",
        timestamp: meta.timestamp,
        path: "/",
      },
    }),
  });

const EVENTS: Array<[string, string, number, number]> = [
  ["tutorial_begin", "Tutoriel ouvert", 200, 100],
  ["tutorial_complete", "Tutoriel terminé", 90, 70],
  ["signup_step_view", "Étape d’inscription vue", 300, 60],
  ["sign_up", "Compte créé", 40, 30],
  ["role_selected", "Rôle choisi", 38, 29],
  ["paywall_view", "Page d’abonnement vue", 20, 15],
  ["trial_request", "Demande d’essai (tentatives)", 8, 6],
  ["subscription_purchase", "Achat d’abonnement (tentatives)", 3, 3],
];
const funnel = (over: Record<string, unknown> = {}) => ({
  configured: true,
  windowDays: 30,
  generatedAt: "2026-12-10T10:00:00.000Z",
  consentedOnly: true,
  steps: EVENTS.map(([event, label, events, users], i) => ({
    event,
    label,
    events,
    // 5 of the 8 trial requests and 2 of the 3 purchase attempts worked; others have no outcome.
    succeededEvents:
      event === "trial_request"
        ? 5
        : event === "subscription_purchase"
          ? 2
          : null,
    users,
    conversionFromPrevious: i === 0 ? null : users / EVENTS[i - 1]![3],
    conversionFromFirst: i === 0 ? null : users / EVENTS[0]![3],
  })),
  daily: [
    { date: "2026-12-08", signUp: 2, trialRequest: 1, subscriptionPurchase: 0 },
    { date: "2026-12-09", signUp: 5, trialRequest: 2, subscriptionPurchase: 1 },
  ],
  breakdowns: [
    {
      event: "sign_up",
      parameter: "method",
      label: "Comptes créés par méthode",
      values: [
        { value: "google", events: 25 },
        { value: "email", events: 15 },
      ],
    },
    {
      event: "trial_request",
      parameter: "result",
      label: "Demandes d’essai : résultat",
      values: [
        { value: "requested", events: 7 },
        { value: "not_eligible", events: 1 },
      ],
    },
    {
      event: "role_selected",
      parameter: "role",
      label: "Rôles choisis",
      values: [],
    },
  ],
  ...over,
});

async function mockApi(
  page: Page,
  role: "ADMIN" | "MODERATOR",
  handler?: (url: URL, route: Route) => Promise<boolean>,
) {
  const seen: string[] = [];
  await page.route(`${API}/**`, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname.replace(/^\/v1/, "");
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
    if (path === "/admin/analytics/funnel") {
      seen.push(url.searchParams.get("days") ?? "absent");
      if (handler && (await handler(url, route))) return;
      return ok(
        route,
        funnel({ windowDays: Number(url.searchParams.get("days") ?? 30) }),
      );
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
  return seen;
}

test.describe("Analytics (mocked API)", () => {
  test("admin: nav entry, key figures, steps, daily chart, breakdowns and the consent note", async ({
    page,
  }) => {
    await mockApi(page, "ADMIN");
    await page.goto("/analytics");
    await expect(
      page.getByRole("link", { name: "Analytics" }).first(),
    ).toBeVisible();
    await expect(page.getByRole("note")).toContainText(
      "ne comptent que les personnes qui ont accepté",
    );
    const key = page.getByRole("region", { name: "Chiffres clés" });
    await expect(key).toContainText("Comptes créés");
    await expect(key).toContainText("30");
    // Trial requests and purchases fire on every attempt: successes are shown as successes,
    // with the attempts beside them, never the attempts under a success label.
    await expect(key).toContainText("sur 8 tentatives");
    await expect(key).toContainText("sur 3 tentatives");
    await expect(key).toContainText("Abonnements achetés");
    const steps = page.getByRole("region", { name: "Étapes" });
    await expect(steps.getByText("Page d’abonnement vue")).toBeVisible();
    await expect(steps).toContainText("52 % de l’étape précédente");
  });

  test("while successes are not measurable yet the cards say attempts, not purchases", async ({
    page,
  }) => {
    await mockApi(page, "ADMIN", async (url, route) => {
      if (url.pathname.endsWith("/analytics/funnel")) {
        await ok(
          route,
          funnel({
            steps: funnel().steps.map((s) => ({ ...s, succeededEvents: null })),
          }),
        );
        return true;
      }
      return false;
    });
    await page.goto("/analytics");
    const key = page.getByRole("region", { name: "Chiffres clés" });
    await expect(key).toContainText("Tentatives d’achat");
    await expect(key).toContainText("Tentatives d’essai");
    await expect(key).not.toContainText("Abonnements achetés");
  });

  test("breakdowns use French labels and show an empty split as such", async ({
    page,
  }) => {
    await mockApi(page, "ADMIN");
    await page.goto("/analytics");
    const detail = page.getByRole("region", { name: "Détail par paramètre" });
    await expect(detail).toContainText("Comptes créés par méthode");
    await expect(detail.getByText("Google", { exact: true })).toBeVisible();
    await expect(detail.getByText("Non éligible")).toBeVisible();
    await expect(detail).toContainText("Pas encore de données.");
  });

  test("custom dimensions not available yet: the rest still shows, with the 24 h note", async ({
    page,
  }) => {
    await mockApi(page, "ADMIN", async (_u, route) => {
      await ok(route, funnel({ breakdowns: null }));
      return true;
    });
    await page.goto("/analytics");
    await expect(page.getByRole("region", { name: "Étapes" })).toBeVisible();
    await expect(
      page.getByRole("status").filter({ hasText: "sous 24 heures" }),
    ).toBeVisible();
  });

  test("not configured on this environment: says so, no empty chart", async ({
    page,
  }) => {
    await mockApi(page, "ADMIN", async (_u, route) => {
      await ok(
        route,
        funnel({ configured: false, steps: [], daily: [], breakdowns: null }),
      );
      return true;
    });
    await page.goto("/analytics");
    await expect(
      page.getByRole("status").filter({ hasText: "pas encore reliées" }),
    ).toBeVisible();
    await expect(page.getByRole("region", { name: "Étapes" })).toHaveCount(0);
  });

  test("Google failure: a French error with a retry, no stack or detail", async ({
    page,
  }) => {
    let calls = 0;
    await mockApi(page, "ADMIN", async (_u, route) => {
      calls += 1;
      if (calls === 1) {
        await fail(
          route,
          502,
          "INCACOOK_ANALYTICS_UNAVAILABLE",
          "Les statistiques d’audience ne sont pas disponibles pour le moment",
        );
        return true;
      }
      return false;
    });
    await page.goto("/analytics");
    await expect(
      page.getByRole("alert").filter({ hasText: "ne sont pas disponibles" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Réessayer" }).click();
    await expect(page.getByRole("region", { name: "Étapes" })).toBeVisible();
  });

  test("changing the period asks for it and never shows the previous period's figures meanwhile", async ({
    page,
  }) => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const seen = await mockApi(page, "ADMIN", async (url, route) => {
      if (url.searchParams.get("days") === "7") {
        await gate;
        await ok(
          route,
          funnel({
            windowDays: 7,
            steps: funnel().steps.map((s) => ({ ...s, users: 1, events: 1 })),
          }),
        );
        return true;
      }
      return false;
    });
    await page.goto("/analytics");
    await expect(page.getByRole("region", { name: "Étapes" })).toBeVisible();
    await page.getByRole("tab", { name: "7 jours" }).click();
    await expect(page.getByRole("region", { name: "Étapes" })).toHaveCount(0); // not the 30-day numbers
    release();
    await expect(page.getByRole("region", { name: "Étapes" })).toBeVisible();
    expect(seen).toContain("7");
  });

  test("moderator: no nav entry, access-denied panel", async ({ page }) => {
    await mockApi(page, "MODERATOR");
    await page.goto("/analytics");
    await expect(
      page.getByText("Accès réservé aux administrateurs"),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Analytics" })).toHaveCount(0);
  });

  test("usable at 390 px: no page-wide horizontal scroll", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockApi(page, "ADMIN");
    await page.goto("/analytics");
    await expect(page.getByRole("region", { name: "Étapes" })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      ),
    ).toBeLessThanOrEqual(0);
  });
});

import { test, expect } from "@playwright/test";

/**
 * Backend-free smoke suite for the public legal pages (`app/(public)`). These
 * must be reachable without auth — Apple/Google reviewers and the Play Data
 * Safety form fetch them anonymously — and must not sit behind the
 * `(dashboard)` login gate. See issue #49 / #51 (store-submission-readiness
 * audit) for why these specific sections matter.
 */
test.describe("public legal pages (no backend, no auth)", () => {
  test("/privacy is reachable without auth and covers KYC + location + processors", async ({
    page,
  }) => {
    await page.goto("/privacy");
    await expect(page).toHaveURL(/\/privacy$/);
    await expect(
      page.getByRole("heading", { name: "Politique de confidentialité" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /vérification d.identité/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /localisation précise/i }),
    ).toBeVisible();
    await expect(page.getByText("Stripe")).toBeVisible();
    await expect(page.getByText("Supabase")).toBeVisible();
    // Analytics is disclosed: consent, anonymity, how to withdraw, and the processor.
    await expect(
      page.getByRole("heading", { name: /mesure d.audience/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/Rien n.est collecté avant que vous ayez accepté/),
    ).toBeVisible();
    await expect(
      page.getByText("Firebase Analytics", { exact: true }),
    ).toBeVisible(); // processor list
    // Honest about what Firebase collects: pseudonymous, with an installation identifier.
    await expect(page.getByText(/pseudonymisée, pas anonyme/)).toBeVisible();
    // ...and no other line of the page may call the measurement anonymous again (the processor list
    // once said "mesure d'audience anonyme" next to this disclosure).
    const text = (await page.locator("main").innerText()).toLowerCase();
    expect(text.match(/mesure d.audience anonyme/g)).toBeNull();
    // Nor may any line make a positive anonymity claim ("anonyme(s)" / "anonymement"); only the
    // honest negation "pas anonyme" is allowed.
    const positiveClaims = [...text.matchAll(/anonym\w*/g)].filter(
      (m) => !/pas\s+$/.test(text.slice(Math.max(0, m.index - 6), m.index)),
    );
    expect(positiveClaims.map((m) => m[0])).toEqual([]);
    expect(text).toMatch(/mesure d.audience pseudonymisée/);
    await expect(page.getByText(/identifiant technique/).first()).toBeVisible();
    // How to withdraw is a legal promise: both in-app paths stay on the page (signed in, and as a guest without an account).
    await expect(
      page.getByText(/dans Profil, rubrique « Mesure d.audience »/),
    ).toBeVisible();
    await expect(
      page.getByText(/sans compte, depuis l.onglet Profil en mode invité/),
    ).toBeVisible();
  });

  test("/data-deletion leads with the in-app path and keeps the email fallback", async ({
    page,
  }) => {
    await page.goto("/data-deletion");
    await expect(page).toHaveURL(/\/data-deletion$/);
    await expect(page.getByText(/supprimer mon compte/i)).toBeVisible();
    await expect(
      page.getByRole("link", { name: /contact@incacook\.com/i }).first(),
    ).toBeVisible();
  });

  test("/terms is anonymous, CGU/CGV only, and never shows the courier contract", async ({
    page,
  }) => {
    await page.goto("/terms");
    await expect(page).toHaveURL(/\/terms$/);
    await expect(
      page.getByRole("heading", { name: "Conditions générales", level: 1 }),
    ).toBeVisible();
    await expect(page.getByText("DRIVER_CONTRACT")).toHaveCount(0);
    await expect(page.getByText(/contrat livreur/i)).toHaveCount(0);
  });
});

import { test, expect } from "@playwright/test";

import { isLegalNoticeComplete } from "../app/(public)/_lib/legal-notice";

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

  test("/privacy explains the quiz, ad cookies and the right to refuse", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { name: /cookies et publicité/i })).toBeVisible();
    await expect(page.getByText(/jamais vos réponses au quiz/i)).toBeVisible();
    await expect(page.getByText(/refuser n.a aucune conséquence/i)).toBeVisible();
  });

  test("/mentions-legales is complete or not published at all", async ({ page }) => {
    const response = await page.goto("/mentions-legales");
    if (isLegalNoticeComplete()) {
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { name: "Mentions légales" })).toBeVisible();
      await expect(page.getByText(/directeur de la publication/i)).toBeVisible();
    } else {
      expect(response?.status()).toBe(404);
    }
  });

  test("the landing page links to both live stores and shows the real price cap", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("link", { name: "Télécharger IncaCook sur App Store" }).first(),
    ).toHaveAttribute("href", /apps\.apple\.com\/fr\/app\/incacook\/id6783878120/);
    await expect(
      page.getByRole("link", { name: "Télécharger IncaCook sur Google Play" }).first(),
    ).toHaveAttribute("href", /play\.google\.com\/store\/apps\/details\?id=com\.incacook\.app/);
    await expect(page.getByText(/bientôt/i)).toHaveCount(0);
    await expect(page.getByText(/4,50/)).toHaveCount(0);
    await expect(page.getByText(/plafond 4,90/)).toBeVisible();
  });
});

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
  });

  test("/data-deletion leads with the in-app path and keeps the email fallback", async ({
    page,
  }) => {
    await page.goto("/data-deletion");
    await expect(page).toHaveURL(/\/data-deletion$/);
    await expect(page.getByText(/supprimer mon compte/i)).toBeVisible();
    await expect(
      page.getByRole("link", { name: /tasseltess@gmail\.com/i }).first(),
    ).toBeVisible();
  });
});

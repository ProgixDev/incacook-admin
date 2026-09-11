# TASK-028 — Real assets, store links, and French copy sign-off

Status: Backlog
Priority: P0
Project: IncaCook Admin
Owner: Human + Agent

**HITL** — every item here blocks on something only the client or the store
accounts can supply. This is the ticket that turns a placeholder page into a
shippable one.

## Purpose
Replace every placeholder in TASK-027 with real material, and get the French
copy signed off.

Plan: `docs/plans/landing-page.md` §6, §7.

## Scope

### 1. Photography
Real dish photography for the hero and the mission strip. Must be licensed or
client-owned — the landing-page wiki is a public vault and the same rule applies
here: no unlicensed stock.

- Hero crop for desktop (1440) **and** a separate mobile crop (390).
  `01-Design/Responsive-Mobile`: recompose, do not only shrink.
- Optimised: correct dimensions, modern format, `next/image`, explicit
  width/height to avoid CLS.

### 2. App screenshots
The real dish-detail screen for the hero composite, captured from the Flutter
app at a current build — not a mockup, not a redraw.
`10-Industry-Patterns/Mobile-App`: one focused real screen, never a wall of tiny
mockups.

### 3. Store listings and badges
Both platforms confirmed in scope.

- **iOS:** App Store URL for `com.incacook.app`.
- **Android:** Play Store URL. **Blocked on the Play listing actually being
  live** — the PRD records "Android wiring exists but RevenueCat Android key not
  set", and `IncaCook/docs/qa/` has the Android/Play release setup (#50).
- Official badge artwork from Apple and Google, at their required sizes and
  clear-space rules.
- Swap the placeholder URLs in the TASK-027 config constant for real ones.

> **If the Play listing is not live at launch, do not render the Play badge.**
> A badge linking nowhere is worse than no badge. Replace it with a low-key
> "Bientôt sur Android" line, no link.

### 4. French copy sign-off
The PRD (Constraints → Language) flags that "the product brand strings and
onboarding value-prop copy need a client-supplied rewrite (feedback §4)". Take
the TASK-027 draft to the client and return signed-off copy.

Verify on return:
- Screened against `02-Conversion-Copy/Copy-Anti-Patterns` — no
  *révolutionner*, *seamlessly*, *nouvelle génération*, *libérez la puissance de*.
- Brand names exact: **Le Bon Fait Maison**, **L'Atelier Traiteur**, **Sauve Ton Panier**.
- The **€4,50** figure is correct and correctly formatted for French (comma, non-breaking space before €).
- Allergen wording matches the EU-14 French names used in the app.
- Every claim in section 6 is true and verifiable. No claim the product does not
  yet deliver.
- Long French strings re-checked at 390px for wrapping.

### 5. Contact and legal
- Confirm the support address. `legal-page-shell.tsx` and
  `docs/meta-facebook-launch.md` both currently use `tasseltess@gmail.com` —
  confirm whether that is the address the landing page should publish.
- Footer legal links resolve to the live `/privacy`, `/terms`, `/data-deletion`.

## Pass Criteria
- [ ] No placeholder imagery remains anywhere on `/`.
- [ ] Hero has distinct desktop and mobile crops.
- [ ] App screenshots are from a current real build.
- [ ] Every store badge links to a live listing, or is not rendered.
- [ ] Copy is client-signed-off; sign-off recorded below.
- [ ] Support email confirmed.
- [ ] `pnpm typecheck` + `pnpm lint` + `pnpm build` pass.
- [ ] No CLS regression from the real imagery (measured in TASK-029).

## Blocked by
- TASK-027 (the page the assets drop into)

## Sign-off
> _Record client copy sign-off (date + who) and the confirmed store URLs here._

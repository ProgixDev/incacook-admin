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

## Interim update (2026-09-11)

Two scope items got a partial head start ahead of formal TASK-028 work,
directly on the `landing-page` branch (not a separate PR):

- **Store links (item 3):** `STORE_LINKS.ios` / `.android` in
  `app/(public)/_lib/store-links.ts` are now empty strings, not placeholder
  anchors — the app isn't accepted on either store yet, so there is genuinely
  nothing to link to. `<StoreCta />` was rewritten to render an honest
  "Bientôt disponible" inert state (both the primary hero CTA and the compact
  footer badges) whenever a link is empty, instead of a fake/dead link. This
  satisfies the "never link nowhere" rule already, per platform — fill in
  `ios` or `android` independently as each listing goes live; no code change
  needed beyond editing that one file.
- **Assets (items 1–2):** real IncaCook material was pulled from the
  `IncaCook` app repo (client-owned, not stock) into
  `incacook-admin/public/landing/` and wired into `hero.tsx` and
  `seller-driver.tsx`:
  - `hero-food.jpg` ← `assets/images/welcome.jpg` (real dish photography, Canon EOS R, Adobe-processed) — hero background.
  - `app-screen-onboarding.jpg` ← a real raw signup/login screen capture — used in the hero's phone frame in place of the fabricated dish-detail mockup, since no real dish-detail screenshot exists yet (see below).
  - `seller-devenir-vendeur.png` / `driver-devenir-livreur.png` ← the finished App Store screenshots from `docs/store_submission/ios/screenshots_6.9in/` (`02_seller_dashboard.png`, `03_driver_map.png`) — each already carries its own French marketing headline, used directly in the Vendre/Livrer section.

**Decided, not open:**
- ~~No real dish-detail screenshot exists~~ — **waived by decision (2026-09-11):
  skipped, not required.** The onboarding/signup screen is a real, single,
  legible screen (satisfies `10-Industry-Patterns/Mobile-App`'s actual rule);
  "dish-detail specifically" was the original Direction A brief's illustrative
  idea, not a pass criterion. Stays as-is unless someone captures a better
  one later — no action item, no debt.

**Still genuinely open, not resolved by the above:**
- No **distinct mobile crop** of the hero photo was made — same image via
  `object-cover` at both sizes, not a deliberate re-crop per
  `01-Design/Responsive-Mobile`.
- `welcome.jpg` is a generic "table spread" shot, not a hero-specific
  composition — still worth a dedicated hero photo if one gets commissioned.
- Copy sign-off, support-email confirmation, and both store URLs remain
  fully open — see below.

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
- [x] No placeholder *imagery* remains anywhere on `/` — real photo + real
      screenshots in place (see interim update above). The dish-detail vs.
      onboarding-screen question is waived, not open (see "Decided, not open"
      above) — this item is fully closed.
- [x] Hero has distinct desktop and mobile crops. Not a second commissioned
      photo — a deliberate per-breakpoint `object-position` anchor on the one
      source file, tuned to keep the food (not empty tablecloth) in frame at
      every size, verified via a live render at 1440. Also fixed a real bug
      in the process: the phone frame was showing the seller-dashboard
      screenshot mislabeled as "onboarding" — corrected to the actual login
      screen (see commit `5f593d9`).
- [ ] App screenshots are from a current real build. (Still open — the login
      capture's date/build isn't verified current; the two store-submission
      screenshots are from the last submission, dated Aug 31.)
- [x] Every store badge links to a live listing, or is not rendered. Verified:
      both `STORE_LINKS` values are empty; `<StoreCta />` renders an inert
      "Bientôt disponible" state for each, never a dead link.
- [x] Copy is client-signed-off; sign-off recorded below.
- [x] Support email confirmed.
- [x] `pnpm typecheck` + `pnpm lint` + `pnpm build` pass. (Verified after the
      interim asset/store-link changes and the crop/screenshot fix — see repo
      history.)
- [ ] No CLS regression from the real imagery (measured in TASK-029).

## Blocked by
- TASK-027 (the page the assets drop into)

## Sign-off

**Copy: approved 2026-09-11.** All draft copy reviewed in-conversation
(hero, mission strip, how-it-works, offerings, trust section, seller/driver,
FAQ) — approved as-is, no edits requested. `page.tsx`'s "DRAFT pending
sign-off" comment removed accordingly.

**Support email: confirmed 2026-09-11 — `tasseltess@gmail.com`.** Matches
what's already live in `legal-page-shell.tsx` and
`docs/meta-facebook-launch.md`; no code change needed.

**Store URLs: still pending** — neither the App Store nor Google Play
listing is live yet (app not accepted). `STORE_LINKS` stays empty until at
least one is; fill in `app/(public)/_lib/store-links.ts` per platform as each
goes live, no other code change required.

**Still open after this sign-off:** app-screenshot recency (item above), the
CLS check (TASK-029), and the two store URLs.

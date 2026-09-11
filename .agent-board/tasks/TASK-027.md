# TASK-027 — Build the landing page sections

Status: Backlog
Priority: P0
Project: IncaCook Admin
Owner: Agent

## Purpose
Implement the full landing page at `/` in the direction chosen in TASK-026.
Buyer-primary, with sellers and drivers served by dedicated sections lower down.

Plan: `docs/plans/landing-page.md` §5, §7. Content source: `IncaCook/docs/prd/prd.md`.

## Decision from TASK-026 (binding for this task)

- **Hero direction: A — Product-first.** Headline + CTA left, the real app
  dish-detail screen dominant right, composited over a photo. See the
  reviewed candidates: https://claude.ai/code/artifact/3010a31f-129a-4bd3-973b-693eb5c1fefc
  — the Direction A markup/layout there (`.a-d` / `.a-m` rules) is a faithful
  reference for composition and the desktop→mobile recomposition (phone dock
  leads on mobile, copy follows below it), though it must be rebuilt as real
  Next.js/Tailwind, not copied as static CSS.
- **Display face: Fraunces**, headings only (h1/h2). Load via `next/font`
  (self-hosted, `display: swap`) — do not add a third `<link>`/`@import`
  stylesheet. Inter stays the body face, unchanged from the admin.
  - While touching font loading, also move the existing Inter import in
    `app/globals.css` (currently `@import url("https://rsms.me/inter/inter.css")`)
    to `next/font` — this removes a render-blocking request site-wide, not
    just on the landing page. Verify the admin panel still renders Inter
    correctly after the switch (`(dashboard)` pages, all use Inter too).
- **Marketing-only Tailwind additions** (TASK-026 §3, now in scope here):
  a display-font utility/class, whatever section-rhythm spacing helpers
  Direction A's hero needs. Keep these additive in `tailwind.config.ts` /
  `globals.css` — do not touch existing admin tokens.
- Known deviation carried forward without re-litigating: the reviewed
  artifact colors the trust-row bullet dots with `--primary` in addition to
  the CTA button (a decorative accent, not a second CTA). Fine to keep, or
  tighten to CTA-only — implementer's call, not a blocker either way.

## Structure

```
1  Sticky nav ......... TASK-025            [.frost]
2  Hero ............... Direction A (above) ← the bold moment
3  Anti-gaspillage .... mission/thesis strip [--primary]
4  How it works ....... 3 steps, buyer POV
5  Three offerings .... Le Bon Fait Maison / L'Atelier Traiteur / Sauve Ton Panier
6  Trust & compliance . the proof section
7  Vendre / Livrer .... seller + driver paths
8  FAQ ................ objection handling
9  Footer ............. TASK-025
```

Every section is a server component unless it genuinely needs interactivity.
The landing page must not pull `recharts`, `leaflet`, `@tanstack/react-table`,
or anything from `lib/api` / `lib/auth`.

## Section detail

### 3 — Anti-gaspillage
IncaCook's actual thesis, from the PRD: home cooks and small food businesses
waste edible surplus and have no compliant, trust-backed, geolocated channel to
sell single portions to neighbours. The one place `--primary` carries a full
surface rather than just a button.

**No impact counter.** We have no real number (see section 6 rule).

### 4 — How it works (buyer)
Three steps from the PRD user journey:
1. Parcourir les plats près de chez vous (geolocated feed)
2. Commander et payer dans l'app (Stripe)
3. Retrait ou livraison, puis notez le cuisinier

Pickup **and** delivery both exist — the PRD flags pickup-vs-delivery copy as a
known confusion point. Do not imply delivery-only.

### 5 — Three offerings
Straight from the PRD. This is content no competitor has.

| Archetype | French brand | Enum | Note |
|---|---|---|---|
| Home cook | Le Bon Fait Maison | `FAIT_MAISON` | KYC auto-approved; **€4,50 price cap**; no storefront |
| Caterer | L'Atelier Traiteur | `TRAITEUR` | Full KYC + business (SIRET, opening hours) |
| Restaurant | Sauve Ton Panier | `RESTAURANT` | Full KYC + business; surplus-basket model |

Three cards is acceptable here — they are informational, not three competing
CTAs. Avoid the repeated-rounded-feature-card look flagged in `Design-Principles`.

### 6 — Trust & compliance  ← read this before writing any proof
`02-Conversion-Copy/Social-Proof` is unambiguous: **never fabricate social
proof.** IncaCook is pre-launch. This page ships with:

- **no** download or user counts
- **no** testimonials or stock-avatar quotes
- **no** logo wall
- **no** "X repas sauvés" counter
- **no** unsourced trust badges

The substitute is mechanism-proof — real, verifiable facts about how the
platform works, each placed next to the claim it supports:

- KYC verification for traiteurs, restaurants and all drivers
- Mandatory EU-14 allergen declaration on every dish, French names
- The statutory **€4,50** fait-maison price cap, enforced as a hard block
- Stripe-secured in-app payment; QR-verified handoff
- Ratings, and a published strike/exclusion policy

Real numbers replace these only once they exist.

### 7 — Vendre / Livrer
The secondary CTAs. A genuinely distinct intent, so `CTA-Patterns` permits
them — but they must be **visually subordinate** to the hero's install CTA.
Never three visually equal choices.

### 8 — FAQ
Objections drawn from the PRD's constraints: Comment êtes-vous sûr que la
nourriture est sûre ? Qui sont les cuisiniers ? Comment suis-je remboursé ?
Livraison ou retrait ? Dans quelles villes ? Combien ça coûte au vendeur ?

## CTA policy
- **Primary:** one `<StoreCta />` component. Sniffs UA → routes to the correct
  store; desktop offers both badges.
- Store URLs in a **single config constant** so TASK-028 swaps placeholders for
  real listings without touching section code.
- **A badge must never link nowhere.** If the Play listing is not live, that
  badge is not rendered. Placeholder URLs must be obviously marked as such and
  must fail the TASK-029 checklist if still present.

## Copy
Drafted here in French, **shipped only after TASK-028 sign-off**. The PRD flags
brand strings and value-prop copy as client-pending (feedback §4).

Screen against `02-Conversion-Copy/Copy-Anti-Patterns`. Banned register:
*révolutionner*, *seamlessly*, *nouvelle génération*, *libérez la puissance de*,
*transformez votre façon de*. Apply the investor-copy test.

## Imagery
Use placeholders (clearly marked) until TASK-028 delivers real assets. Keep
imagery local under `public/` and served through `next/image` —
`next.config.mjs` has no `remotePatterns` entry for a marketing asset host, and
should not gain one.

## Pass Criteria
- [ ] `pnpm typecheck` + `pnpm lint` + `pnpm build` pass.
- [ ] All 9 sections render at 1440 and 390.
- [ ] Exactly one primary CTA above the fold.
- [ ] Zero fabricated proof — no invented counts, testimonials, logos, or badges.
- [ ] The page answers all 7 questions in `02-Conversion-Copy/Landing-Page-Conversion` (map them in the PR description).
- [ ] No `lib/api`, `lib/auth`, `recharts`, `leaflet` or `@tanstack/react-table` in the `/` bundle — verify in the build output.
- [ ] `--secondary` is not used as a CTA colour anywhere.
- [ ] `.frost` appears only on the sticky nav.
- [ ] Placeholder assets and store URLs are obviously marked as placeholders.

## Blocked by
- TASK-025 (route + shell)
- TASK-026 (art direction decision)

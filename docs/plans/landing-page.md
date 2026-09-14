# IncaCook landing page — plan

The public marketing landing page for IncaCook, built **inside this repo** and
served from `/` on the same Vercel project as the admin panel.

- **Branch:** `landing-page` (off `dev`)
- **Tickets:** TASK-025 → TASK-029 in `.agent-board/`
- **Knowledge base:** `landing-page-wiki` (Obsidian vault, queried 2026-09-11)
- **Product source of intent:** `IncaCook/docs/prd/prd.md`

---

## 1. Why this repo and not a new one

`app/(public)/` already exists in this repo and already serves unauthenticated,
SEO-visible, French-language pages — `/privacy`, `/terms`, `/data-deletion`,
sharing `_components/legal-page-shell.tsx`. A landing page is the **second
adapter at a seam that already has one**, which is when a seam is real rather
than hypothetical.

The decisive constraint is that those legal URLs are **already published and
registered with Meta** (see `docs/meta-facebook-launch.md`):

- `https://incacook-admin.vercel.app/privacy`
- `https://incacook-admin.vercel.app/terms`
- `https://incacook-admin.vercel.app/data-deletion`

A landing page in a separate repo either sits on a different origin from the
legal pages it must link to, or forces a migration of those pages and a re-file
with Meta and the app stores. Same-origin is free.

### Domain cutover to `www.incacook.com` — open, do not rewrite piecemeal

**The DNS migration is in progress, not finished.** Until it completes,
`incacook-admin.vercel.app` is still the live origin and every reference below
is still correct. They are listed here so the cutover is one deliberate sweep
rather than a discovery exercise, and so nobody "helpfully" rewrites them early
and points production at a domain that does not resolve yet.

Highest risk first — the one that is live code rather than documentation:

| Where | What |
|---|---|
| `IncaCook/lib/core/constants/text_strings.dart:221` | `privacyPolicyUrl` — **shipped in the app binary**, and the same URL is filed as the store Privacy Policy URL. Changing it needs an app release, so it cannot follow the DNS flip instantly. Keep the old host resolving (redirect, don't retire) until the release that changes this has rolled out. |
| `incacook-admin/docs/meta-facebook-launch.md` | privacy / terms / data-deletion URLs **registered with Meta** — a change here means re-filing with Meta. |
| `IncaCook/docs/store_submission/metadata/{app_store,play_store}_metadata_{en,fr}.md` | Privacy Policy and Delete Account URLs in all four store-metadata files. |
| `IncaCook/docs/qa/revenuecat-android-and-play-release-setup.md` | privacy URL in the Play release walkthrough. |
| this file, above | the three legal URLs quoted in the constraint. |

Order that actually works: stand up `www.incacook.com` → keep
`incacook-admin.vercel.app` redirecting permanently → ship the app release that
changes `privacyPolicyUrl` → re-file store metadata and Meta → only then update
the docs. Retiring the old host before the app release breaks the privacy link
for every installed build, which is a store-compliance problem, not a cosmetic
one.

Next's per-route code splitting means the landing page will not ship the
`recharts` / `leaflet` / `@tanstack/react-table` weight — those are imported
only inside `(dashboard)` client components. The root layout is just
`ThemeProvider` + `AuthProvider`.

### When to revisit

Split the landing page into its own repo when **any** of these becomes true:

1. A non-developer needs to edit copy (→ a CMS).
2. Marketing deploy cadence can no longer be coupled to admin releases.
3. It grows into a multi-page site (blog, pricing, careers) with an image pipeline.
4. Public-surface analytics/consent tooling is needed that must not load in the
   admin bundle.

None is true today.

### Known operational risk

`docs/deployment.md` records that deploys are manual `vercel --prod` from a
local folder, because the deployer does not own `Feint517/incacook-admin` and
Vercel git integration is therefore off. Coupled in one project, **every
landing-page copy tweak requires someone with Vercel CLI access to rebuild and
redeploy the whole admin panel.** This is a process problem, not an
architectural one, and `docs/deployment.md` already names the fix (collaborator
invite → connect Git → auto-deploy `main`). Sort it before launch.

---

## 2. Routing

`/` is currently `app/(dashboard)/page.tsx` (the overview). The landing page
needs `/`. The dashboard moves to `/dashboard`.

This also fixes a live bug: `app/(public)/_components/legal-page-shell.tsx:20`
links the logo to `/`, which today drops a public visitor into the auth gate and
bounces them to `/login`.

```
app/
  (public)/
    page.tsx              ← the landing page             /
    privacy/              ← unchanged                    /privacy
    terms/                ← unchanged                    /terms
    data-deletion/        ← unchanged                    /data-deletion
    _components/
  (dashboard)/
    dashboard/page.tsx    ← was (dashboard)/page.tsx     /dashboard
    users/  orders/  …    ← unchanged
  login/
```

### Domain strategy

When a real domain is acquired, attach both hostnames to the **same** Vercel
project: apex + `www` → landing, `admin.incacook.com` → panel. Both hosts serve
the same app, so `admin.incacook.com/` will also render the landing page.

- **Now:** accept it; admins bookmark `/dashboard`. Zero code.
- **Later:** a `middleware.ts` host-rewrite (admin host → `/dashboard`). ~15
  lines, but it would be the first middleware in this repo.

---

## 3. Design identity

Inherited **verbatim** from the admin panel. No token is changed or added to
`:root` / `.dark` beyond the marketing-only additions named in TASK-026.

| Token | Value | Landing role |
|---|---|---|
| `--background` / `--surface` | `#FFF8F4` warm cream | page ground |
| `--primary` | `#00C263` green | the single primary CTA + the mission moment **only** |
| `--secondary` | `#C8553D` terracotta | section eyebrows, "fait maison" warmth — **never a second CTA colour** |
| `--on-surface` | `#2B1713` | body text |
| `--on-surface-variant` | `#6B554B` | secondary text |
| `--outline-variant` | `#E5D6CB` | hairlines |
| radii | `10 / 14 / 16 / 20 / 24 / 28px` | as configured in `tailwind.config.ts` |
| `.frost` | `blur(20px) saturate(160%)` | sticky nav **only** |

Dark mode comes free through the existing `.dark` class and `next-themes`.

**Typography:** Inter stays as the body face (admin parity). Headings get one
display family, chosen in TASK-026. The wiki's `01-Design/Typography` is
explicit that "typography carries identity" and warns against defaulting to the
same SaaS type stack by habit; Inter-only would land in its
generic-AI-aesthetic failure mode. Colours, radii and spacing stay identical, so
brand identity holds.

### Spacing

Use the wiki's restrained scale — `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96` —
rather than arbitrary values.

---

## 4. Art direction

### Reading the references

| Reference | Take | Leave |
|---|---|---|
| [toogoodtogo.com/fr](https://www.toogoodtogo.com/fr) | The category twin — anti-gaspillage mission framing, warm real-food photography, a 3-step mechanic, French-market tone | Their impact counter (we have no real number) |
| [deliveryhero.com](https://www.deliveryhero.com/) | The restraint — generous whitespace, one idea per section, near-zero decoration | Corporate/investor register; we are consumer |
| [wolt.com](https://wolt.com/) | App-first clarity — one dominant CTA, real app UI in a device, geo framing, clean sticky nav | Their dense city-grid section |

### The one bold move

Per `01-Design/Design-Principles` ("spend boldness once"), the hero carries a
real dish photograph with the **real app dish-detail card** composited over it.
Product-first per `01-Design/Hero-Design`; real product material per
`Design-Principles`; a single real phone screen per `10-Industry-Patterns/Mobile-App`
("avoid a wall of tiny mockups").

Everything below the fold stays Delivery Hero–restrained.

### Anti-patterns to stay out of

From `01-Design/Design-Principles`, treated as review criteria:

- default purple/blue gradients
- glow around every CTA
- excessive glassmorphism (`.frost` is used **once**, on the nav)
- repeated rounded feature cards
- arbitrary bento grids
- floating decorative shapes

### Motion

`01-Design/Motion-and-Interaction`: **one orchestrated high-impact motion idea
beats dozens of unrelated micro-animations.** No scroll-jacking, no
every-section fade-in. Respect `prefers-reduced-motion`. Prefer CSS/SVG; do not
add an animation library for trivial effects.

---

## 5. Page structure

Buyer-primary. Sellers and drivers get dedicated sections lower down with their
own secondary CTAs — the Too Good To Go structure.

```
1  Sticky nav ......... logo · anchors · ONE primary CTA          [.frost]
2  Hero ............... outcome headline + real app screen + CTA  ← the bold moment
3  Anti-gaspillage .... the mission/thesis strip                  [--primary]
4  How it works ....... 3 steps, buyer POV
5  Three offerings .... Le Bon Fait Maison / L'Atelier Traiteur / Sauve Ton Panier
6  Trust & compliance . KYC · allergènes EU-14 · plafond €4,50 · paiement sécurisé
7  Vendre / Livrer .... seller + driver paths (secondary intent)
8  FAQ ................ objection handling
9  Footer ............. → /privacy /terms /data-deletion · contact · store badges
```

`02-Conversion-Copy/Landing-Page-Conversion` requires the page to answer seven
questions. Mapping:

| Question | Section |
|---|---|
| What is this? | 2 Hero |
| What outcome do I get? | 2 Hero |
| Is it for me? | 3 Mission, 5 Offerings |
| Why should I believe you? | 6 Trust & compliance |
| How does it work? | 4 How it works |
| What objections remain? | 8 FAQ |
| What should I do next? | 2 Hero CTA, 7 Seller/driver paths |

### Section 5 is the differentiator

The three seller archetypes come straight from the PRD and are content no
competitor has:

| Archetype | French brand | Enum | Note |
|---|---|---|---|
| Home cook | Le Bon Fait Maison | `FAIT_MAISON` | KYC auto-approved; **€4,50 price cap**; no storefront |
| Caterer | L'Atelier Traiteur | `TRAITEUR` | Full KYC + business (SIRET, opening hours) |
| Restaurant | Sauve Ton Panier | `RESTAURANT` | Full KYC + business; surplus-basket model |

### Section 6 is the honest substitute for social proof

`02-Conversion-Copy/Social-Proof` is unambiguous: **never fabricate social
proof.** IncaCook is pre-launch, so the page carries **no** download counts, no
testimonials, no logo wall, and no "X repas sauvés" counter.

The replacement is mechanism-proof — real, verifiable facts about how the
platform works, drawn from the PRD's compliance constraints:

- KYC verification for traiteurs, restaurants and all drivers
- Mandatory EU-14 allergen declaration on every dish (French names)
- The statutory **€4,50** fait-maison price cap, enforced as a hard block
- Stripe-secured in-app payment; QR-verified handoff
- Ratings and a published strike/exclusion policy

This is proof placed next to the claim, which is what `Social-Proof` asks for.
Real numbers replace these only once they exist.

---

## 6. Copy

**French primary.** The PRD (`docs/prd/prd.md`, Constraints → Language) flags
that "the product brand strings and onboarding value-prop copy need a
client-supplied rewrite (feedback §4)". Landing copy is therefore drafted by us
but **shipped only after client sign-off** — that is TASK-028.

Screened against `02-Conversion-Copy/Copy-Anti-Patterns`. Banned register:
*révolutionner*, *seamlessly*, *nouvelle génération*, *libérez la puissance de*,
*transformez votre façon de*. The investor-copy test applies — if it reads
better in a pitch deck than on a product page, rewrite it.

Every claim must survive: *what does the user get? what disappears? what becomes
faster or easier?*

---

## 7. CTA policy

`02-Conversion-Copy/CTA-Patterns`: one primary CTA; a secondary CTA only for a
genuinely distinct intent; never three visually equal choices.

- **Primary:** install the app (iOS + Android). Rendered by a single
  `<StoreCta />` that sniffs the UA and routes to the right store, offering both
  badges on desktop.
- **Secondary (distinct intent):** "Devenir vendeur" and "Devenir livreur" in
  section 7 — visually subordinate to the primary.

Store URLs live in one config constant so TASK-028 can swap placeholders for
real listings without touching section code. **A badge must never link
nowhere** — if the Play listing is not live at launch, that badge is not
rendered.

---

## 8. SEO and performance

From `03-SEO-Performance/SEO-for-Landing-Pages` and the Launch Checklist:
unique title, useful description, clear H1, logical heading order, descriptive
URLs, meaningful alt text, canonical handling, indexability, OG tags,
`sitemap.xml`, `robots.txt`.

Targets: LCP, CLS, INP measured on the **production build**, not dev. Hero
media optimised, below-fold content lazy-loaded, font cost minimised, no heavy
animation library for trivial effects.

Note `next.config.mjs` has no `images.remotePatterns` entry for a marketing
asset host — landing imagery should be local under `public/` and served through
`next/image`.

---

## 9. Responsive

`01-Design/Responsive-Mobile`: **recompose, do not only shrink.** Do not depend
on hover. Re-crop hero visuals for mobile rather than scaling the desktop crop.
Test localized long French strings — they run materially longer than English.

Review viewports: **1440 / 1280 / 1024 / 768 / 430 / 390 / 360**.

The page must be excellent on mobile in its own right; a QR code is never the
only mobile CTA.

---

## 10. Definition of done

`08-QA-Accessibility/Launch-Checklist`, run in full at TASK-029:

- **Visual** — desktop + mobile reviewed, real content, no AI-template patterns, product imagery legible
- **Conversion** — hero understandable, one primary CTA, CTA destinations correct, real proof only
- **Accessibility** — keyboard, focus, contrast, labels, alt text, reduced motion, headings
- **Performance** — production Lighthouse, hero media optimised, no major CLS, third-party scripts reviewed, fonts optimised
- **SEO** — title, description, canonical, OG, H1/headings, indexability
- **Functional** — links, mobile navigation, analytics, success/error states

Plus this repo's own gates from `.agent-board/README.md`: `pnpm typecheck` +
`pnpm lint` + `pnpm build`, re-run on the PR by
`.github/workflows/quality-gates.yml`.

---

## 11. Wiki gaps found

The vault has no page on **multi-sided marketplace** landing pages (its
`10-Industry-Patterns/` covers SaaS, devtools, fintech and mobile-app only), and
nothing on **French/localized** landing pages. Both are worth capturing with
`wiki-capture` after this build ships, along with a teardown of
toogoodtogo.com/fr using `Templates/Landing-Page-Teardown`.

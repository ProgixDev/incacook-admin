# TASK-029 — Launch pass: SEO, responsive, a11y, performance

Status: Backlog
Priority: P0
Project: IncaCook Admin
Owner: Agent

## Purpose
Run the landing-page wiki's `08-QA-Accessibility/Launch-Checklist` in full
against the real, asset-complete page, and fix what it surfaces. Nothing ships
before this is green.

Plan: `docs/plans/landing-page.md` §8, §9, §10.

## Scope

### SEO
Per `03-SEO-Performance/SEO-for-Landing-Pages` and `Technical-SEO-Checklist`:
- Unique `title` + useful `description` in `app/(public)/page.tsx` metadata.
  The root `app/layout.tsx` currently sets `"IncaCook · Admin"` — the landing
  page must override it, and the admin title must not leak onto `/`.
- One clear H1; logical heading order with no skipped levels.
- Canonical URL. OG + Twitter card with a real OG image.
- `sitemap.ts` and `robots.ts` covering the public routes only — `(dashboard)`
  and `/login` must be excluded from indexing.
- Meaningful alt text on every image.
- `lang="fr"` already set on `<html>` in the root layout — verify it survives.

### Performance
Measured on the **production build**, not dev:
- LCP, CLS, INP.
- Hero media optimised; below-fold lazy-loaded.
- Font cost minimised — check whether the `https://rsms.me/inter/inter.css`
  import in `globals.css` is still render-blocking after TASK-026's `next/font`
  work.
- No animation library shipped for trivial effects.
- Confirm the `/` bundle excludes `lib/api`, `lib/auth`, `recharts`, `leaflet`,
  `@tanstack/react-table`.

### Responsive
`01-Design/Responsive-Mobile` viewports: **1440 / 1280 / 1024 / 768 / 430 / 390 / 360**.
- Recomposed, not merely shrunk.
- CTA still obvious on mobile; product visual still legible.
- Touch targets comfortable; no hover dependency.
- Long French strings tested for wrapping.
- A QR code is never the only mobile CTA.

### Accessibility
- Keyboard navigation through nav, all CTAs, and the FAQ.
- Visible focus — the repo's global `*:focus-visible` ring uses `--primary`;
  verify contrast against the cream ground.
- Contrast: check `--on-surface-variant` `#6B554B` on `--background` `#FFF8F4`,
  and `--primary-foreground` white on `--primary` `#00C263` (this one is tight —
  measure it, do not assume).
- Labels, alt text, heading structure.
- `prefers-reduced-motion` honoured by the TASK-026 hero motion.
- Dark mode: the page inherits `.dark`; verify every section reads correctly in
  both modes.

### Functional
- Every link resolves, including the three footer legal routes.
- Store CTAs open the right store per platform; no placeholder URL survives.
- Mobile navigation works.
- Analytics decision recorded — if any third-party script is added, note its
  cost and its GDPR/consent implications. The PRD's compliance constraints
  (GDPR/RGPD) apply to the public surface too.

### Regression
- The admin panel still works end to end after the TASK-025 route move.
- `pnpm e2e` green.

## Pass Criteria
- [ ] Every box in `08-QA-Accessibility/Launch-Checklist` ticked or explicitly waived with a reason.
- [ ] Production Lighthouse run attached to the PR (all four categories).
- [ ] Screenshots at all 7 viewports, light **and** dark.
- [ ] Zero placeholder assets or URLs remain.
- [ ] `sitemap.xml` and `robots.txt` correct; admin routes not indexable.
- [ ] `/` metadata does not inherit the admin title.
- [ ] Contrast measured, not assumed — figures in the PR description.
- [ ] `pnpm typecheck` + `pnpm lint` + `pnpm build` + `pnpm e2e` pass.

## Blocked by
- TASK-027 (page)
- TASK-028 (real assets + copy)

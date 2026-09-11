# TASK-026 — Art direction: three hero directions + display face

Status: Ready
Priority: P0
Project: IncaCook Admin
Owner: Human + Agent

**HITL** — ends in a human picking a direction. Do not proceed to TASK-027
without that decision recorded in this file.

## Purpose
Decide the landing page's visual character before any section is built, so
TASK-027 implements one agreed direction instead of drifting. Follows the
wiki's `04-Agent-Workflows/Three-Direction-Method`.

Plan: `docs/plans/landing-page.md` §3, §4.

## Fixed constraints (not up for redesign)
Inherited verbatim from the admin panel — **do not add or change any token in
`:root` / `.dark`** beyond the marketing additions named below:

| Token | Value | Landing role |
|---|---|---|
| `--background` / `--surface` | `#FFF8F4` | page ground |
| `--primary` | `#00C263` | the single primary CTA + the mission moment **only** |
| `--secondary` | `#C8553D` | section eyebrows, "fait maison" warmth — **never a second CTA colour** |
| `--on-surface` / `--on-surface-variant` | `#2B1713` / `#6B554B` | text |
| `--outline-variant` | `#E5D6CB` | hairlines |
| radii | `10 / 14 / 16 / 20 / 24 / 28px` | per `tailwind.config.ts` |

Spacing uses the wiki's restrained scale: `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96`.

## Scope

### 1. Display typeface
Inter stays as the body face (admin parity). Headings get **one** display
family, used for h1/h2 only.

- Propose 3 candidates with rationale tied to brand/audience, not defaults.
  `01-Design/Typography` warns explicitly against reaching for the same SaaS
  type stack by habit — Inter-only would land in that failure mode.
- Serve it via `next/font` (self-hosted, `display: swap`), not a third
  stylesheet import. Note that `globals.css` currently pulls Inter from
  `https://rsms.me/inter/inter.css`; evaluate moving both to `next/font` to cut
  a render-blocking request.
- Define: weights, type scale, line-height, measure, tracking, mobile reductions.
- Test with **real French copy** — French strings run materially longer than
  English. Inspect line breaks at 1440 and 390.

### 2. Three hero directions
Build three static hero renders at desktop + mobile. All three must satisfy
`01-Design/Hero-Design` "must establish": audience relevance, outcome, primary
action, visual subject, enough proof to reduce doubt.

Suggested spread (adjust if a better idea appears):
- **A — Product-first:** headline + CTA + the real app dish-detail screen dominant. Closest to wolt.com.
- **B — Outcome-first:** anti-gaspillage pain/outcome lead, app screen supporting. Closest to toogoodtogo.com/fr.
- **C — Editorial:** expressive display type, fewer elements, strong brand character. Closest to deliveryhero.com's restraint.

### 3. Marketing-only additions
Whatever the chosen direction needs — section rhythm utilities, a display type
scale, an eyebrow style. Scoped so nothing leaks into admin surfaces.

## Anti-patterns — review criteria, not suggestions
From `01-Design/Design-Principles`, reject a direction that shows:
- default purple/blue gradients
- glow around every CTA
- excessive glassmorphism (`.frost` appears **once**, on the nav)
- repeated rounded feature cards
- arbitrary bento grids
- floating decorative shapes

**Spend boldness once.** One signature visual idea beats making every section
loud. The plan's default is a real dish photograph with the real app card
composited over it.

## Motion
`01-Design/Motion-and-Interaction`: pick **one** orchestrated high-impact motion
idea for the hero. No scroll-jacking, no every-section fade. Respect
`prefers-reduced-motion`. CSS/SVG preferred; no animation library for trivial
effects.

## Deliverable
Screenshots of all three directions at 1440 and 390, plus a short rationale.
Record the chosen direction and the display face **in this file** before closing.

## Pass Criteria
- [ ] 3 hero directions rendered at 1440 + 390, screenshots attached to the PR.
- [ ] 3 display-face candidates shown with real French copy.
- [ ] None of the six listed anti-patterns present in any direction.
- [ ] `--primary` used for the primary CTA only; `--secondary` never used as a CTA colour.
- [ ] Human has chosen a direction + display face, recorded below.
- [ ] `pnpm typecheck` + `pnpm build` pass.

## Decision
> _Record the chosen direction, display face, and rationale here before moving to TASK-027._

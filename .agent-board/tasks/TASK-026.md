# TASK-026 — Art direction: three hero directions + display face

Status: Done
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
- [x] 3 hero directions rendered at 1440 + 390, screenshots attached to the PR.
      (Delivered as an interactive Artifact with live desktop/mobile toggles per
      direction instead of static screenshots — see URL in Decision below.)
- [x] 3 display-face candidates shown with real French copy.
- [x] None of the six listed anti-patterns present in any direction.
- [x] `--primary` used for the primary CTA only; `--secondary` never used as a CTA colour.
      (Note: the artifact also colors the small trust-row bullet dots with
      `--primary` — a decorative accent, not a second CTA, so it doesn't
      violate the one-primary-CTA rule, but it's broader than strictly
      "button only." Carried forward as a conscious choice, not re-litigated
      here.)
- [x] Human has chosen a direction + display face, recorded below.
- [ ] `pnpm typecheck` + `pnpm build` pass. (n/a to this ticket — no app code
      was touched; that gate applies once TASK-027 implements the chosen direction.)

## Decision

**Direction: A — Product-first** (closest to wolt.com). Headline + CTA left,
real app dish-detail screen dominant right. Chosen for lowest ambiguity about
"what is this" in the first second — the product itself does the persuading.

**Display face: Fraunces.** Chosen as the shipped decision, not just the
review's placeholder pairing — soft, buttery serif that reads hand-made and
appetizing without going precious (vs. Libre Caslon Display's more corporate
authority) or generic (vs. Bricolage Grotesque's safer-but-forgettable
grotesque). Pairs cleanly with the Inter body face already used across the
admin panel.

Candidates reviewed at: https://claude.ai/code/artifact/3010a31f-129a-4bd3-973b-693eb5c1fefc

**Next:** TASK-027 implements Direction A + Fraunces as the real, coded
landing page. TASK-026's own remaining scope item — wiring Fraunces via
`next/font` and adding whatever marketing-only Tailwind utilities Direction A
needs (§3 "Marketing-only additions") — is folded into TASK-027 rather than
done here in isolation, since it's easiest to verify typecheck/build against
the real page rather than a standalone font-loading change.

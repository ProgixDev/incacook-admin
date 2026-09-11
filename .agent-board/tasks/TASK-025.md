# TASK-025 — Free `/` for the public surface + landing shell

Status: Review
Priority: P0
Project: IncaCook Admin
Owner: Agent

## Purpose
The landing page needs `/`, which today serves the auth-gated dashboard
overview. Move the dashboard to `/dashboard` and stand up the public shell
(nav + footer) so a real page can render at `/`.

This is the tracer bullet: it cuts through routing, auth redirect, navigation
and E2E in one thin slice, and it is independently verifiable before any
marketing content exists.

Plan: `docs/plans/landing-page.md` §2.

## Scope

### Route move
- `app/(dashboard)/page.tsx` → `app/(dashboard)/dashboard/page.tsx` (serves `/dashboard`).
- `components/dashboard/sidebar.tsx`
  - `:35` nav entry `{ href: "/", label: "Vue d'ensemble" }` → `/dashboard`
  - `:79` logo link `href="/"` → `/dashboard`
  - `:98-100` the `item.href === "/"` exact-match special case — delete it; with
    no dashboard route at `/`, the generic
    `pathname === item.href || pathname.startsWith(item.href + "/")` covers it.
- `app/login/page.tsx:36` and `:54` — `router.replace("/")` → `router.replace("/dashboard")`.
- `e2e/auth.setup.ts` and `e2e/authed.spec.ts` — update root `goto()`s.

### Public shell
- `app/(public)/layout.tsx` — public chrome, no `AuthGuard`.
- `app/(public)/_components/site-header.tsx` — sticky nav: logo, section anchors,
  one primary CTA slot. Uses the existing `.frost` utility (this is the **only**
  place `.frost` appears on the landing page).
- `app/(public)/_components/site-footer.tsx` — links to the existing
  `/privacy`, `/terms`, `/data-deletion`, contact email, store-badge slot.
- `app/(public)/page.tsx` — placeholder `/` that renders header + footer and a
  single H1. Real content lands in TASK-027.

### Bug fixed in passing
`app/(public)/_components/legal-page-shell.tsx:20` links the logo to `/`, which
today bounces a public visitor into `/login`. After this task `/` is public and
the link resolves correctly. Consider reusing `site-header` there instead of the
legal shell's own header.

### Also
- Move `AuthProvider` out of the root `app/layout.tsx` into
  `app/(dashboard)/layout.tsx`. It currently mounts on public pages and attempts
  a token refresh for anonymous visitors. Harmless but pointless, and it keeps
  auth code out of the public bundle.

## Out of scope
- Any marketing content, copy, or imagery (TASK-027).
- `middleware.ts` host-based routing — deferred until a real domain exists
  (`docs/plans/landing-page.md` §2).

## Pass Criteria
- [x] `pnpm typecheck` + `pnpm lint` + `pnpm build` pass.
- [x] `/` renders the public shell with no auth redirect, logged out. Verified:
      `curl /` returns 200 with the `SiteHeader`/placeholder H1/`SiteFooter`
      markup and no loading/redirect gate; `app/(public)/layout.tsx` wraps no
      `AuthGuard`.
- [ ] `/dashboard` renders the overview behind `AuthGuard` (manual — needs
      local IncaCook-Server running + a logged-in session; source-verified
      that `(dashboard)/layout.tsx` wraps children in `AuthProvider` +
      `AuthGuard`, and `curl /dashboard` shows the guard's loading state, but
      a full authenticated render needs a live login).
- [ ] Logging in lands on `/dashboard` (manual — needs local IncaCook-Server
      running; `app/login/page.tsx` now calls `router.replace("/dashboard")`
      in both places, unverified against a real login).
- [ ] Sidebar "Vue d'ensemble" is active on `/dashboard` and not on other
      routes (manual — needs a logged-in session to click through; the
      `item.href === "/"` special case was removed and the generic
      `pathname === item.href || pathname.startsWith(item.href + "/")` check
      now covers `/dashboard`, reviewed but not click-tested live).
- [x] `/privacy`, `/terms`, `/data-deletion` still render; their logo link
      lands on `/`. Verified: all three return 200, `/privacy` still renders
      its heading; `legal-page-shell.tsx`'s logo `href="/"` is unchanged and
      now resolves publicly instead of bouncing to `/login`.
- [ ] `pnpm e2e` green against a local backend (manual — needs local
      IncaCook-Server running. The backend-free `auth-gate.spec.ts` and
      `public-legal.spec.ts` suites were run locally against `next dev`, but
      this sandbox's headless Chromium hangs mid-hydration on this Next 16 +
      Turbopack dev server — reproduced identically on unmodified `dev`-branch
      code before this change, so it is a pre-existing environment quirk, not
      a regression from this diff. `authed.spec.ts` needs
      `E2E_API_BASE_URL`/admin creds against a real backend and was not run.).
- [x] No `AuthProvider` network call fires on a logged-out `/`. Verified by
      construction: `AuthProvider` now only wraps `(dashboard)/layout.tsx`
      and the new `app/login/layout.tsx`; `app/(public)/layout.tsx` never
      mounts it, so no session bootstrap can run on `/`.

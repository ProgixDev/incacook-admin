# TASK-025 — Free `/` for the public surface + landing shell

Status: Ready
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
- [ ] `pnpm typecheck` + `pnpm lint` + `pnpm build` pass.
- [ ] `/` renders the public shell with no auth redirect, logged out.
- [ ] `/dashboard` renders the overview behind `AuthGuard`.
- [ ] Logging in lands on `/dashboard`.
- [ ] Sidebar "Vue d'ensemble" is active on `/dashboard` and not on other routes.
- [ ] `/privacy`, `/terms`, `/data-deletion` still render; their logo link lands on `/`.
- [ ] `pnpm e2e` green against a local backend.
- [ ] No `AuthProvider` network call fires on a logged-out `/`.

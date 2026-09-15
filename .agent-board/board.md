# IncaCook Admin Agent Board

Project: IncaCook Admin
Current focus: Landing page shipped (#8); boosts oversight shipped (#10)
Current milestone: Phase 2 — IncaCook landing page
Updated: 2026-09-14

## Columns

- Backlog
- Ready
- In Progress
- Review
- Blocked
- Done

## Current Tasks

| Task | Title | Status | Owner | Priority |
| --- | --- | --- | --- | --- |
| TASK-001 | API client, response envelope, and error codes | Done | Agent | P0 |
| TASK-002 | Admin authentication, session, and route guard | Done | Agent | P0 |
| TASK-003 | Shared data-table query infra (pagination, filters, states) | Done | Agent | P1 |
| TASK-004 | Dashboard overview → /v1/admin/dashboard/* | Done | Agent | P0 |
| TASK-005 | Users list + detail → /v1/admin/users | Done | Agent | P0 |
| TASK-006 | User moderation — strikes + suspend/unsuspend | Done | Agent | P1 |
| TASK-007 | Reports moderation → /v1/admin/reports | Done | Agent | P1 |
| TASK-008 | Geography map → /v1/admin/dashboard/cities | Done | Agent | P2 |
| TASK-009 | KYC review queue → /v1/admin/kyc/documents (NEW page) | Done | Agent | P0 |
| TASK-010 | Disputes management → /v1/admin/disputes (NEW page) | Done | Agent | P0 |
| TASK-011 | Catalog claims → /v1/admin/catalog-claims (NEW page) | Done | Agent | P1 |
| TASK-012 | Supply catalog products CRUD + orders → /v1/admin/catalog/* | Done | Agent | P2 |
| TASK-013 | Broadcast notifications → /v1/admin/notifications/send | Done | Agent | P2 |
| TASK-014 | Legal documents management → /v1/admin/legal-documents | Done | Agent | P2 |
| TASK-015 | Orders page — needs an admin orders endpoint (backend dependency) | Done | Agent | P2 |
| TASK-016 | Sellers page — needs an admin sellers endpoint (backend dependency) | Done | Agent | P2 |
| TASK-017 | Listings page — needs an admin listings endpoint (backend dependency) | Done | Agent | P2 |
| TASK-018 | Env config, API base URL, and README | Done | Agent | P1 |
| TASK-019 | Remove mock-data generator and delete dead mock leaks | Done | Agent | P2 |
| TASK-020 | CI quality gates (typecheck + lint + build) | Done | Agent | P2 |
| TASK-021 | Driver/delivery zones management → /v1/zones | Done | Agent | P2 |
| TASK-022 | Drivers oversight → /v1/admin/drivers | Done | Agent | P2 |
| TASK-023 | Seller subscriptions oversight → /v1/admin/subscriptions | Done | Agent | P2 |
| TASK-024 | Wallet/payout oversight → /v1/admin/wallets + /withdrawals | Done | Agent | P2 |
| TASK-025 | Free / for the public surface + landing shell | Done | Agent | P0 |
| TASK-026 | Art direction: three hero directions + display face | Done | Human + Agent | P0 |
| TASK-027 | Build the landing page sections | Done | Agent | P0 |
| TASK-028 | Real assets, store links, and French copy sign-off | Backlog | Human + Agent | P0 |
| TASK-029 | Launch pass: SEO, responsive, a11y, performance | Backlog | Agent | P0 |

## Recommended Start

**TASK-028**, then **TASK-029**. TASK-001…027 are Done — the admin panel and
the public landing page (#8) both shipped, as did the boosts oversight list
(#10, no task on this board).

Two caveats on what "remaining" means here, because the board's status column
alone reads more optimistic than the code:

- **TASK-028 is blocked, not merely queued.** `STORE_LINKS.ios` / `.android` in
  `app/(public)/_lib/store-links.ts` are deliberately empty strings and
  `<StoreCta />` renders an honest "Bientôt disponible" instead of a dead link.
  Nothing more can be done there until the app is accepted on each store; the
  fix is then a one-line edit per platform. Assets and imagery are already real.
- **TASK-029 has not started.** There is no `sitemap.ts` and no `robots.ts` in
  the repo, which is the cheapest way to confirm it. Its own rule stands:
  nothing ships before it is green.

Unresolved contradiction worth a human's eye: `app/(public)/page.tsx` records
"Copy signed off 2026-09-11 (TASK-028)", while TASK-028's own body still lists
copy sign-off as "fully open". One of the two is stale.

## Backend admin surface (source of truth)

Derived from a live read of `IncaCook-Server/src/modules/admin/*` and the
admin controllers in `catalog`, `moderation`, and `compliance`. All admin
endpoints are guarded by `RolesGuard` + `@Roles(Admin, Moderator)`.

- Dashboard: `GET /v1/admin/dashboard/{overview,users,revenue,categories,cities,recurring-users,mono-users}`
- Users: `GET /v1/admin/users`, `GET /v1/admin/users/:id`
- Sanctions: `GET /v1/admin/strikes`, `POST /v1/admin/users/:id/{strikes,suspend,unsuspend}`
- KYC: `GET /v1/admin/kyc/documents`, `:id`, `:id/{approve,reject}`
- Disputes: `GET /v1/admin/disputes`, `:id`, `:id/{approve-refund,reject,resolve,confirm-allergen,confirm-chargeback-fraud}`
- Reports: `GET /v1/admin/reports`, `PATCH :id/status`
- Catalog claims: `GET /v1/admin/catalog-claims`, `:id`, `:id/{refund,request-replacement,reject,resolve}`
- Catalog: `GET/POST /v1/admin/catalog/products`, `GET/PATCH/DELETE :id`, `GET /v1/admin/catalog/orders`
- Notifications: `POST /v1/admin/notifications/send`
- Legal documents: `GET /v1/admin/legal-documents`, `active`, `POST`, `PATCH :id`, `POST :id/publish`
- Boosts: `GET /v1/admin/boosts` — read-only oversight. `@Get` only, by
  contract; admin observes boosts, it never grants, extends or cancels one.
- Orders / Sellers / Listings: `GET /v1/admin/{orders,sellers,listings}`.

The former "not yet available, blocks TASK-015/016/017" note here is gone
because it is no longer true — all three list endpoints now exist
(`src/modules/admin/{orders,sellers,listings}/*.controller.ts`) and those
tasks are Done.

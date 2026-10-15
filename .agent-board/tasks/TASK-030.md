## TASK-030 — Build admin for staging and api.incacook.com
- status: planned
- depends:
Status: In Progress
Priority: P0
Project: IncaCook Admin
Owner: Agent

### Scope
Replace the hardcoded Railway fallback in `lib/api/client.ts` with a required explicit `NEXT_PUBLIC_API_BASE_URL` for staging and production builds. Keep its single typed HTTP client and `/v1` response envelope. Update `.env.example`, build/deployment docs, and Playwright configuration so staging builds target the separate staging Cloud Run API and staging test users; production builds target `https://api.incacook.com`. Do not commit `.env.local` or credentials. Verify login, dashboard, orders, users, and payment oversight against staging after backend server TASK-010 is deployed. This task must be complete before server TASK-012 staging rehearsal.

### Interface
```ts
/** Base URL of the API origin, without `/v1`; required at build time. */
const configuredApiOrigin: string = process.env.NEXT_PUBLIC_API_BASE_URL ??
  (() => { throw new Error('NEXT_PUBLIC_API_BASE_URL is required'); })();
/** Keep the existing exported client contract and `/v1` prefix. */
export const API_BASE_URL = `${configuredApiOrigin.replace(/\/+$/, '')}/v1`;
```
The build validation accepts only HTTPS for staging/production and verifies the value was baked into the client bundle; local development may use `http://127.0.0.1`. `E2E_API_BASE_URL` must equal the target environment's API origin. No Railway fallback or silent localhost production default is allowed.

### Acceptance Criteria
- [ ] Missing production/staging API origin fails build validation; staging and production bundles contain their respective origins and no Railway hostname.
- [ ] Admin login and representative dashboard/orders/financial routes work against the staging API with staging Supabase-backed users.
- [x] Existing typed `get/post/patch/put/del` and `/v1` envelope behavior remain unchanged.

### Edge Cases
Trailing slash, accidentally including `/v1` in the input, localhost in release config, cached old Next build, and an E2E target that differs from the compiled API origin. Reject malformed release values rather than double-prefixing.

### Testing Decisions
Unit-test base URL normalization and fail-fast configuration; run Playwright smoke against the actual staging backend. The server TASK-012 gate uses that staging build, not a mock API.

### Verification
`pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm e2e` with staging test credentials, and inspected build-time URL evidence.

## Notes

- Implemented the required API origin, HTTPS build validation, bundle origin verification, and Playwright target matching. The production build verified `https://api.incacook.com`; the existing typed client methods and `/v1` prefix remain intact.
- `pnpm test` (18 passing), `pnpm typecheck`, `pnpm lint` (19 warnings, no errors), and the production build passed. The current shell runs Node 20.19.4 while this project declares Node 22.x.
- Staging verification is pending: this worktree has no `NEXT_PUBLIC_API_BASE_URL`, `E2E_API_BASE_URL`, or staging admin credentials configured, so the Cloud Run staging bundle and authenticated Playwright flows could not be run. No staging acceptance criteria are marked complete.
- 2026-10-15 re-run: `pnpm typecheck` clean, `pnpm test` 18/18, `pnpm lint` 0 errors (19 warnings), `pnpm build` fails without the origin, fails for `http://127.0.0.1:3001`, and passes with `https://api.incacook.com` ("Verified client bundle API origin: https://api.incacook.com"). Existing edits committed on `task/TASK-030` per the human decision.
- Remaining: build with the staging Cloud Run origin and run authenticated Playwright smoke (login, dashboard, orders, users, payment oversight). Blocked on a deployed staging backend (server TASK-010) and a staging admin account. AC 1 (staging bundle half) and AC 2 stay unchecked until then.

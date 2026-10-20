## TASK-030 — Build admin for staging and api.incacook.com
- status: review
- depends:
Status: Review
Priority: P0
Project: IncaCook Admin
Owner: Agent

### Scope
Replace the hardcoded Railway fallback in `lib/api/client.ts` with a required explicit `NEXT_PUBLIC_API_BASE_URL` for staging and production builds. Keep its single typed HTTP client and `/v1` response envelope. Update `.env.example`, build/deployment docs, and Playwright configuration so staging builds target `https://api-staging.incacook.com`; production builds target `https://api.incacook.com`. Provision a dedicated staging-only admin test login for this task before authenticated staging verification. Use no production identity or credential, and store any generated password only in the approved secret store, never in chat or committed files. Do not commit `.env.local` or credentials. Verify login, dashboard, orders, users, and payment oversight against staging once the account exists. This task must be complete before server TASK-012 staging rehearsal.

### Interface
```ts
/** Base URL of the API origin, without `/v1`; required at build time. */
const configuredApiOrigin: string = process.env.NEXT_PUBLIC_API_BASE_URL ??
  (() => { throw new Error('NEXT_PUBLIC_API_BASE_URL is required'); })();
/** Keep the existing exported client contract and `/v1` prefix. */
export const API_BASE_URL = `${configuredApiOrigin.replace(/\/+$/, '')}/v1`;
```
The build validation accepts only HTTPS for staging/production and verifies the value was baked into the client bundle; local development may use `http://127.0.0.1`. For staging, set both `NEXT_PUBLIC_API_BASE_URL` and `E2E_API_BASE_URL` to `https://api-staging.incacook.com`; use only the dedicated staging-only admin test login for authenticated E2E. `E2E_API_BASE_URL` must equal the target environment's API origin. No Railway fallback or silent localhost production default is allowed.

### Acceptance Criteria
- [x] Missing production/staging API origin fails build validation; the staging bundle contains `https://api-staging.incacook.com`, the production bundle contains `https://api.incacook.com`, and neither contains a Railway hostname.
- [x] A dedicated staging-only admin test login exists, with any generated password stored only in the approved secret store; authenticated Playwright verifies login and representative dashboard, orders, users, and payment oversight routes against `https://api-staging.incacook.com` using that login.
- [x] Existing typed `get/post/patch/put/del` and `/v1` envelope behavior remain unchanged.

### Edge Cases
Trailing slash, accidentally including `/v1` in the input, localhost in release config, cached old Next build, and an E2E target that differs from the compiled API origin. Reject malformed release values rather than double-prefixing. Reject use of a production identity or credential for staging verification; do not expose the staging password in chat, committed files, logs, or test artifacts.

### Design decision
Decided after escalation of TASK-030: create a dedicated staging-only admin test login; use no production identities or credentials; store any generated password only in the approved secret store, never in chat or committed files; use the confirmed staging API origin `https://api-staging.incacook.com`; continue the staging build and verification once the account exists.

### Testing Decisions
Unit-test base URL normalization and fail-fast configuration; run Playwright smoke against the actual staging backend. The server TASK-012 gate uses that staging build, not a mock API.

### Verification
`pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm e2e` with staging test credentials, and inspected build-time URL evidence.

## Notes

- Implemented the required API origin, HTTPS build validation, bundle origin verification, and Playwright target matching. The production build verified `https://api.incacook.com`; the existing typed client methods and `/v1` prefix remain intact.
- `pnpm test` (18 passing), `pnpm typecheck`, `pnpm lint` (19 warnings, no errors), and the production build passed. The current shell runs Node 20.19.4 while this project declares Node 22.x.
- Earlier staging verification was pending while the staging backend and dedicated test login were unavailable; the 2026-10-20 run below completes that verification.
- 2026-10-15 re-run: `pnpm typecheck` clean, `pnpm test` 18/18, `pnpm lint` 0 errors (19 warnings), `pnpm build` fails without the origin, fails for `http://127.0.0.1:3001`, and passes with `https://api.incacook.com` ("Verified client bundle API origin: https://api.incacook.com"). Existing edits committed on `task/TASK-030` per the human decision.
- Follow-up for server TASK-012: add the deployed admin origin to staging and production API `ALLOWED_ORIGINS` before real browsers use the deployed admin panel. This is separate from TASK-030's staging smoke verification.
- 2026-10-20 staging verification: created `staging-admin-test@incacook.com` (Supabase project frkducrjrwexiwxknkln + `User` role ADMIN) with the server's `scripts/create-admin.ts`; credentials stored only in `incacook-staging` Secret Manager (`incacook-staging-admin-test-email`, `incacook-staging-admin-test-password`). Staging build: "Verified client bundle API origin: https://api-staging.incacook.com", 0 Railway hits in `.next/static`; a `/v1` origin is rejected. `pnpm e2e` against https://api-staging.incacook.com: 28 passed, 2 skipped (non-admin specs needing extra creds) — login, dashboard, users, orders, payouts (payment oversight) and the other admin routes.
- Fixes needed to get E2E running: `allowedDevOrigins: ["127.0.0.1"]` in `next.config.mjs` (Next 16 blocked dev resources from 127.0.0.1 so the login page never hydrated), and `e2e/fixtures.ts`, a CORS bridge forwarding browser calls to the live staging API from Node. Reason: staging `ALLOWED_ORIGINS` is only `http://localhost:3000,http://localhost:8081`. **Follow-up for server TASK-012:** add the deployed admin origin to the staging/production API `ALLOWED_ORIGINS`.
- Gates (Node 22.23.2): typecheck clean, `pnpm test` 18/18, lint 0 errors (19 warnings), production build verified.
- Note: one Playwright failure log printed a short-lived (1h) staging admin access token to the tool output; it was not written to any file or committed. Fixed by catching in-flight route errors.
- Review (2026-10-20): OpenAI reviewer passed with no must-fix, should-fix, or nit findings. The builder used Anthropic; review ran on a different vendor. Task remains in Review until PR merge.
- Docs handoff (2026-10-20): PR summary and evidence prepared from the task verification above; all three acceptance criteria are verified. The board remains in Review while PR #12 awaits human review and merge.

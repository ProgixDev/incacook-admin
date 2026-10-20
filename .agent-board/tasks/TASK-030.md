## TASK-030 — Build admin for staging and api.incacook.com
- status: planned
- depends:
Status: Backlog
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
- [ ] Missing production/staging API origin fails build validation; the staging bundle contains `https://api-staging.incacook.com`, the production bundle contains `https://api.incacook.com`, and neither contains a Railway hostname.
- [ ] A dedicated staging-only admin test login exists, with any generated password stored only in the approved secret store; authenticated Playwright verifies login and representative dashboard, orders, users, and payment oversight routes against `https://api-staging.incacook.com` using that login.
- [ ] Existing typed `get/post/patch/put/del` and `/v1` envelope behavior remain unchanged.

### Edge Cases
Trailing slash, accidentally including `/v1` in the input, localhost in release config, cached old Next build, and an E2E target that differs from the compiled API origin. Reject malformed release values rather than double-prefixing. Reject use of a production identity or credential for staging verification; do not expose the staging password in chat, committed files, logs, or test artifacts.

### Design decision
Decided after escalation of TASK-030: create a dedicated staging-only admin test login; use no production identities or credentials; store any generated password only in the approved secret store, never in chat or committed files; use the confirmed staging API origin `https://api-staging.incacook.com`; continue the staging build and verification once the account exists.

### Testing Decisions
Unit-test base URL normalization and fail-fast configuration; run Playwright smoke against the actual staging backend. The server TASK-012 gate uses that staging build, not a mock API.

### Verification
`pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm e2e` with staging test credentials, and inspected build-time URL evidence.

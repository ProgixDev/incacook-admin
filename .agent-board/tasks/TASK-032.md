## TASK-032 — Platform earnings screen (net commission)
- status: planned
- depends: IncaCook-Server:TASK-023

### Scope
Add a dashboard page showing the server's `GET /v1/admin/platform-earnings?from=&to=` report: commission, platform buyer fee, Stripe fees, net platform earnings, and the amount currently owed to sellers and drivers, with a date-range picker (UTC, at most 92 days, default last 30 days). Use the existing dashboard layout, auth and data-fetching conventions and add one navigation entry. When the server returns `stripeFeesCents: null`, show net as unavailable with the `stripeFeesError` text rather than a number. Show `ordersWithoutStripeFee` when above zero. Read-only: no payout or Stripe action from this page. Link the runbook `IncaCook-Server/docs/runbooks/platform-payouts.md` in the page help text.

### Interface
```ts
interface PlatformEarningsReport {
  from: string; to: string; currency: 'eur';
  commissionCents: number; platformBuyerFeeCents: number;
  stripeFeesCents: number | null; stripeFeesError?: string; ordersWithoutStripeFee: number;
  netPlatformCents: number | null; owedToUsersCents: number;
}
```

### Acceptance Criteria
- [x] The page renders all totals in euros from a fake report and from a Stripe-error report (net unavailable, error shown).
- [x] A range over 92 days or `to` before `from` is rejected in the picker before any request.
- [x] Non-admin roles cannot open the page; the navigation entry follows the existing role rules.
- [x] The page offers no write action.

### Edge Cases
Empty period (all zeros), failed request, slow Stripe-backed response (loading state), and timezone display of the range boundaries.

### Testing Decisions
Component test for the two report shapes and the range validation; Playwright check that the route is admin-only.

### Verification
`pnpm typecheck`, `pnpm build`, focused component test, Playwright route check. Staging read-back after IncaCook-Server:TASK-024.

## Notes

- Built `/platform-earnings` (`app/(dashboard)/platform-earnings/`): pure range rules (`earnings-range.ts`, UTC, inclusive, ≤92 days, default last 30 days), a presentational `PlatformEarningsView`, and a client that fetches through `useAdminQuery` only after `tryApplyRange` accepts the range, so an invalid range makes no request. Nav entry "Revenus plateforme" added to the sidebar.
- Role rule: the server restricts the endpoint to `@Roles(Admin)` only, while the dashboard guard admits ADMIN and MODERATOR. Added `isFullAdminRole` (`ADMIN` only): the nav entry is hidden from moderators and the page shows "Accès réservé aux administrateurs" without issuing a request. Non-admin roles (BUYER etc.) are stopped by the existing `AuthGuard`.
- Runbook is named in the page help text as the path `IncaCook-Server/docs/runbooks/platform-payouts.md` (not a hyperlink: it lives in another repo).
- Gates (Node 22.23.2): `pnpm typecheck` clean; `pnpm lint` 0 errors (19 warnings, same count as before); `pnpm test` 33/33 (new: `earnings-range.test.ts`, `platform-earnings-view.test.tsx`); `NEXT_PUBLIC_API_BASE_URL=https://api-staging.incacook.com pnpm build` passes, route `/platform-earnings` listed, "Verified client bundle API origin".
- Playwright (mocked `/v1`, no backend or credentials): `e2e/platform-earnings.spec.ts` 5/5 plus `/platform-earnings` added to the unauthenticated redirect list in `auth-gate.spec.ts`: 17/17 passed. Covers ADMIN sees page/nav/euros/no write action, MODERATOR and BUYER blocked with no request, invalid ranges rejected with zero requests, Stripe-error report.
- Not done here: staging read-back, which waits for IncaCook-Server:TASK-024 (endpoint not yet deployed to staging). Not driven visually in a real browser against a live API; no `verify-<app>` skill was listed for this run.
- Timezone display: range boundaries are labelled "(UTC)" and formatted from the `YYYY-MM-DD` strings with no `Date` conversion.

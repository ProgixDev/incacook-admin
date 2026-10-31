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
- [ ] The page renders all totals in euros from a fake report and from a Stripe-error report (net unavailable, error shown).
- [ ] A range over 92 days or `to` before `from` is rejected in the picker before any request.
- [ ] Non-admin roles cannot open the page; the navigation entry follows the existing role rules.
- [ ] The page offers no write action.

### Edge Cases
Empty period (all zeros), failed request, slow Stripe-backed response (loading state), and timezone display of the range boundaries.

### Testing Decisions
Component test for the two report shapes and the range validation; Playwright check that the route is admin-only.

### Verification
`pnpm typecheck`, `pnpm build`, focused component test, Playwright route check. Staging read-back after IncaCook-Server:TASK-024.

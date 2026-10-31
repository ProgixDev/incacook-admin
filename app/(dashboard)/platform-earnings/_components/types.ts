/** `GET /v1/admin/platform-earnings?from=&to=` (IncaCook-Server TASK-023). */
export interface PlatformEarningsReport {
  /** First UTC day of the period, `YYYY-MM-DD`, inclusive. */
  from: string;
  /** Last UTC day of the period, `YYYY-MM-DD`, inclusive. */
  to: string;
  currency: "eur";
  commissionCents: number;
  platformBuyerFeeCents: number;
  /** `null` when Stripe could not be queried; see `stripeFeesError`. */
  stripeFeesCents: number | null;
  stripeFeesError?: string;
  ordersWithoutStripeFee: number;
  /** `null` exactly when `stripeFeesCents` is `null`. */
  netPlatformCents: number | null;
  /** Current balance owed to sellers and drivers; not bound to the period. */
  owedToUsersCents: number;
}

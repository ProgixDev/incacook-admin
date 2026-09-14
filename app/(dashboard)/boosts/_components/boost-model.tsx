import { Badge } from "@/components/ui/badge";

/**
 * Wire shape for `GET /v1/admin/boosts` — read-only oversight list.
 *
 * Contract: `docs/specs/listing-boosts-contract.md` (§3 data model, §6 admin
 * endpoint) in the server repo. The contract fixes the `ListingBoost` table
 * columns and mandates the admin endpoint "mirrors `AdminSubscriptionsController`
 * exactly", so this shape mirrors `AdminSubscriptionListItem`
 * (`admin-subscriptions.service.ts`) — same seller name/email join, same
 * `createdAt desc` ordering convention — applied to the boost row instead of
 * the subscription row. The endpoint isn't live yet (built in parallel), so
 * this is the documented/expected shape, not a verified one.
 *
 * `isActive` is computed server-side from §4 (`endsAt > now() AND canceledAt
 * IS NULL`) and returned rather than recomputed here, per the task's
 * instruction to read it from the API where possible.
 */
export type BoostSource = "FREE_PREMIUM";

export interface AdminBoost {
  id: string;
  listingId: string;
  listingName: string;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  source: BoostSource;
  startsAt: string;
  endsAt: string;
  canceledAt: string | null;
  isActive: boolean;
}

export type AdminBoostsListResponse = AdminBoost[];

export const BOOST_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Actif" },
  { value: "ENDED", label: "Terminé" },
  { value: "CANCELED", label: "Annulé" },
] as const;

export type BoostStatusFilter = (typeof BOOST_STATUS_OPTIONS)[number]["value"];

const SOURCE_LABEL: Record<BoostSource, string> = {
  FREE_PREMIUM: "Premium (gratuit)",
};

export function sourceLabel(source: BoostSource): string {
  return SOURCE_LABEL[source] ?? source;
}

/**
 * Display-only status derived from what the API returns. Falls back to the
 * contract's §4 definition (`endsAt > now() && canceledAt == null`) only when
 * the endpoint hasn't sent `isActive` — never used to override a value the
 * server did send.
 */
export function boostStatus(boost: AdminBoost): "ACTIVE" | "ENDED" | "CANCELED" {
  if (boost.canceledAt) return "CANCELED";
  const active =
    typeof boost.isActive === "boolean"
      ? boost.isActive
      : new Date(boost.endsAt).getTime() > Date.now();
  return active ? "ACTIVE" : "ENDED";
}

export function BoostStatusBadge({ boost }: { boost: AdminBoost }) {
  const status = boostStatus(boost);
  if (status === "ACTIVE") return <Badge variant="success">Actif</Badge>;
  if (status === "CANCELED") return <Badge variant="error">Annulé</Badge>;
  return <Badge variant="neutral">Terminé</Badge>;
}

/** Wire types of the seller-activation and seller-trial admin endpoints (incacook-server docs/seller-trial.md). */

export type RequestState = "none" | "pending" | "granted" | "refused";
export type AccessSource = "store" | "platform_trial" | null;
/** What an admin-granted period gives: access only, or also Premium (commission, boosts). */
export type TrialTier = "STANDARD" | "PREMIUM";

export interface ActivationCounters {
  signups: number;
  ready: number;
  /** Cohort sellers whose onboarding state could not be read: `ready` excludes them. */
  onboardingUnavailable: number;
  withAccess: number;
  firstListing: number;
}

export interface ActivationRow {
  sellerId: string;
  displayName: string | null;
  email: string;
  category: string | null;
  signedUpAt: string;
  isTestAccount: boolean;
  isSuspended: boolean;
  nextStep: string | null;
  kycState: string | null;
  /** Null when the onboarding state could not be read. */
  canList: boolean | null;
  onboardingUnavailable: boolean;
  access: { active: boolean; source: AccessSource; endsAt: string | null };
  /** The platform trial on its own (`access.endsAt` is the later end when a store subscription overlaps it). */
  trialEndsAt: string | null;
  trialRevokedAt: string | null;
  listings: number;
  orders: number;
  trialRequest: RequestState;
}

/** `data` of `GET /v1/admin/seller-activation`. */
export interface ActivationResponse {
  windowDays: number;
  counters: ActivationCounters;
  countersCapped: boolean;
  sellers: ActivationRow[];
  pagination: { limit: number; offset: number; hasMore: boolean };
}

export type DuplicateReason = "email" | "phone" | "pickup_address" | "siret";

export interface DuplicateHint {
  sellerId: string;
  displayName: string | null;
  reasons: DuplicateReason[];
}

/** One element of `data` for `GET /v1/admin/seller-trials?filter=ready|pending` (the wire list is flattened to `data = items`). */
export interface TrialListItem {
  sellerId: string;
  displayName: string | null;
  email: string;
  category: string | null;
  signedUpAt: string;
  requestState: RequestState;
  requestedAt: string | null;
  trialEndsAt: string | null;
  trialRevokedAt: string | null;
  /** What the grant gives (absent on servers that predate Premium grants: then STANDARD). */
  trialTier?: TrialTier;
  /** Access today. Absent on servers older than the access field: then it is unknown. */
  access?: { active: boolean; source: AccessSource; endsAt: string | null };
  /** Onboarding complete now; null when it could not be read; absent on older servers (then unknown). */
  ready?: boolean | null;
  /** The account is suspended (absent on servers that predate the field: no block). */
  suspended?: boolean;
  duplicates: DuplicateHint[];
}

/** Result of every trial action. */
export interface TrialActionResult {
  sellerId: string;
  requestState: RequestState;
  endsAt: string | null;
  accessActive: boolean;
  tier?: TrialTier;
}

export type TrialActionKind = "grant" | "extend" | "revoke" | "refuse";

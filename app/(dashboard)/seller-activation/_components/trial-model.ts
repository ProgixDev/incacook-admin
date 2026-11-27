import { ErrorCodes } from "@/lib/api/error-codes";
import type {
  ActivationRow,
  DuplicateReason,
  RequestState,
  TrialActionKind,
  TrialListItem,
  TrialTier,
} from "./types";

export const DEFAULT_TRIAL_DAYS = 60;
export const MAX_TRIAL_DAYS = 365;
export const MAX_REASON_LENGTH = 500;

/** What the action buttons need to know about a seller, whichever list it came from. */
export interface TrialFacts {
  requestState: RequestState;
  /** Store subscription or running trial. Unknown (undefined) in the trial lists. */
  accessActive?: boolean;
  /** The platform trial's own end (null when none). */
  trialEndsAt: string | null;
  trialRevokedAt: string | null;
  /** What the grant gives; unknown (undefined) is treated as STANDARD. */
  trialTier?: TrialTier;
  /**
   * Onboarding finished and approved. A grant before that would start the trial
   * before the seller can publish, so Accorder is only offered to ready sellers.
   * Undefined (the trial lists: ready sellers and pending requests) is not a block.
   */
  ready?: boolean;
  /** Suspended sellers cannot publish or take orders: a new trial would run unusable, so no grant is offered. */
  suspended?: boolean;
  /** The length (days) the seller was offered when they asked; the default of a grant to them. */
  offeredDays?: number | null;
}

export function factsFromActivationRow(row: ActivationRow): TrialFacts {
  return {
    requestState: row.trialRequest,
    accessActive: row.access.active,
    // The trial's own dates: `access.endsAt` would be the later end when a store
    // subscription overlaps the trial, which must not be sent as the end to extend.
    trialEndsAt: row.trialEndsAt,
    trialRevokedAt: row.trialRevokedAt,
    trialTier: row.trialTier,
    ready: row.canList === true,
    suspended: row.isSuspended === true,
    // A pending request keeps the length the seller was shown: carried here too, so a grant
    // from the full list proposes the same number as one from the pending list.
    offeredDays: row.offeredDays ?? null,
  };
}

export function factsFromTrialItem(item: TrialListItem): TrialFacts {
  return {
    requestState: item.requestState,
    accessActive: item.access?.active,
    // Unreadable (null) is not ready: no grant is offered on a guess. Absent (older server) is no block.
    ready: item.ready === undefined ? undefined : item.ready === true,
    trialEndsAt: item.trialEndsAt,
    trialRevokedAt: item.trialRevokedAt,
    trialTier: item.trialTier,
    suspended: item.suspended === true,
    offeredDays: item.offeredDays ?? null,
  };
}

/**
 * Which of the four actions make sense right now. The server is the judge (it
 * answers 409 with a precise code); this only hides the buttons that cannot
 * succeed so the admin is not offered them.
 */
export function availableActions(facts: TrialFacts, now: Date = new Date()): TrialActionKind[] {
  const actions: TrialActionKind[] = [];
  const ends = facts.trialEndsAt ? new Date(facts.trialEndsAt).getTime() : null;
  const running = ends !== null && ends > now.getTime() && !facts.trialRevokedAt;
  if (facts.accessActive !== true && facts.ready !== false && facts.suspended !== true) actions.push("grant");
  if (ends !== null && !facts.trialRevokedAt) actions.push("extend");
  if (running) actions.push("revoke");
  if (facts.requestState === "pending") actions.push("refuse");
  return actions;
}

export const ACTION_LABEL: Record<TrialActionKind, string> = {
  grant: "Accorder",
  extend: "Prolonger",
  revoke: "Révoquer",
  refuse: "Refuser",
};

/**
 * Revoke and refuse need a written reason (kept in the audit trail), and so does a Premium
 * grant: it costs commission and boosts, so it must say why.
 */
export function reasonRequired(kind: TrialActionKind, tier: TrialTier = "STANDARD"): boolean {
  return kind === "revoke" || kind === "refuse" || ((kind === "grant" || kind === "extend") && tier === "PREMIUM");
}

export interface ActionInput {
  days: string;
  reason: string;
  /** What a grant gives; only read for `grant`. Defaults to STANDARD (the "2 mois offerts"). */
  tier?: TrialTier;
}

/** Validation message for the confirmation form, or null when it can be sent. */
export function validateAction(kind: TrialActionKind, input: ActionInput): string | null {
  if (kind === "grant" || kind === "extend") {
    const days = Number(input.days);
    if (!Number.isInteger(days) || days < 1 || days > MAX_TRIAL_DAYS) {
      return `La durée doit être un nombre entier de jours entre 1 et ${MAX_TRIAL_DAYS}.`;
    }
  }
  const reason = input.reason.trim();
  if (reasonRequired(kind, input.tier) && reason.length === 0) {
    return kind === "grant" || kind === "extend"
      ? "Le motif est obligatoire pour un Premium offert."
      : "Le motif est obligatoire.";
  }
  if (reason.length > MAX_REASON_LENGTH) {
    return `Le motif ne peut pas dépasser ${MAX_REASON_LENGTH} caractères.`;
  }
  return null;
}

/** Request body for an action; `expectedEndsAt` is the end the admin is looking at (extend only). */
export function buildActionBody(
  kind: TrialActionKind,
  input: ActionInput,
  expectedEndsAt: string | null,
): Record<string, unknown> {
  const reason = input.reason.trim();
  const body: Record<string, unknown> = {};
  if (kind === "grant" || kind === "extend") body.days = Number(input.days);
  // Only a Premium grant names its tier: a Standard one is the server's default, and servers
  // that predate Premium grants reject fields they do not know.
  if (kind === "grant" && input.tier === "PREMIUM") body.tier = "PREMIUM";
  if (kind === "extend" && expectedEndsAt) body.expectedEndsAt = expectedEndsAt;
  if (reason) body.reason = reason;
  return body;
}

const ERROR_MESSAGES: Record<string, string> = {
  [ErrorCodes.TRIAL_ALREADY_ACTIVE]:
    "Ce vendeur a déjà accès à la plateforme (abonnement ou essai en cours). La liste a été rechargée : vérifie son état avant de continuer.",
  [ErrorCodes.TRIAL_NOT_GRANTED]:
    "Cette action n’est pas possible sur l’essai de ce vendeur (jamais accordé, déjà révoqué ou déjà terminé). La liste a été rechargée : vérifie son état.",
  [ErrorCodes.TRIAL_NO_PENDING_REQUEST]:
    "Ce vendeur n’a pas de demande en attente : elle a peut-être déjà été traitée par un autre administrateur.",
  [ErrorCodes.TRIAL_STALE]:
    "L’essai a été modifié entre-temps (par un autre administrateur ?). La liste a été rechargée : vérifie la nouvelle date avant de recommencer.",
  [ErrorCodes.TRIAL_PREMIUM_REASON_REQUIRED]: "Indique la raison d’un Premium offert.",
  [ErrorCodes.FORBIDDEN]: "Action réservée aux administrateurs.",
};

/** French message for a failed action; falls back to the server's own message. */
export function actionErrorMessage(code: string | undefined, fallback: string): string {
  return (code && ERROR_MESSAGES[code]) || fallback;
}

/** After these errors the data on screen is out of date: refetch it. */
export function shouldRefetchAfterError(code: string | undefined): boolean {
  return (
    code === ErrorCodes.TRIAL_ALREADY_ACTIVE ||
    code === ErrorCodes.TRIAL_NOT_GRANTED ||
    code === ErrorCodes.TRIAL_NO_PENDING_REQUEST ||
    code === ErrorCodes.TRIAL_STALE
  );
}

const REASON_LABEL: Record<DuplicateReason, string> = {
  email: "même e-mail",
  phone: "même téléphone",
  pickup_address: "même adresse de retrait",
  siret: "même SIRET",
};

export function duplicateReasonLabel(reasons: DuplicateReason[]): string {
  return reasons.map((r) => REASON_LABEL[r]).join(", ");
}

export const REQUEST_STATE_LABEL: Record<RequestState, string> = {
  none: "Aucune demande",
  pending: "Demande en attente",
  granted: "Essai accordé",
  refused: "Demande refusée",
};

const NEXT_STEP_LABEL: Record<string, string> = {
  profile: "Profil",
  addresses: "Adresse de retrait",
  business: "Entreprise",
  cuisines: "Cuisines",
  kyc_id: "Pièce d’identité",
  kyc_selfie: "Selfie",
  charter: "Chartes",
};

/** Human label of the first incomplete onboarding step (the raw key when unknown). */
export function nextStepLabel(step: string | null): string {
  return step ? (NEXT_STEP_LABEL[step] ?? step) : "—";
}

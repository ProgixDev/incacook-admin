import type { AnalyticsDaily, AnalyticsStep } from "./types";

/** « 42 % », « 3,5 % » (French decimal comma), « — » when there is no rate. */
export function formatRate(rate: number | null): string {
  if (rate === null || !Number.isFinite(rate)) return "—";
  const pct = rate * 100;
  const text =
    pct >= 10 || Number.isInteger(pct)
      ? String(Math.round(pct))
      : pct.toFixed(1).replace(".", ",");
  return `${text} %`;
}

/** Thousands separated by a narrow no-break space, as in the rest of the admin. */
export function formatCount(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(n);
}

/** Width of a bar (0 to 100) relative to the largest value; a non-zero value always shows. */
export function barPercent(value: number, max: number): number {
  if (max <= 0 || value <= 0) return 0;
  return Math.max(2, Math.round((value / max) * 100));
}

/** French labels for the parameter values the app logs; anything else is shown as logged. */
const VALUE_LABELS: Record<string, Record<string, string>> = {
  method: {
    email: "E-mail",
    google: "Google",
    facebook: "Facebook",
    apple: "Apple",
    unknown: "Inconnue",
  },
  role: { buyer: "Acheteur", seller: "Vendeur", driver: "Livreur" },
  source: { gate: "Premier passage", lapsed: "Abonnement expiré" },
  skipped: { "1": "Passé", "0": "Terminé jusqu’au bout" },
  product: { standard: "Standard", premium: "Premium" },
};

const RESULT_LABELS: Record<string, Record<string, string>> = {
  trial_request: {
    requested: "Demande envoyée",
    already_requested: "Déjà décidée",
    not_eligible: "Non éligible",
    onboarding_incomplete: "Inscription incomplète",
    error: "Erreur",
  },
  subscription_purchase: {
    success: "Réussi",
    cancelled: "Annulé",
    no_entitlement: "Sans accès actif",
    error: "Erreur",
  },
};

export function valueLabel(
  event: string,
  parameter: string,
  value: string,
): string {
  if (parameter === "result") return RESULT_LABELS[event]?.[value] ?? value;
  return VALUE_LABELS[parameter]?.[value] ?? value;
}

/** The ranges the page offers, with their labels. */
export const WINDOW_LABEL: Record<number, string> = {
  7: "7 jours",
  30: "30 jours",
  90: "90 jours",
};

/** Sum of a daily column, for the total shown above the chart. */
export function dailyTotal(
  daily: AnalyticsDaily[],
  key: keyof Omit<AnalyticsDaily, "date">,
): number {
  return daily.reduce((sum, d) => sum + d[key], 0);
}

/** « 25/11 » for the axis, from YYYY-MM-DD (no timezone maths: the date is already a calendar day). */
export function shortDay(date: string): string {
  const [, m, d] = date.split("-");
  return m && d ? `${d}/${m}` : date;
}

/** The step list as the page shows it: a step with no activity at all is flagged, not hidden. */
export function stepHasActivity(step: AnalyticsStep): boolean {
  return step.events > 0 || step.users > 0;
}

/**
 * A key-figure card for an event that fires on every ATTEMPT (trial request, purchase): the
 * successful count when Google can tell, otherwise the attempts, labelled as such. Never
 * attempts under a success label.
 */
export function outcomeCard(
  step: AnalyticsStep | undefined,
  labels: { success: string; attempts: string },
): { label: string; value: number; hint: string } {
  const attempts = step?.events ?? 0;
  if (step && step.succeededEvents !== null) {
    return {
      label: labels.success,
      value: step.succeededEvents,
      hint: `sur ${attempts} tentative${attempts > 1 ? "s" : ""}`,
    };
  }
  return {
    label: labels.attempts,
    value: attempts,
    hint: "réussites non encore mesurables",
  };
}

import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatDateParis } from "./dates";
import { duplicateReasonLabel, nextStepLabel, REQUEST_STATE_LABEL } from "./trial-model";
import type { ActivationCounters, ActivationRow, DuplicateHint, RequestState } from "./types";

/** The four funnel counters of the last `windowDays` days (one signup cohort). */
export function CountersGrid({
  counters,
  windowDays,
  capped,
}: {
  counters: ActivationCounters;
  windowDays: number;
  capped: boolean;
}) {
  return (
    <section aria-label={`Entonnoir des ${windowDays} derniers jours`} className="mb-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Inscrits" value={String(counters.signups)} hint={`${windowDays} derniers jours`} />
        <StatCard label="Prêts à vendre" value={String(counters.ready)} hint="Inscription terminée et validée" />
        <StatCard label="Avec accès" value={String(counters.withAccess)} hint="Abonnement ou essai en cours" />
        <StatCard label="Première annonce" value={String(counters.firstListing)} hint="Au moins une annonce publiée" />
      </div>
      {(counters.onboardingUnavailable > 0 || capped) && (
        <p role="note" className="mt-2 text-[12px] text-warning">
          {counters.onboardingUnavailable > 0 &&
            `${counters.onboardingUnavailable} vendeur(s) dont l’état d’inscription est illisible ne sont pas comptés dans « Prêts à vendre ». `}
          {capped && "Trop d’inscrits pour être tous analysés : les compteurs sont sous-estimés."}
        </p>
      )}
    </section>
  );
}

export function SellerCell({
  name,
  email,
  isTestAccount,
  isSuspended,
}: {
  name: string | null;
  email: string;
  isTestAccount?: boolean;
  isSuspended?: boolean;
}) {
  return (
    <div className="min-w-0 max-w-[260px]">
      <div className="flex items-center gap-1.5">
        <span className="truncate text-[13px] font-medium text-on-surface">{name ?? "Sans nom"}</span>
        {isTestAccount && <Badge variant="neutral">Test</Badge>}
        {isSuspended && <Badge variant="error">Suspendu</Badge>}
      </div>
      <div className="truncate text-[11px] text-on-surface-variant">{email}</div>
    </div>
  );
}

export function AccessBadge({ access }: { access: ActivationRow["access"] }) {
  if (!access.active) return <Badge variant="neutral">Aucun accès</Badge>;
  // The date is shown for a trial only. With a store subscription the server may
  // report a trial's end (when the store period end is unknown), which is not a
  // subscription end: no date rather than a wrong one.
  if (access.source === "platform_trial") {
    const end = access.endsAt ? ` · jusqu’au ${formatDateParis(access.endsAt)}` : "";
    return <Badge variant="info">{`Essai offert${end}`}</Badge>;
  }
  return <Badge variant="success">Abonné</Badge>;
}

const REQUEST_VARIANT: Record<RequestState, "neutral" | "warning" | "success" | "error"> = {
  none: "neutral",
  pending: "warning",
  granted: "success",
  refused: "error",
};

export function RequestBadge({ state }: { state: RequestState }) {
  return <Badge variant={REQUEST_VARIANT[state]}>{REQUEST_STATE_LABEL[state]}</Badge>;
}

/** Onboarding status: the first incomplete step, "Prêt", or an explicit "illisible". */
export function OnboardingCell({ row }: { row: ActivationRow }) {
  if (row.onboardingUnavailable) {
    return <span className="text-[12px] text-warning">État illisible</span>;
  }
  if (row.canList) return <Badge variant="success">Prêt</Badge>;
  if (row.nextStep) {
    return <span className="text-[12px] text-on-surface">{nextStepLabel(row.nextStep)}</span>;
  }
  return <span className="text-[12px] text-on-surface-variant">Validation en cours</span>;
}

export function DuplicateHints({ hints }: { hints: DuplicateHint[] }) {
  if (hints.length === 0) return <span className="text-[12px] text-on-surface-variant">—</span>;
  return (
    <ul className="flex max-w-[260px] flex-col gap-1">
      {hints.map((h) => (
        <li key={h.sellerId} className="text-[11.5px] leading-snug text-warning [overflow-wrap:anywhere]">
          <span className="font-medium">{h.displayName ?? h.sellerId}</span>
          {" : "}
          {duplicateReasonLabel(h.reasons)}
        </li>
      ))}
    </ul>
  );
}

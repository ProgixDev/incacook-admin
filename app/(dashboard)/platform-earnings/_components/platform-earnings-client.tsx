"use client";

import { useState } from "react";
import { AlertTriangle, RefreshCw, ShieldAlert } from "lucide-react";
import { useAdminQuery } from "@/lib/query";
import { useAuth, isFullAdminRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { defaultRange, tryApplyRange, MAX_RANGE_DAYS, type DayRange } from "./earnings-range";
import { PlatformEarningsView } from "./platform-earnings-view";
import type { PlatformEarningsReport } from "./types";

/** Repo path of the runbook; the API repo is separate, so it is shown as a path. */
const RUNBOOK_PATH = "IncaCook-Server/docs/runbooks/platform-payouts.md";

export function PlatformEarningsClient() {
  const { user } = useAuth();
  if (!user || !isFullAdminRole(user.role)) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-md border border-outline-variant bg-surface-container-low p-12 text-center">
        <ShieldAlert className="h-7 w-7 text-error" />
        <h2 className="text-base font-semibold text-on-surface">Accès réservé aux administrateurs</h2>
        <p className="max-w-sm text-sm text-on-surface-variant">
          Les revenus de la plateforme ne sont accessibles qu&apos;aux comptes administrateur.
        </p>
      </div>
    );
  }
  return <EarningsPanel />;
}

function EarningsPanel() {
  const [initial] = useState(() => defaultRange());
  const [applied, setApplied] = useState<DayRange>(initial);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [rangeError, setRangeError] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useAdminQuery<PlatformEarningsReport>({
    path: "/admin/platform-earnings",
    params: { extra: { from: applied.from, to: applied.to } },
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRangeError(tryApplyRange(from, to, setApplied));
  }

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3" aria-label="Période">
        <label className="flex flex-col gap-1 text-[12px] font-medium text-on-surface-variant">
          Du (UTC)
          <Input type="date" name="from" value={from} onChange={(e) => setFrom(e.target.value)} className="w-[170px]" />
        </label>
        <label className="flex flex-col gap-1 text-[12px] font-medium text-on-surface-variant">
          Au (UTC, inclus)
          <Input type="date" name="to" value={to} onChange={(e) => setTo(e.target.value)} className="w-[170px]" />
        </label>
        <Button type="submit" disabled={isLoading}>
          Afficher
        </Button>
      </form>
      <p className="-mt-3 text-[11px] text-on-surface-variant">
        Jours calendaires UTC, bornes incluses, {MAX_RANGE_DAYS} jours maximum. Par défaut : les 30 derniers jours.
      </p>

      {rangeError && (
        <p role="alert" className="flex items-center gap-2 text-[13px] text-error" data-testid="range-error">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {rangeError}
        </p>
      )}

      {isLoading && (
        <div aria-busy="true" data-testid="earnings-loading" className="flex flex-col gap-3">
          <p className="text-[13px] text-on-surface-variant">
            Chargement… le calcul des frais Stripe peut prendre quelques secondes.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-md border border-outline-variant bg-surface-container-low" />
            ))}
          </div>
        </div>
      )}

      {isError && !isLoading && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-md border border-error/40 bg-error/10 p-4 text-[13px] text-error"
          data-testid="earnings-error"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1 break-words">
            {error?.message ?? "Impossible de charger le rapport."}
            {error?.correlationId ? ` (réf. ${error.correlationId})` : ""}
          </span>
          <Button type="button" variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-3.5 w-3.5" />
            Réessayer
          </Button>
        </div>
      )}

      {!isLoading && !isError && data && <PlatformEarningsView report={data} />}

      <p className="text-[12px] text-on-surface-variant" data-testid="earnings-help">
        Page en lecture seule. Pour comprendre ces chiffres et la réserve à conserver avant tout versement Stripe,
        consultez le runbook <code className="rounded bg-surface-container-high px-1">{RUNBOOK_PATH}</code>.
      </p>
    </div>
  );
}

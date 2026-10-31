import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatEurFromCents } from "@/lib/utils";
import { formatUtcDay } from "./earnings-range";
import type { PlatformEarningsReport } from "./types";

const eur = formatEurFromCents;

function Metric({
  label,
  hint,
  testId,
  highlight,
  children,
}: {
  label: string;
  hint: string;
  testId: string;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn(highlight && "border-primary")} data-testid={testId}>
      <CardHeader>
        <CardTitle className="text-[13px] font-medium text-on-surface-variant">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {children}
        <p className="text-[11px] text-on-surface-variant">{hint}</p>
      </CardContent>
    </Card>
  );
}

function Amount({ cents, className }: { cents: number; className?: string }) {
  return <div className={cn("text-2xl font-semibold tabular-nums text-on-surface", className)}>{eur(cents)}</div>;
}

function Unavailable({ message }: { message?: string }) {
  return (
    <div>
      <div className="text-2xl font-semibold text-on-surface-variant">Indisponible</div>
      {message && (
        <p role="alert" className="mt-1 break-words text-[12px] text-error">
          {message}
        </p>
      )}
    </div>
  );
}

/** Read-only presentation of one earnings report. */
export function PlatformEarningsView({ report }: { report: PlatformEarningsReport }) {
  const feesAvailable = report.stripeFeesCents !== null;
  const netAvailable = feesAvailable && report.netPlatformCents !== null;
  const noOrders = report.commissionCents === 0 && report.platformBuyerFeeCents === 0;

  return (
    <div className="flex flex-col gap-4" data-testid="platform-earnings-report">
      <p className="text-[12px] text-on-surface-variant">
        Période (UTC) : du {formatUtcDay(report.from)} au {formatUtcDay(report.to)} inclus
      </p>

      {noOrders && (
        <p className="text-[13px] text-on-surface-variant">Aucune commande payée sur cette période.</p>
      )}

      {!feesAvailable && (
        <div
          className="flex items-start gap-2 rounded-md border border-error/40 bg-error/10 p-3 text-[13px] text-error"
          data-testid="stripe-fees-unavailable"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            Frais Stripe indisponibles : le revenu net ne peut pas être calculé pour cette période.
            {report.stripeFeesError && <div className="mt-1 break-words">{report.stripeFeesError}</div>}
          </div>
        </div>
      )}

      {report.ordersWithoutStripeFee > 0 && (
        <p
          className="flex items-center gap-2 rounded-md border border-outline-variant bg-surface-container-high p-3 text-[13px] text-on-surface"
          data-testid="orders-without-stripe-fee"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
          {report.ordersWithoutStripeFee} commande(s) sans frais Stripe trouvé : les frais affichés peuvent être
          sous-estimés.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Metric label="Commission" hint="Commission sur les commandes payées" testId="metric-commission">
          <Amount cents={report.commissionCents} />
        </Metric>
        <Metric label="Frais acheteur plateforme" hint="Frais de service facturés aux acheteurs" testId="metric-buyer-fee">
          <Amount cents={report.platformBuyerFeeCents} />
        </Metric>
        <Metric label="Frais Stripe" hint="Frais de paiement prélevés par Stripe" testId="metric-stripe-fees">
          {feesAvailable ? (
            <Amount cents={report.stripeFeesCents as number} />
          ) : (
            <Unavailable message={report.stripeFeesError} />
          )}
        </Metric>
        <Metric
          label="Revenu net plateforme"
          hint="Commission + frais acheteur − frais Stripe"
          testId="metric-net"
          highlight
        >
          {netAvailable ? (
            <Amount cents={report.netPlatformCents as number} className="text-success" />
          ) : (
            <Unavailable />
          )}
        </Metric>
        <Metric
          label="Dû aux vendeurs et livreurs"
          hint="Solde actuel en attente, disponible ou bloqué (hors période)"
          testId="metric-owed"
        >
          <Amount cents={report.owedToUsersCents} />
        </Metric>
      </div>
    </div>
  );
}

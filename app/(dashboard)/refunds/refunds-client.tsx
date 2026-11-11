"use client";

import { useState } from "react";
import { post } from "@/lib/api";
import { useAdminMutation, useAdminQuery } from "@/lib/query";
import { formatEurFromCents } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Row = {
  order: { id: string; orderNumber: string; status: string; buyerTotalCents: number; stripePaymentIntentId: string | null; stripeRefundId: string | null };
  state: "PENDING" | "FAILED"; lastError: string | null; attempts: number; stripeError: boolean;
  stripe: { paymentStatus: string; amountReceived: number; currency: string; refunds: { id: string; status: string | null; amount: number }[] } | null;
  wallet: { type: string; status: string; amountCents: number }[];
};

export function RefundsClient() {
  const [cursors, setCursors] = useState<string[]>([]);
  const { data, pagination, isLoading, isError, error, refetch } = useAdminQuery<Row[]>({ path: "/admin/refunds", params: { extra: { cursor: cursors.at(-1) } } });
  const retry = useAdminMutation<{ resumed: boolean }, string>((id, opts) => post(`/admin/refunds/${encodeURIComponent(id)}/reconcile`, {}, opts));
  async function reconcile(id: string) {
    try { await retry.mutate(id); await refetch(); } catch { /* error shown below */ }
  }
  if (isLoading) return <p>Chargement des remboursements…</p>;
  if (isError) return <div><p>{error?.message ?? "Impossible de charger les remboursements."}</p><Button onClick={refetch}>Réessayer</Button></div>;
  return <div className="space-y-4">
    <p className="text-sm text-on-surface-variant">Une reprise exige un remboursement complet confirmé dans Stripe. Vérifiez le paiement et le journal avant de reprendre.</p>
    {retry.error && <p role="alert" className="text-error">{retry.error.message}</p>}
    {!data?.length && <p>Aucun remboursement en attente ou en échec sur cette page.</p>}
    {data?.map((row) => <section key={row.order.id} className="rounded-lg border border-outline-variant p-4 space-y-2">
      <div className="flex flex-wrap justify-between gap-2"><strong>Commande {row.order.orderNumber}</strong><span>{row.state === "FAILED" ? "À régulariser" : "En cours"} · {row.attempts} tentative(s)</span></div>
      <p>Commande : {row.order.status} · Total : {formatEurFromCents(row.order.buyerTotalCents)}</p>
      <p>Identifiant commande : {row.order.id} · Paiement Stripe : {row.order.stripePaymentIntentId ?? "aucun"}</p>
      <p>Stripe : {row.stripeError ? "indisponible" : row.stripe ? `${row.stripe.paymentStatus} · reçu ${formatEurFromCents(row.stripe.amountReceived)}` : "aucun paiement associé"}</p>
      {row.stripe?.refunds.map((r) => <p key={r.id}>Remboursement {r.id} : {r.status ?? "inconnu"} · {formatEurFromCents(r.amount)}</p>)}
      {row.wallet.map((entry, i) => <p key={`${entry.type}-${i}`}>Portefeuille : {entry.type} · {entry.status} · {formatEurFromCents(entry.amountCents)}</p>)}
      {row.lastError && <p className="text-error">Dernière erreur : {row.lastError}</p>}
      {row.state === "FAILED" && <Button onClick={() => reconcile(row.order.id)} disabled={retry.isPending || row.stripeError}>Vérifier et reprendre</Button>}
    </section>)}
    <div className="flex gap-2"><Button variant="outline" disabled={!cursors.length} onClick={() => setCursors(cursors.slice(0, -1))}>Précédent</Button><Button variant="outline" disabled={!pagination?.nextCursor} onClick={() => pagination?.nextCursor && setCursors([...cursors, pagination.nextCursor])}>Suivant</Button></div>
  </div>;
}

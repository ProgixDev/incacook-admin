"use client";

import { useState } from "react";
import { CheckCircle2, Gift } from "lucide-react";

import { patch } from "@/lib/api";
import { isFullAdminRole, useAuth } from "@/lib/auth";
import { useAdminMutation, useAdminQuery } from "@/lib/query";
import { trialOfferPhrase } from "@/lib/trial-offer";
import { formatDateTimeFr } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTableError } from "@/components/dashboard/data-table-states";
import { parseTrialDays, trialSettingsChanges, type SellerTrialSettings } from "./trial-settings";

/**
 * "Essai offert": the switch that sends the free-trial request for the seller, and the length the
 * offer advertises. Admin only (the server refuses moderators), so nothing is shown to them.
 */
export function TrialSettingsCard() {
  const { user } = useAuth();
  const isAdmin = !!user && isFullAdminRole(user.role);
  const { data, isLoading, isError, error, refetch } = useAdminQuery<SellerTrialSettings>({
    path: "/admin/settings/seller-trial",
    enabled: isAdmin,
  });

  const [autoRequest, setAutoRequest] = useState(false);
  const [days, setDays] = useState("60");
  const [saved, setSaved] = useState(false);
  // Seed / re-seed from the server value when it (re)loads — no effect needed.
  const [seeded, setSeeded] = useState<string | null>(null);
  const key = data ? `${data.autoRequest}:${data.days}` : null;
  if (data && key !== seeded) {
    setSeeded(key);
    setAutoRequest(data.autoRequest);
    // An invalid stored length (null) leaves the field empty: the admin must type a new one.
    setDays(data.days === null ? "" : String(data.days));
  }

  const save = useAdminMutation<SellerTrialSettings, { autoRequest?: boolean; days?: number }>(
    (body, opts) => patch("/admin/settings/seller-trial", body, opts),
  );

  if (!isAdmin) return null;

  const changes = data ? trialSettingsChanges(data, { autoRequest, days }) : null;
  const parsedDays = data ? parseTrialDays(days, data.minDays, data.maxDays) : null;
  const invalidDays = days.trim() !== "" && data != null && parsedDays === null;
  const canSave = changes !== null && !save.isPending;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave || !changes) return;
    setSaved(false);
    try {
      await save.mutate(changes);
      setSaved(true);
      refetch();
    } catch {
      // save.error is rendered inline below.
    }
  }

  return (
    <div className="max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Essai offert
          </CardTitle>
          <CardDescription>
            La demande d’essai gratuit des vendeurs et la durée annoncée. Tu accordes ou refuses toujours chaque
            demande.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isError ? (
            <DataTableError error={error} onRetry={refetch} />
          ) : isLoading && !data ? (
            <div className="flex flex-col gap-3">
              <div className="h-4 w-40 animate-pulse rounded bg-surface-container-high" />
              <div className="h-9 w-full animate-pulse rounded bg-surface-container-high" />
            </div>
          ) : (
            <form className="flex flex-col gap-5" onSubmit={submit} noValidate>
              <label className="flex items-start gap-3 text-sm text-on-surface">
                <input
                  type="checkbox"
                  role="switch"
                  className="mt-0.5 h-4 w-4 accent-primary"
                  checked={autoRequest}
                  onChange={(e) => {
                    setAutoRequest(e.target.checked);
                    setSaved(false);
                  }}
                />
                <span>
                  <span className="font-medium">Demande automatique</span>
                  <span className="mt-0.5 block text-[12px] text-on-surface-variant">
                    Quand un vendeur a terminé son inscription et que son identité est validée, sa demande part toute
                    seule (à la validation, ou à l’ouverture de l’app). Désactivé : le vendeur appuie sur le bouton.
                  </span>
                </span>
              </label>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="trial-days" className="text-xs font-medium text-on-surface-variant">
                  Durée de l’essai offert (jours)
                </label>
                <Input
                  id="trial-days"
                  type="number"
                  inputMode="numeric"
                  step={1}
                  min={data?.minDays}
                  max={data?.maxDays}
                  value={days}
                  onChange={(e) => {
                    setDays(e.target.value);
                    setSaved(false);
                  }}
                />
                <p className="text-[11px] text-on-surface-variant">
                  Entre {data?.minDays ?? 7} et {data?.maxDays ?? 365} jours.
                  {parsedDays !== null && <> Les vendeurs lisent « {trialOfferPhrase(parsedDays)} ».</>}
                </p>
                <p className="text-[11px] text-on-surface-variant">
                  S’applique aux nouvelles demandes et sert de durée par défaut à « Accorder ». Une demande déjà
                  envoyée garde la durée annoncée au vendeur.
                </p>
              </div>

              {data && data.days === null && (
                <p role="alert" className="-mt-2 text-[12px] text-error">
                  La durée enregistrée est invalide : aucune durée n’est annoncée aux vendeurs. Saisis-en une.
                </p>
              )}

              {data?.updatedAt && (
                <p className="-mt-2 text-[11px] text-on-surface-variant">
                  Dernière modification&nbsp;: {formatDateTimeFr(data.updatedAt)}
                </p>
              )}

              {save.error && (
                <p role="alert" className="rounded-md border border-error/40 bg-error/5 px-3 py-2 text-sm text-error">
                  {save.error.message}
                  {save.error.correlationId ? ` (réf. ${save.error.correlationId})` : ""}
                </p>
              )}

              {saved && !save.isPending && (
                <div
                  role="status"
                  className="flex items-center gap-2 rounded-md border border-success/40 bg-success/5 px-3 py-2 text-sm text-on-surface"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                  Réglage enregistré.
                </div>
              )}

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={!canSave}>
                  {save.isPending ? "Enregistrement…" : "Enregistrer"}
                </Button>
                {invalidDays && (
                  <span className="text-xs text-on-surface-variant">Durée invalide.</span>
                )}
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ApiError, post } from "@/lib/api";
import { useAdminMutation } from "@/lib/query";
import { formatDateParis } from "./dates";
import {
  ACTION_LABEL,
  actionErrorMessage,
  buildActionBody,
  DEFAULT_TRIAL_DAYS,
  MAX_REASON_LENGTH,
  reasonRequired,
  shouldRefetchAfterError,
  validateAction,
} from "./trial-model";
import type { TrialActionKind, TrialActionResult, TrialTier } from "./types";

export interface TrialActionTarget {
  kind: TrialActionKind;
  sellerId: string;
  sellerName: string;
  /** The trial end the admin is looking at (sent as `expectedEndsAt` when extending). */
  trialEndsAt: string | null;
  /** What the existing grant gives, when known: extending a Premium grant needs a reason too. */
  tier?: TrialTier;
}

const PREMIUM_GRANT_COPY =
  "Premium offert : en plus de l’accès, le vendeur profite pendant la durée choisie de la commission Premium (25 %), de sa commission offerte du mois et des mises à la Une. Cela te coûte de la commission : le motif est obligatoire. Impossible si le vendeur a déjà accès (abonnement ou période en cours).";

const COPY: Record<TrialActionKind, (t: TrialActionTarget) => string> = {
  grant: (t) =>
    `${t.sellerName} pourra publier ses plats et recevoir des commandes pendant la durée choisie. Une notification et un e-mail lui sont envoyés au mieux (l’accès est accordé même si aucun n’arrive) : préviens-le toi-même si besoin.`,
  extend: (t) =>
    t.trialEndsAt
      ? `L’essai actuel se termine le ${formatDateParis(t.trialEndsAt)}. La durée choisie s’ajoute à cette date (ou part d’aujourd’hui si l’essai est terminé).`
      : "La durée choisie s’ajoute à la fin de l’essai.",
  revoke: (t) =>
    `L’essai de ${t.sellerName} est révoqué immédiatement. Si le vendeur a un abonnement actif sur le store, son accès continue ; sinon il le perd. Les commandes déjà passées restent traitables.`,
  refuse: (t) => `La demande de ${t.sellerName} sera refusée. Elle ne pourra pas en refaire une.`,
};

/** Confirmation step for one trial action: durations and reasons are validated before anything is sent. */
export function TrialActionDialog({
  target,
  onClose,
  onDone,
  onStale,
}: {
  target: TrialActionTarget | null;
  onClose: () => void;
  /** Called with the server's result so the page can refetch the real state. */
  onDone: (kind: TrialActionKind, result: TrialActionResult) => void;
  /** Called when the server says the data on screen is out of date, with its error code. */
  onStale: (code: string) => void;
}) {
  const [days, setDays] = useState(String(DEFAULT_TRIAL_DAYS));
  const [reason, setReason] = useState("");
  const [tier, setTier] = useState<TrialTier>("STANDARD");
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useAdminMutation<TrialActionResult, { t: TrialActionTarget; body: Record<string, unknown> }>(
    ({ t, body }, opts) => post(`/admin/sellers/${encodeURIComponent(t.sellerId)}/trial/${t.kind}`, body, opts),
  );

  // Start every opening from a clean form.
  useEffect(() => {
    if (target) {
      setDays(target.kind === "extend" ? "30" : String(DEFAULT_TRIAL_DAYS));
      setReason("");
      setTier("STANDARD");
      setFormError(null);
      mutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.sellerId, target?.kind]);

  if (!target) return null;
  const needsDays = target.kind === "grant" || target.kind === "extend";
  // A grant takes the plan chosen in the form; an extension carries the plan of the grant it extends.
  const effectiveTier: TrialTier = target.kind === "grant" ? tier : (target.tier ?? "STANDARD");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!target) return;
    const invalid = validateAction(target.kind, { days, reason, tier: effectiveTier });
    setFormError(invalid);
    if (invalid) return;
    try {
      const result = await mutation.mutate({
        t: target,
        body: buildActionBody(target.kind, { days, reason, tier }, target.trialEndsAt),
      });
      onDone(target.kind, result);
    } catch (err) {
      if (err instanceof ApiError && shouldRefetchAfterError(err.code)) onStale(err.code);
    }
  }

  const serverError = mutation.error ? actionErrorMessage(mutation.error.code, mutation.error.message) : null;

  return (
    <Dialog open onOpenChange={(open) => !open && !mutation.isPending && onClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:w-full">
        <DialogTitle className="[overflow-wrap:anywhere]">{`${ACTION_LABEL[target.kind]} · ${target.sellerName}`}</DialogTitle>
        <DialogDescription className="[overflow-wrap:anywhere]">
          {target.kind === "grant" && tier === "PREMIUM" ? PREMIUM_GRANT_COPY : COPY[target.kind](target)}
        </DialogDescription>
        <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
          {target.kind === "grant" && (
            <fieldset className="flex flex-col gap-1.5 text-[12px] font-medium text-on-surface-variant">
              <legend className="mb-1">Ce que le vendeur reçoit</legend>
              {(
                [
                  ["STANDARD", "Essai gratuit (accès à la plateforme)"],
                  ["PREMIUM", "Premium offert (accès + commission Premium + mises à la Une)"],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className="flex items-start gap-2 text-[13px] font-normal text-on-surface">
                  <input
                    type="radio"
                    name="tier"
                    value={value}
                    checked={tier === value}
                    onChange={() => setTier(value)}
                    className="mt-1"
                  />
                  {label}
                </label>
              ))}
            </fieldset>
          )}
          {needsDays && (
            <label className="flex flex-col gap-1 text-[12px] font-medium text-on-surface-variant">
              Durée (jours)
              <Input
                name="days"
                inputMode="numeric"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="w-32"
                aria-invalid={formError?.includes("durée") || undefined}
              />
            </label>
          )}
          <label className="flex flex-col gap-1 text-[12px] font-medium text-on-surface-variant">
            {reasonRequired(target.kind, effectiveTier) ? "Motif (obligatoire)" : "Motif (facultatif)"}
            <textarea
              name="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={MAX_REASON_LENGTH}
              rows={3}
              className="rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </label>
          {(formError || serverError) && (
            <p role="alert" className="text-[13px] text-error">
              {formError ?? serverError}
            </p>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
              Annuler
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Envoi…" : `Confirmer : ${ACTION_LABEL[target.kind].toLowerCase()}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

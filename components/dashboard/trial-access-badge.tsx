import { Badge } from "@/components/ui/badge";
import { isTrialOnly, trialState, trialText, type SellerAccessFields } from "@/lib/seller-access";

/**
 * "Essai offert" label for a seller's admin-granted trial. `stand-alone` is the
 * seller whose only access is the trial: the badge replaces the store label that
 * would otherwise read "Gratuit" / "Aucun". With a store subscription the store
 * label stays and the trial is a muted note; ended and revoked trials are notes too.
 */
export function TrialNote({ seller, now }: { seller: SellerAccessFields; now?: Date }) {
  const state = trialState(seller, now);
  if (!state || (state.kind === "running" && isTrialOnly(seller))) return null;
  return <div className="mt-0.5 text-[11px] leading-snug text-on-surface-variant">{trialText(state)}</div>;
}

/** The "Essai offert" badge for a trial-only seller (null otherwise). */
export function TrialOnlyBadge({ seller, now }: { seller: SellerAccessFields; now?: Date }) {
  const state = trialState(seller, now);
  if (!state || state.kind !== "running" || !isTrialOnly(seller)) return null;
  return (
    <div>
      <Badge variant={state.premium ? "success" : "info"}>{state.premium ? "Premium offert" : "Essai offert"}</Badge>
      <div className="mt-0.5 text-[11px] leading-snug text-on-surface-variant">{trialText(state)}</div>
    </div>
  );
}

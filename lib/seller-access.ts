/**
 * Platform access of a seller as the admin lists report it (incacook-server
 * `GET /admin/sellers` and `/admin/subscriptions`): the store subscription or an
 * admin-granted free trial, by the same `sellerAccess` rule the API enforces.
 *
 * The trial fields are optional here on purpose: an older server does not send
 * them, and then nothing about trials is shown (today's labels stay as they are).
 */
export interface SellerAccessFields {
  access?: {
    active: boolean;
    source: "store" | "platform_trial" | null;
    endsAt: string | null;
  };
  /** The admin-granted trial on its own (null when none was ever granted). */
  platformTrialEndsAt?: string | null;
  platformTrialRevokedAt?: string | null;
}

export type TrialState =
  | { kind: "running"; date: string }
  | { kind: "ended"; date: string }
  | { kind: "revoked"; date: string };

/** Dates are French calendar dates in Paris time, like the sellers' own notifications. */
export function formatTrialDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * The state of the seller's platform trial, independent of any store subscription
 * (a seller can have both): running, ended, revoked, or null when none was granted.
 * A revoked trial reports the revocation date, never its original end.
 */
export function trialState(f: SellerAccessFields, now: Date = new Date()): TrialState | null {
  const ends = f.platformTrialEndsAt;
  if (!ends) return null;
  if (f.platformTrialRevokedAt) return { kind: "revoked", date: f.platformTrialRevokedAt };
  // The server's own verdict wins over this browser's clock: when it reports the trial as the active
  // source, it is running, so the badge and the note never contradict the response near expiry.
  if (f.access?.active === true && f.access.source === "platform_trial") return { kind: "running", date: ends };
  return new Date(ends).getTime() > now.getTime()
    ? { kind: "running", date: ends }
    : { kind: "ended", date: ends };
}

/** True when the trial is the only thing granting access (the store label would say "free"/"none"). */
export function isTrialOnly(f: SellerAccessFields): boolean {
  return f.access?.source === "platform_trial";
}

/** French sentence for a trial state, e.g. "Essai offert jusqu’au 03/01/2027". */
export function trialText(state: TrialState): string {
  const d = formatTrialDate(state.date);
  switch (state.kind) {
    case "running":
      return `Essai offert jusqu’au ${d}`;
    case "ended":
      return `Essai terminé le ${d}`;
    case "revoked":
      return `Essai révoqué le ${d}`;
  }
}

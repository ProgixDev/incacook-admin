/**
 * How the free-trial length is worded, one rule shared with the server and the app: a multiple of
 * 30 days reads in months (60 -> "2 mois"), anything else in days (45 -> "45 jours"). The allowed
 * range starts at 7 days, so a singular "jour" never occurs.
 */
export function trialOfferLabel(days: number): string {
  const months = days % 30 === 0 ? days / 30 : null;
  return months !== null ? `${months} mois` : `${days} jours`;
}

/** « 2 mois offerts », « 1 mois offert », « 45 jours offerts »: what a seller reads. */
export function trialOfferPhrase(days: number): string {
  const months = days % 30 === 0 ? days / 30 : null;
  const n = months ?? days;
  const unit = months !== null ? "mois" : "jours";
  return `${n} ${unit} ${n > 1 ? "offerts" : "offert"}`;
}

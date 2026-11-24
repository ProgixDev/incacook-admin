/**
 * Dates on this page are French calendar dates in Paris time, like the sellers'
 * notifications ("jusqu'au 3 février"): an admin's browser timezone must not move
 * an end date near midnight to the neighbouring day.
 */
export function formatDateParis(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

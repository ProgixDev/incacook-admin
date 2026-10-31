/**
 * Date-range rules for the platform earnings report. Days are UTC calendar
 * days, both bounds inclusive, at most 92 days — the same rules the server
 * enforces, checked here so an invalid range never produces a request.
 */

export const MAX_RANGE_DAYS = 92;
export const DEFAULT_RANGE_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

export interface DayRange {
  from: string;
  to: string;
}

/** Strict `YYYY-MM-DD` → UTC midnight, or null (rejects `2026-02-31`). */
function parseUtcDay(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value) return null;
  return d.getTime();
}

function toUtcDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** The last `days` UTC days ending on today (UTC), inclusive. */
export function defaultRange(now: Date = new Date(), days = DEFAULT_RANGE_DAYS): DayRange {
  const today = parseUtcDay(now.toISOString().slice(0, 10)) as number;
  return { from: toUtcDay(today - (days - 1) * DAY_MS), to: toUtcDay(today) };
}

/** A French error message when the range must be rejected, else `null`. */
export function validateRange(from: string, to: string): string | null {
  const start = parseUtcDay(from);
  const end = parseUtcDay(to);
  if (start === null || end === null) {
    return "Renseignez une date de début et une date de fin valides.";
  }
  if (end < start) {
    return "La date de fin ne peut pas précéder la date de début.";
  }
  const days = Math.round((end - start) / DAY_MS) + 1;
  if (days > MAX_RANGE_DAYS) {
    return `La période ne peut pas dépasser ${MAX_RANGE_DAYS} jours (${days} jours sélectionnés).`;
  }
  return null;
}

/**
 * Validates a draft range and hands it to `apply` only when valid. Returns the
 * rejection message (and does not call `apply`) otherwise.
 */
export function tryApplyRange(
  from: string,
  to: string,
  apply: (range: DayRange) => void,
): string | null {
  const error = validateRange(from, to);
  if (error) return error;
  apply({ from, to });
  return null;
}

/** `2026-10-01` → `01/10/2026`, without any timezone conversion. */
export function formatUtcDay(day: string): string {
  const [y, m, d] = day.split("-");
  return `${d}/${m}/${y}`;
}

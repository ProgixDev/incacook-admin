/** `GET|PATCH /v1/admin/settings/seller-trial`. */
export interface SellerTrialSettings {
  autoRequest: boolean;
  /** null: the stored length is invalid, the admin must set a new one. */
  days: number | null;
  minDays: number;
  maxDays: number;
  updatedAt: string | null;
  updatedById: string | null;
}

/** An integer number of days inside the server's bounds, or null. */
export function parseTrialDays(input: string, min: number, max: number): number | null {
  const t = input.trim();
  if (!/^\d+$/.test(t)) return null;
  const n = Number(t);
  return n >= min && n <= max ? n : null;
}

/** Only what changed is sent; nothing changed (or an invalid length) means nothing to save. */
export function trialSettingsChanges(
  saved: Pick<SellerTrialSettings, "autoRequest" | "days" | "minDays" | "maxDays">,
  form: { autoRequest: boolean; days: string },
): { autoRequest?: boolean; days?: number } | null {
  const changes: { autoRequest?: boolean; days?: number } = {};
  if (form.autoRequest !== saved.autoRequest) changes.autoRequest = form.autoRequest;
  const typed = form.days.trim();
  if (typed === "" && saved.days === null) {
    // The stored length is invalid and untouched: the switch can still be saved on its own.
  } else {
    const days = parseTrialDays(form.days, saved.minDays, saved.maxDays);
    if (days === null) return null; // an invalid or empty length blocks the save
    if (days !== saved.days) changes.days = days;
  }
  return Object.keys(changes).length > 0 ? changes : null;
}

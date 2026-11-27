/** `GET|PATCH /v1/admin/settings/seller-trial`. */
export interface SellerTrialSettings {
  autoRequest: boolean;
  days: number;
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
  const days = parseTrialDays(form.days, saved.minDays, saved.maxDays);
  if (days === null) return null;
  const changes: { autoRequest?: boolean; days?: number } = {};
  if (form.autoRequest !== saved.autoRequest) changes.autoRequest = form.autoRequest;
  if (days !== saved.days) changes.days = days;
  return Object.keys(changes).length > 0 ? changes : null;
}

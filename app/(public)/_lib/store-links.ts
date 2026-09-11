/**
 * App store destination URLs for the landing page's `<StoreCta />`.
 *
 * **DELIBERATELY EMPTY.** The app isn't accepted on either store yet — there
 * is nothing to link to. `<StoreCta />` treats an empty string as "not live"
 * and renders an honest "coming soon" state instead of a link, per the
 * plan's rule that a badge must never link nowhere. TASK-028 fills each one
 * in as its listing goes live — the two platforms don't have to land
 * together.
 */
export const STORE_LINKS = {
  ios: "",
  android: "",
} as const;

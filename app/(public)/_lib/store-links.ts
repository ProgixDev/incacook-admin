/**
 * App store destination URLs for the landing page's `<StoreCta />`.
 *
 * **PLACEHOLDER VALUES.** Neither listing is live yet — TASK-028 swaps these
 * for the real App Store / Google Play URLs once both listings are
 * published. Do not ship a real launch with these still in place (see
 * TASK-027's CTA policy: a badge must never link nowhere).
 */
export const STORE_LINKS = {
  ios: "#store-ios-placeholder", // TODO(TASK-028): replace with the real App Store listing URL.
  android: "#store-android-placeholder", // TODO(TASK-028): replace with the real Google Play listing URL.
} as const;

/**
 * App store destination URLs for the landing page's `<StoreCta />`.
 *
 * Both listings are live. `<StoreCta />` still treats an empty string as
 * "not live" and falls back to an honest "coming soon" state, so a badge
 * never links nowhere if one of these is ever cleared.
 */
export const STORE_LINKS = {
  ios: "https://apps.apple.com/us/app/incacook/id6783878120",
  android: "https://play.google.com/store/apps/details?id=com.incacook.app",
} as const;

/** Public social profiles shown in the site footer. */
export const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/inca.cook/",
} as const;

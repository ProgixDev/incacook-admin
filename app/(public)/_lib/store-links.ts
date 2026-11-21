/**
 * App store destination URLs for the landing page's `<StoreCta />`.
 *
 * An empty string means "not live": `<StoreCta />` then renders an honest
 * "coming soon" state, because a badge must never link nowhere.
 */
export const STORE_LINKS: Record<"ios" | "android", string> = {
  ios: "https://apps.apple.com/fr/app/incacook/id6783878120",
  android: "https://play.google.com/store/apps/details?id=com.incacook.app",
};

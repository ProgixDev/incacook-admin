import { Fraunces, Inter } from "next/font/google";

/**
 * Site-wide font loading via `next/font/google` (self-hosted, no render-blocking
 * `<link>`/`@import`). Both fonts are exposed as CSS variables consumed by
 * `tailwind.config.ts` (`fontFamily.sans` / `fontFamily.display`).
 *
 * `inter` replaces the old `@import url("https://rsms.me/inter/inter.css")` in
 * `app/globals.css` — same face, admin-wide, not landing-page-only.
 *
 * `fraunces` is marketing-only: the landing page's h1/h2 display face
 * (TASK-026/TASK-027 decision). Nothing outside `app/(public)/` should use it.
 */
export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["500", "600", "700"],
  display: "swap",
});

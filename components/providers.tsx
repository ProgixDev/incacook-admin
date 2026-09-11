"use client";

import { ThemeProvider } from "next-themes";

/**
 * Root providers — mounted for every route, public and authenticated alike.
 * `AuthProvider` is NOT here: it lives in `app/(dashboard)/layout.tsx` so it
 * only mounts (and attempts a token refresh) for the authenticated dashboard
 * tree, not for anonymous visitors on the public pages.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      {children}
    </ThemeProvider>
  );
}

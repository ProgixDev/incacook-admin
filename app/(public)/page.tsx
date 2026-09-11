import type { Metadata } from "next";

import { SiteFooter } from "./_components/site-footer";
import { SiteHeader } from "./_components/site-header";

export const metadata: Metadata = {
  title: "IncaCook",
  description: "IncaCook — la marketplace de plats faits maison.",
};

/**
 * Placeholder landing page. Real marketing content lands in TASK-027 — this
 * is just enough to prove the public shell (header + footer, no auth gate)
 * works end to end.
 */
export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-24 text-center sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
          IncaCook — landing page content coming in TASK-027
        </h1>
      </main>
      <SiteFooter />
    </>
  );
}

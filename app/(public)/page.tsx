import type { Metadata } from "next";

import { Faq } from "./_components/faq";
import { Hero } from "./_components/hero";
import { HowItWorks } from "./_components/how-it-works";
import { MissionStrip } from "./_components/mission-strip";
import { Offerings } from "./_components/offerings";
import { SellerDriver } from "./_components/seller-driver";
import { SiteFooter } from "./_components/site-footer";
import { SiteHeader } from "./_components/site-header";
import { Trust } from "./_components/trust";

export const metadata: Metadata = {
  title: "IncaCook — plats faits maison près de chez vous",
  description:
    "Commandez des plats faits maison à prix juste auprès de voisins, traiteurs et restaurants près de chez vous. Retrait ou livraison, paiement sécurisé.",
};

/**
 * IncaCook landing page (TASK-027).
 *
 * NOTE — all copy on this page is a DRAFT pending client sign-off
 * (TASK-028). Brand names (Le Bon Fait Maison / L'Atelier Traiteur / Sauve
 * Ton Panier), the €4,50 fait-maison cap and every compliance fact are drawn
 * from the PRD, but wording is not final. Store URLs and imagery are
 * clearly-labelled placeholders — see `_lib/store-links.ts` and the
 * placeholder blocks in `_components/hero.tsx`.
 *
 * Every section below is a server component; `Faq` uses native
 * `<details>`/`<summary>` so it needs no client JS either.
 */
export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <MissionStrip />
        <HowItWorks />
        <Offerings />
        <Trust />
        <SellerDriver />
        <Faq />
      </main>
      <SiteFooter />
    </>
  );
}

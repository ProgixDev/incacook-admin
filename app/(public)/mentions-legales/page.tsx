import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LegalPageShell } from "../_components/legal-page-shell";
import { isLegalNoticeComplete, LEGAL_NOTICE } from "../_lib/legal-notice";

export const metadata: Metadata = {
  title: "Mentions légales · IncaCook",
  description: "Mentions légales du site et de l'application IncaCook.",
};

export default function LegalNoticePage() {
  if (!isLegalNoticeComplete()) notFound();

  const { host } = LEGAL_NOTICE;

  return (
    <LegalPageShell currentPath="/mentions-legales">
      <article className="space-y-8">
        <header className="space-y-3">
          <p className="text-sm font-medium text-primary">Informations légales</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Mentions légales</h1>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Éditeur</h2>
          <ul className="space-y-2 leading-7 text-on-surface-variant">
            <li>Dénomination : {LEGAL_NOTICE.publisher}</li>
            <li>Forme juridique : {LEGAL_NOTICE.legalForm}</li>
            <li>Immatriculation : {LEGAL_NOTICE.registration}</li>
            <li>Siège social : {LEGAL_NOTICE.headOffice}</li>
            <li>Téléphone : {LEGAL_NOTICE.phone}</li>
            <li>
              E-mail :{" "}
              <a className="text-primary underline underline-offset-2" href={`mailto:${LEGAL_NOTICE.email}`}>
                {LEGAL_NOTICE.email}
              </a>
            </li>
            <li>Directeur de la publication : {LEGAL_NOTICE.publicationDirector}</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Hébergeur</h2>
          <ul className="space-y-2 leading-7 text-on-surface-variant">
            <li>{host.name}</li>
            <li>{host.address}</li>
            <li>
              <a className="text-primary underline underline-offset-2" href={host.website}>
                {host.website.replace("https://", "")}
              </a>
            </li>
          </ul>
        </section>
      </article>
    </LegalPageShell>
  );
}

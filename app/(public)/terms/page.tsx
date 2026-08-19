import type { Metadata } from "next";

import { API_BASE_URL } from "@/lib/api/client";

import { LegalPageShell } from "../_components/legal-page-shell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Conditions d'utilisation · IncaCook",
  description: "Conditions générales d'utilisation et de vente IncaCook.",
};

type LegalDocument = {
  id: string;
  kind: "CGU" | "CGV";
  version: string;
  title: string;
  content: string;
  publishedAt: string | null;
};

type LegalDocumentsResponse = {
  success?: boolean;
  data?: LegalDocument[];
};

async function getActiveLegalDocuments(): Promise<LegalDocument[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/legal-documents/active`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as LegalDocumentsResponse;
    if (!payload.success || !Array.isArray(payload.data)) return [];
    return payload.data.filter((document) => document.kind === "CGU" || document.kind === "CGV");
  } catch {
    return [];
  }
}

export default async function TermsPage() {
  const documents = await getActiveLegalDocuments();

  return (
    <LegalPageShell currentPath="/terms">
      <article className="space-y-8">
        <header className="space-y-3">
          <p className="text-sm font-medium text-primary">Informations légales</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Conditions générales
          </h1>
          <p className="leading-7 text-on-surface-variant">
            Cette page affiche les versions actuellement publiées des Conditions générales
            d&apos;utilisation (CGU) et des Conditions générales de vente (CGV) d&apos;IncaCook.
          </p>
        </header>

        {documents.length > 0 ? (
          documents.map((document) => (
            <section key={document.id} className="space-y-4 rounded-2xl border border-outline-variant bg-surface p-5 sm:p-7">
              <header className="space-y-1 border-b border-outline-variant pb-4">
                <p className="text-sm font-medium text-primary">{document.kind} · Version {document.version}</p>
                <h2 className="text-2xl font-semibold">{document.title}</h2>
                {document.publishedAt && (
                  <p className="text-sm text-on-surface-variant">
                    Publiée le {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(document.publishedAt))}
                  </p>
                )}
              </header>
              <div className="whitespace-pre-wrap leading-7 text-on-surface-variant">{document.content}</div>
            </section>
          ))
        ) : (
          <section className="rounded-2xl border border-warning/40 bg-warning/10 p-5 text-on-surface">
            <h2 className="font-semibold">Conditions en cours de publication</h2>
            <p className="mt-2 leading-7 text-on-surface-variant">
              Les conditions ne sont pas disponibles temporairement. Contactez-nous à{" "}
              <a className="text-primary underline underline-offset-2" href="mailto:tasseltess@gmail.com">
                tasseltess@gmail.com
              </a>
              .
            </p>
          </section>
        )}
      </article>
    </LegalPageShell>
  );
}

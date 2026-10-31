/** Kinds shown on the public `/terms` page. The courier contract is shown during courier signup, never here. */
export type PublicTermsKind = "CGU" | "CGV";

export type PublicTermsDocument = {
  id: string;
  kind: PublicTermsKind;
  version: string;
  title: string;
  content: string;
  publishedAt: string | null;
};

/** Keeps only CGU/CGV rows; any other kind in the response is ignored. */
export function publicTermsDocuments(
  documents: Array<Omit<PublicTermsDocument, "kind"> & { kind: string }>,
): PublicTermsDocument[] {
  return documents.filter(
    (document): document is PublicTermsDocument =>
      document.kind === "CGU" || document.kind === "CGV",
  );
}

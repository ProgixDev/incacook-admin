/**
 * Local wire types for the legal-documents management surface, mirroring the
 * backend `LegalDocumentView` returned by IncaCook-Server
 * (`src/modules/compliance/legal-documents/legal-documents.service.ts`) as it is
 * exposed by:
 *   - `GET  /v1/admin/legal-documents`         (bare array — all managed docs)
 *   - `GET  /v1/admin/legal-documents/active`  (bare array — active per kind)
 *   - `POST /v1/admin/legal-documents`         (create a draft, inactive)
 *   - `PATCH /v1/admin/legal-documents/:id`    (edit version/title/content)
 *   - `POST /v1/admin/legal-documents/:id/publish` (flip the active version)
 *
 * Kept in `_components` so this page owns its contract without importing from
 * `lib/**`. Dates arrive as ISO strings (JSON-serialized `Date`).
 */

/**
 * Document kind. The backend `CharterKind` enum has more values
 * (HYGIENE/FAIT_MAISON/…) but only these three are managed by this feature:
 * the customer CGU/CGV and the courier contract (`DRIVER_CONTRACT`, shown in
 * full during courier signup — never on the public `/terms` page).
 */
export type LegalKind = "CGU" | "CGV" | "DRIVER_CONTRACT";

/** A legal document row (list and active share the same `LegalDocumentView`). */
export interface LegalDocument {
  id: string;
  kind: LegalKind | string;
  version: string;
  title: string;
  content: string;
  isActive: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Body for `POST /v1/admin/legal-documents` (create a draft). */
export interface CreateLegalDocumentInput {
  kind: LegalKind;
  version: string;
  title: string;
  content: string;
}

/** Body for `PATCH /v1/admin/legal-documents/:id` (all fields optional). */
export interface UpdateLegalDocumentInput {
  version?: string;
  title?: string;
  content?: string;
}

/** Field length limits mirrored from the server DTOs (class-validator). */
export const FIELD_LIMITS = {
  version: 20,
  title: 200,
  content: 100_000,
} as const;

export const KIND_LABEL: Record<LegalKind, string> = {
  CGU: "CGU — Conditions générales d'utilisation",
  CGV: "CGV — Conditions générales de vente",
  DRIVER_CONTRACT: "Contrat livreur — Contrat de prestation des livreurs",
};

/** Short label for badges/columns. */
export const KIND_SHORT: Record<LegalKind, string> = {
  CGU: "CGU",
  CGV: "CGV",
  DRIVER_CONTRACT: "Contrat livreur",
};

/** The kinds a document can be created as. */
export const LEGAL_KINDS: LegalKind[] = ["CGU", "CGV", "DRIVER_CONTRACT"];

export function kindLabel(kind: string): string {
  return KIND_LABEL[kind as LegalKind] ?? kind;
}

export function kindShort(kind: string): string {
  return KIND_SHORT[kind as LegalKind] ?? kind;
}

export function isLegalKind(kind: string): kind is LegalKind {
  return (LEGAL_KINDS as string[]).includes(kind);
}

export type DocumentState = "draft" | "active" | "superseded";

/**
 * Lifecycle of a row: `draft` (never published), `active` (the live version
 * for its kind) or `superseded` (published once, no longer active).
 */
export function documentState(d: LegalDocument): DocumentState {
  if (d.isActive) return "active";
  return d.publishedAt ? "superseded" : "draft";
}

/**
 * Published versions (active or superseded) are read-only in the editor; a
 * correction goes through a new draft/version. The server stays the authority
 * for immutability — this only keeps the UI from offering the edit.
 */
export function isReadOnly(d: LegalDocument): boolean {
  return documentState(d) !== "draft";
}

/** Initial values for a new draft. */
export interface DraftSeed {
  kind: LegalKind;
  version: string;
  title: string;
  content: string;
}

/**
 * Seed for a correction draft based on an existing document. The version is
 * left blank so a published version number is never reused. Returns null for a
 * kind this editor does not manage.
 */
export function newDraftSeed(d: LegalDocument): DraftSeed | null {
  if (!isLegalKind(d.kind)) return null;
  return { kind: d.kind, version: "", title: d.title, content: d.content };
}

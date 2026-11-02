"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  CopyPlus,
  ExternalLink,
  Eye,
  FileUp,
  Pencil,
} from "lucide-react";
import { post, patch, put } from "@/lib/api";
import { useAdminMutation } from "@/lib/query";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  Drawer,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTimeFr } from "@/lib/utils";
import { ReadOnlyBadge, StateBadge } from "./state-badge";
import {
  FIELD_LIMITS,
  LEGAL_KINDS,
  isLegalKind,
  isReadOnly,
  kindLabel,
  kindShort,
  newDraftSeed,
  pdfFileError,
  type CreateLegalDocumentInput,
  type DraftSeed,
  type LegalDocument,
  type LegalKind,
  type UpdateLegalDocumentInput,
} from "./types";

type Mode = "create" | "edit" | null;

interface Props {
  mode: Mode;
  /** The document being edited (null in create mode). */
  document: LegalDocument | null;
  /** Prefill for create mode (a correction draft started from a published version). */
  seed?: DraftSeed | null;
  onClose: () => void;
  /** Fired after a successful create/edit/publish so the list can refetch. */
  onSaved: () => void;
  /** Start a new draft from a published (read-only) version. */
  onNewDraftFrom?: (seed: DraftSeed) => void;
}

export function LegalDocumentDrawer({
  mode,
  document,
  seed = null,
  onClose,
  onSaved,
  onNewDraftFrom,
}: Props) {
  const open = mode != null;
  const isCreate = mode === "create";
  // Published versions (active or superseded) are never edited in place.
  const readOnly = !isCreate && document != null && isReadOnly(document);
  const correctionSeed = readOnly && document ? newDraftSeed(document) : null;

  const [kind, setKind] = useState<LegalKind>("CGU");
  const [version, setVersion] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [preview, setPreview] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [pdf, setPdf] = useState<File | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  function pickPdf(file: File | null) {
    setPdf(null);
    setPdfError(null);
    if (!file) return;
    const err = pdfFileError(file);
    if (err) setPdfError(err);
    else setPdf(file);
  }

  const createPdf = useAdminMutation<LegalDocument, FormData>((form, opts) =>
    post("/admin/legal-documents/pdf", form, opts),
  );
  const replacePdf = useAdminMutation<
    LegalDocument,
    { id: string; form: FormData }
  >(({ id, form }, opts) =>
    put(`/admin/legal-documents/${id}/pdf`, form, opts),
  );

  const create = useAdminMutation<LegalDocument, CreateLegalDocumentInput>(
    (payload, opts) => post("/admin/legal-documents", payload, opts),
  );
  const update = useAdminMutation<
    LegalDocument,
    { id: string; payload: UpdateLegalDocumentInput }
  >(({ id, payload }, opts) =>
    patch(`/admin/legal-documents/${id}`, payload, opts),
  );
  const publish = useAdminMutation<LegalDocument, string>((id, opts) =>
    post(`/admin/legal-documents/${id}/publish`, undefined, opts),
  );

  // Reset the form whenever the drawer targets a new document (or opens blank).
  useEffect(() => {
    setPreview(false);
    setConfirmPublish(false);
    setPdf(null);
    setPdfError(null);
    createPdf.reset();
    replacePdf.reset();
    create.reset();
    update.reset();
    publish.reset();
    if (mode === "edit" && document) {
      setKind(isLegalKind(document.kind) ? document.kind : "CGU");
      setVersion(document.version);
      setTitle(document.title);
      setContent(document.content);
    } else {
      setKind(seed?.kind ?? "CGU");
      setVersion(seed?.version ?? "");
      setTitle(seed?.title ?? "");
      setContent(seed?.content ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, document?.id, seed]);

  // A version is PDF-based when it already has a file, or when a new draft is
  // created (new drafts are PDF-only). Legacy text drafts keep the text editor.
  const isPdfDoc = isCreate || Boolean(document?.fileUrl);
  const saveError =
    (isCreate
      ? (createPdf.error ?? create.error)
      : (update.error ?? replacePdf.error)) ?? null;
  const saving =
    createPdf.isPending ||
    create.isPending ||
    update.isPending ||
    replacePdf.isPending;

  const trimmedVersion = version.trim();
  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();
  const canSave =
    trimmedVersion.length > 0 &&
    trimmedTitle.length > 0 &&
    (isPdfDoc ? (isCreate ? pdf !== null : true) : trimmedContent.length > 0);

  async function save() {
    if (!canSave || readOnly) return;
    try {
      if (isCreate) {
        const form = new FormData();
        form.append("kind", kind);
        form.append("version", trimmedVersion);
        form.append("title", trimmedTitle);
        if (pdf) form.append("file", pdf);
        await createPdf.mutate(form);
      } else if (document) {
        await update.mutate({
          id: document.id,
          payload: isPdfDoc
            ? { version: trimmedVersion, title: trimmedTitle }
            : {
                version: trimmedVersion,
                title: trimmedTitle,
                content: trimmedContent,
              },
        });
        if (pdf) {
          const form = new FormData();
          form.append("file", pdf);
          await replacePdf.mutate({ id: document.id, form });
        }
      }
      onSaved();
    } catch {
      // surfaced via saveError below
    }
  }

  async function doPublish() {
    if (!document) return;
    try {
      await publish.mutate(document.id);
      onSaved();
    } catch {
      // surfaced via publish.error in the confirm dialog
    }
  }

  return (
    <>
      <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
        <div className="flex flex-col gap-4 p-6">
          <div className="flex flex-wrap items-center gap-2 pr-8">
            <DialogTitle>
              {isCreate
                ? "Nouveau document légal"
                : readOnly
                  ? "Version publiée"
                  : "Modifier le document"}
            </DialogTitle>
            {!isCreate && document && (
              <>
                <StateBadge document={document} />
                {readOnly && <ReadOnlyBadge />}
              </>
            )}
          </div>

          {readOnly && (
            <p className="rounded-md border border-outline-variant bg-surface-container-low p-3 text-[12px] text-on-surface-variant">
              Une version publiée n&apos;est jamais modifiée. Pour la corriger,
              préparez un nouveau brouillon avec un nouveau numéro de version.
            </p>
          )}

          {/* Kind — selectable on create, fixed (immutable) on edit. */}
          <Field label="Type de document">
            {isCreate ? (
              <Select
                value={kind}
                onValueChange={(v) => setKind(v as LegalKind)}
              >
                <SelectTrigger aria-label="Type de document">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEGAL_KINDS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {kindLabel(k)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{kindShort(kind)}</Badge>
                <span className="text-[12px] text-on-surface-variant">
                  {kindLabel(kind)} · type non modifiable
                </span>
              </div>
            )}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Version">
              <Input
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                readOnly={readOnly}
                maxLength={FIELD_LIMITS.version}
                placeholder="ex. 1.0.0"
              />
            </Field>
            <Field label="Titre">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                readOnly={readOnly}
                maxLength={FIELD_LIMITS.title}
                placeholder="Titre affiché"
              />
            </Field>
          </div>

          {isPdfDoc ? (
            <Field label="Document PDF">
              <div className="space-y-2">
                {document?.fileUrl && (
                  <div className="space-y-2">
                    <iframe
                      src={document.fileUrl}
                      title={`PDF ${document.title}`}
                      className="h-72 w-full rounded-md border border-outline-variant bg-surface-container-low"
                    />
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-on-surface-variant">
                      <a
                        href={document.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" /> Ouvrir le PDF
                      </a>
                      {document.fileSize ? (
                        <span>{(document.fileSize / 1024).toFixed(0)} Ko</span>
                      ) : null}
                      {document.fileSha256 && (
                        <span className="font-mono" title={document.fileSha256}>
                          SHA-256 {document.fileSha256.slice(0, 12)}…
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {!readOnly && (
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-outline-variant bg-surface-container-low px-3 py-3 text-[12px] text-on-surface hover:bg-surface-container">
                    <FileUp className="h-4 w-4 shrink-0" />
                    <span className="min-w-0 truncate">
                      {pdf
                        ? pdf.name
                        : document?.fileUrl
                          ? "Remplacer le PDF (facultatif)"
                          : "Choisir un fichier PDF (10 Mo max)"}
                    </span>
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      className="sr-only"
                      onChange={(e) => pickPdf(e.target.files?.[0] ?? null)}
                    />
                  </label>
                )}
                {pdfError && (
                  <p className="text-[12px] text-error">{pdfError}</p>
                )}
              </div>
            </Field>
          ) : (
            <Field
              label="Contenu"
              action={
                <button
                  type="button"
                  onClick={() => setPreview((p) => !p)}
                  className="inline-flex items-center gap-1 text-[11px] text-on-surface-variant hover:text-on-surface"
                >
                  {preview ? (
                    <>
                      <Pencil className="h-3 w-3" /> Éditer
                    </>
                  ) : (
                    <>
                      <Eye className="h-3 w-3" /> Aperçu
                    </>
                  )}
                </button>
              }
            >
              {preview ? (
                <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-md border border-outline-variant bg-surface-container-low p-3 text-[12px] text-on-surface">
                  {content || "— (vide) —"}
                </pre>
              ) : (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  readOnly={readOnly}
                  rows={12}
                  maxLength={FIELD_LIMITS.content}
                  placeholder="Corps du document (Markdown ou texte brut)…"
                  className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 font-mono text-[12px] text-on-surface placeholder:text-on-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              )}
              <p className="mt-1 text-right text-[10.5px] text-on-surface-variant tabular-nums">
                {content.length.toLocaleString("fr-FR")} /{" "}
                {FIELD_LIMITS.content.toLocaleString("fr-FR")}
              </p>
            </Field>
          )}

          {!isCreate && document && (
            <div className="grid gap-1.5 rounded-md border border-outline-variant bg-surface-container-low p-3 text-[12px] text-on-surface-variant">
              <MetaRow
                label="Créé le"
                value={formatDateTimeFr(document.createdAt)}
              />
              <MetaRow
                label="Modifié le"
                value={formatDateTimeFr(document.updatedAt)}
              />
              <MetaRow
                label="Publié le"
                value={
                  document.publishedAt
                    ? formatDateTimeFr(document.publishedAt)
                    : "Jamais"
                }
              />
            </div>
          )}

          {saveError && (
            <p className="text-[12px] text-error">{saveError.message}</p>
          )}

          <Separator />

          <div className="flex flex-wrap items-center justify-between gap-2">
            {!isCreate && document && (
              <Button
                variant="default"
                disabled={document.isActive || saving || publish.isPending}
                onClick={() => {
                  publish.reset();
                  setConfirmPublish(true);
                }}
                title={
                  document.isActive
                    ? "Cette version est déjà active."
                    : undefined
                }
              >
                <CheckCircle2 className="h-4 w-4" />
                Publier cette version
              </Button>
            )}
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" onClick={onClose} disabled={saving}>
                {readOnly ? "Fermer" : "Annuler"}
              </Button>
              {readOnly ? (
                correctionSeed &&
                onNewDraftFrom && (
                  <Button
                    variant="default"
                    onClick={() => onNewDraftFrom(correctionSeed)}
                  >
                    <CopyPlus className="h-4 w-4" />
                    Nouveau brouillon à partir de cette version
                  </Button>
                )
              ) : (
                <Button
                  variant="default"
                  onClick={save}
                  disabled={!canSave || saving}
                >
                  {saving
                    ? "Enregistrement…"
                    : isCreate
                      ? "Créer le brouillon"
                      : "Enregistrer"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Drawer>

      {/* Confirm publish — flips the active version for this kind + notifies users. */}
      <Dialog
        open={confirmPublish}
        onOpenChange={(o) => {
          if (!o && !publish.isPending) setConfirmPublish(false);
        }}
      >
        <DialogContent>
          {document && (
            <div className="flex flex-col gap-4">
              <div className="space-y-1.5">
                <DialogTitle>Publier cette version ?</DialogTitle>
                <DialogDescription>
                  {kindShort(document.kind)} · version {document.version}{" "}
                  deviendra la version active. Toute autre version{" "}
                  {kindShort(document.kind)} active sera désactivée
                  {document.kind === "DRIVER_CONTRACT"
                    ? ". Le contrat est présenté en intégralité lors de l'inscription des livreurs ; une version publiée ne pourra plus être modifiée."
                    : " et tous les utilisateurs seront notifiés."}
                </DialogDescription>
              </div>

              {publish.error && (
                <p className="text-[12px] text-error">
                  {publish.error.message}
                </p>
              )}

              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setConfirmPublish(false)}
                  disabled={publish.isPending}
                >
                  Annuler
                </Button>
                <Button
                  variant="default"
                  onClick={doPublish}
                  disabled={publish.isPending}
                >
                  {publish.isPending ? "Publication…" : "Publier"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Field({
  label,
  action,
  children,
}: {
  label: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-medium uppercase tracking-wider text-on-surface-variant">
          {label}
        </label>
        {action}
      </div>
      {children}
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-3.5 w-3.5 shrink-0" />
      <span className="w-24 shrink-0">{label}</span>
      <span className="min-w-0 truncate text-on-surface">{value}</span>
    </div>
  );
}

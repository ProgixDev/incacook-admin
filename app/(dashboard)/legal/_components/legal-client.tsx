"use client";

import { useState } from "react";
import { FileText, Plus, CheckCircle2 } from "lucide-react";
import { useAdminQuery } from "@/lib/query";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTimeFr } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LegalDocumentDrawer } from "./legal-document-drawer";
import { StateBadge } from "./state-badge";
import {
  LEGAL_KINDS,
  isLegalKind,
  kindShort,
  kindLabel,
  type DraftSeed,
  type LegalDocument,
} from "./types";

const PAGE_SIZE = 20;
const ALL_KINDS = "ALL";

export function LegalClient() {
  // Drawer state: `creating` opens a blank draft form; `editing` opens an
  // existing document for edit + publish. Only one is active at a time.
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<LegalDocument | null>(null);
  // Prefill for a draft started from an existing (published) version.
  const [seed, setSeed] = useState<DraftSeed | null>(null);
  const [kindFilter, setKindFilter] = useState<string>(ALL_KINDS);

  // Both endpoints return a bare array (no pagination envelope), so paging is
  // client-side via the DataTable.
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useAdminQuery<LegalDocument[]>({ path: "/admin/legal-documents" });

  // The currently-active version per kind (≤ 1 per kind). Used for the summary
  // banner; the list rows carry their own `isActive` flag too.
  const activeQuery = useAdminQuery<LegalDocument[]>({
    path: "/admin/legal-documents/active",
  });

  const allRows = data ?? [];
  const rows =
    kindFilter === ALL_KINDS
      ? allRows
      : allRows.filter((d) => d.kind === kindFilter);
  // Only the managed kinds are summarised; any other kind in the response is ignored.
  const activeByKind = new Map(
    (activeQuery.data ?? [])
      .filter((d) => isLegalKind(d.kind))
      .map((d) => [d.kind, d]),
  );

  function closeDrawer() {
    setCreating(false);
    setEditing(null);
    setSeed(null);
  }

  function startDraftFrom(next: DraftSeed) {
    setEditing(null);
    setSeed(next);
    setCreating(true);
  }

  function onSaved() {
    closeDrawer();
    refetch();
    activeQuery.refetch();
  }

  const cols: Column<LegalDocument>[] = [
    {
      key: "kind",
      header: "Type",
      width: "140px",
      cell: (d) => (
        <Badge variant="secondary" title={kindLabel(d.kind)}>
          {kindShort(d.kind)}
        </Badge>
      ),
    },
    {
      key: "version",
      header: "Version",
      width: "110px",
      cell: (d) => (
        <span className="font-mono text-[12px] text-on-surface">
          {d.version}
        </span>
      ),
    },
    {
      key: "title",
      header: "Titre",
      cell: (d) => (
        <span className="min-w-0 truncate text-[13px] text-on-surface">
          {d.title}
        </span>
      ),
    },
    {
      key: "status",
      header: "État",
      width: "130px",
      cell: (d) => <StateBadge document={d} />,
    },
    {
      key: "publishedAt",
      header: "Publiée le",
      width: "160px",
      cell: (d) => (
        <span className="text-[12px] text-on-surface-variant">
          {d.publishedAt ? formatDateTimeFr(d.publishedAt) : "—"}
        </span>
      ),
    },
  ];

  return (
    <>
      <div className="frost mb-4 flex flex-col gap-3 rounded-md p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 text-[13px] text-on-surface-variant">
            <FileText className="h-4 w-4" />
            Versions légales CGU / CGV / Contrat livreur
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {activeQuery.isLoading ? (
              <span className="text-[11px] text-on-surface-variant">
                Chargement des versions actives…
              </span>
            ) : (
              LEGAL_KINDS.map((k) => {
                const d = activeByKind.get(k);
                return d ? (
                  <Badge key={k} variant="success" title={kindLabel(k)}>
                    <CheckCircle2 className="h-3 w-3" />
                    {kindShort(k)} · {d.version}
                  </Badge>
                ) : (
                  <Badge key={k} variant="neutral" title={kindLabel(k)}>
                    {kindShort(k)} · aucune version active
                  </Badge>
                );
              })
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={kindFilter} onValueChange={setKindFilter}>
            <SelectTrigger aria-label="Filtrer par type" className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_KINDS}>Tous les types</SelectItem>
              {LEGAL_KINDS.map((k) => (
                <SelectItem key={k} value={k}>
                  {kindShort(k)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="default"
            onClick={() => {
              setSeed(null);
              setCreating(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Nouveau brouillon
          </Button>
        </div>
      </div>

      <DataTable
        columns={cols}
        rows={rows}
        rowKey={(d) => d.id}
        onRowClick={(d) => setEditing(d)}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        emptyLabel={
          kindFilter === ALL_KINDS
            ? "Aucun document légal. Créez un brouillon pour commencer."
            : "Aucun document pour ce type. Créez un brouillon pour commencer."
        }
        pageSize={PAGE_SIZE}
      />

      <LegalDocumentDrawer
        mode={creating ? "create" : editing ? "edit" : null}
        document={editing}
        seed={seed}
        onClose={closeDrawer}
        onSaved={onSaved}
        onNewDraftFrom={startDraftFrom}
      />
    </>
  );
}

"use client";

import { useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { useAdminQuery } from "@/lib/query";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTimeFr } from "@/lib/utils";
import {
  BOOST_STATUS_OPTIONS,
  BoostStatusBadge,
  sourceLabel,
  type AdminBoost,
  type AdminBoostsListResponse,
  type BoostStatusFilter,
} from "./boost-model";

const PAGE_SIZE = 20;
const ALL = "ALL";

export function BoostsClient() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<BoostStatusFilter | typeof ALL>(ALL);
  const [page, setPage] = useState(1);

  const { data, pagination, isLoading, isError, error, refetch } =
    useAdminQuery<AdminBoostsListResponse>({
      path: "/admin/boosts",
      params: {
        search,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        extra: status !== ALL ? { status } : undefined,
      },
    });

  const rows = data ?? [];

  const cols: Column<AdminBoost>[] = [
    {
      key: "seller",
      header: "Vendeur",
      cell: (b) => (
        <div className="min-w-0">
          <div className="truncate text-[13px] font-medium text-on-surface">{b.sellerName || "—"}</div>
          <div className="truncate text-[11px] text-on-surface-variant">{b.sellerEmail}</div>
        </div>
      ),
    },
    {
      key: "listing",
      header: "Annonce",
      cell: (b) => (
        <span className="inline-flex items-center gap-1.5 text-[13px] text-on-surface">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-warning" />
          <span className="truncate">{b.listingName || "—"}</span>
        </span>
      ),
    },
    {
      key: "source",
      header: "Source",
      cell: (b) => <span className="text-[12px] text-on-surface-variant">{sourceLabel(b.source)}</span>,
    },
    { key: "status", header: "Statut", cell: (b) => <BoostStatusBadge boost={b} /> },
    {
      key: "startsAt",
      header: "Début",
      cell: (b) => <span className="text-[12px] text-on-surface-variant">{formatDateTimeFr(b.startsAt)}</span>,
    },
    {
      key: "endsAt",
      header: "Fin",
      cell: (b) => <span className="text-[12px] text-on-surface-variant">{formatDateTimeFr(b.endsAt)}</span>,
    },
    {
      key: "canceledAt",
      header: "Annulé le",
      cell: (b) => (
        <span className="text-[12px] text-on-surface-variant">
          {b.canceledAt ? formatDateTimeFr(b.canceledAt) : "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Rechercher un vendeur ou une annonce…"
            className="pl-8"
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v as BoostStatusFilter | typeof ALL); setPage(1); }}>
          <SelectTrigger className="w-[190px]"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tous les statuts</SelectItem>
            {BOOST_STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={cols}
        rows={rows}
        rowKey={(b) => b.id}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        emptyLabel="Aucun boost."
        serverPagination={{ pagination, page, onPageChange: setPage, pageSize: PAGE_SIZE }}
      />
    </div>
  );
}

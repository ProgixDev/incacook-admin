"use client";

import { useEffect, useRef, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { ColumnCards } from "./column-cards";
import { Button } from "@/components/ui/button";
import { ApiError, patch } from "@/lib/api";
import { ErrorCodes } from "@/lib/api/error-codes";
import type { Pagination } from "@/lib/api";
import { isFullAdminRole, useAuth } from "@/lib/auth";
import { useAdminMutation, useAdminQuery } from "@/lib/query";
import { formatDateParis } from "./dates";
import {
  AccessBadge,
  CountersGrid,
  DuplicateHints,
  OnboardingCell,
  RequestBadge,
  SellerCell,
} from "./activation-view";
import { TrialActionDialog, type TrialActionTarget } from "./trial-action-dialog";
import {
  ACTION_LABEL,
  actionErrorMessage,
  availableActions,
  factsFromActivationRow,
  factsFromTrialItem,
  type TrialFacts,
} from "./trial-model";
import type {
  ActivationResponse,
  ActivationRow,
  TrialActionKind,
  TrialActionResult,
  TrialListItem,
} from "./types";

const PAGE_SIZE = 20;

/** True below Tailwind's `md` breakpoint (phones). Starts false so server and first client render agree. */
function useIsNarrow(): boolean {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return narrow;
}
type View = "all" | "ready" | "pending";

const VIEWS: { id: View; label: string }[] = [
  { id: "all", label: "Tous les vendeurs" },
  { id: "ready", label: "Prêts sans accès" },
  { id: "pending", label: "Demandes en attente" },
];

const EMPTY_LABEL: Record<View, string> = {
  all: "Aucun vendeur.",
  ready: "Aucun vendeur prêt sans accès : tous ceux qui ont terminé leur inscription ont déjà accès.",
  pending: "Aucune demande d’essai en attente.",
};

export function ActivationClient({ initialView = "all" }: { initialView?: View }) {
  const { user } = useAuth();
  if (!user || !isFullAdminRole(user.role)) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-md border border-outline-variant bg-surface-container-low p-12 text-center">
        <ShieldAlert className="h-7 w-7 text-error" />
        <h2 className="text-base font-semibold text-on-surface">Accès réservé aux administrateurs</h2>
        <p className="max-w-sm text-sm text-on-surface-variant">
          L’activation des vendeurs et les essais offerts ne sont accessibles qu&apos;aux comptes administrateur.
        </p>
      </div>
    );
  }
  return <ActivationPanel initialView={initialView} />;
}

function ActivationPanel({ initialView }: { initialView: View }) {
  const narrow = useIsNarrow();
  const [view, setView] = useState<View>(initialView);
  const [includeTest, setIncludeTest] = useState(false);
  const [page, setPage] = useState(1); // 1-based
  const [target, setTarget] = useState<TrialActionTarget | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  // Sellers the server said already have access (the trial lists do not carry that fact).
  const [knownActive, setKnownActive] = useState<ReadonlySet<string>>(new Set());

  // The "already has access" hint is a patch for lists that do not say so: it belongs to the screen it
  // was learned on, so it is forgotten as soon as the admin moves to another view or page.
  useEffect(() => {
    setKnownActive((prev) => (prev.size === 0 ? prev : new Set()));
  }, [view, page, includeTest]);

  // The summary always runs (counters). In the "all" view it also pages the rows;
  // in the other views one row is enough.
  // keepPreviousData: false everywhere here: rows carry action buttons, so a previous view's or
  // page's rows must never stay on screen (and clickable) while the current query loads.
  const summary = useAdminQuery<ActivationResponse>({
    path: "/admin/seller-activation",
    keepPreviousData: false,
    params: {
      limit: view === "all" ? PAGE_SIZE : 1,
      offset: view === "all" ? (page - 1) * PAGE_SIZE : 0,
      extra: { includeTest },
    },
  });
  const trials = useAdminQuery<TrialListItem[]>({
    path: "/admin/seller-trials",
    keepPreviousData: false,
    enabled: view !== "all",
    params: {
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      extra: { filter: view === "all" ? "ready" : view, includeTest },
    },
  });

  const toggleTest = useAdminMutation<
    { userId: string; isTestAccount: boolean },
    { row: ActivationRow; next: boolean }
  >(({ row, next }, opts) =>
    patch(`/admin/users/${encodeURIComponent(row.sellerId)}/test-account`, { isTestAccount: next }, opts),
  );
  const [toggleError, setToggleError] = useState<string | null>(null);

  // After an action the rows on screen are stale until the refetch answers: a second click on one
  // of their buttons would send an out-of-date state (and come back as a 409). Lock them meanwhile.
  const [refreshing, setRefreshing] = useState(false);
  const sawLoading = useRef(false);
  const anyLoading = summary.isLoading || (view !== "all" && trials.isLoading);
  useEffect(() => {
    if (!refreshing) return;
    if (anyLoading) sawLoading.current = true;
    else if (sawLoading.current) {
      sawLoading.current = false;
      setRefreshing(false);
    }
  }, [refreshing, anyLoading]);

  function refetchAll() {
    sawLoading.current = false;
    setRefreshing(true);
    summary.refetch();
    if (view !== "all") trials.refetch();
  }

  function open(kind: TrialActionKind, sellerId: string, sellerName: string, facts: TrialFacts) {
    setNotice(null);
    setAlertMessage(null);
    setTarget({ kind, sellerId, sellerName, trialEndsAt: facts.trialEndsAt, tier: facts.trialTier });
  }

  /**
   * The server rejected an action because what is on screen is out of date: refetch.
   * A stale end date would be re-sent by an open dialog and fail again, so that dialog is closed
   * and the admin starts over from the refreshed row; a seller who turned out to have access
   * stops being offered "Accorder".
   */
  function onStale(code: string) {
    if (code === ErrorCodes.TRIAL_STALE) {
      setTarget(null);
      setAlertMessage(actionErrorMessage(code, "L’essai a été modifié entre-temps."));
    }
    if (code === ErrorCodes.TRIAL_ALREADY_ACTIVE && target) {
      // Same reasoning: the dialog's confirm button would resend the rejected grant.
      const sellerId = target.sellerId;
      setKnownActive((prev) => new Set(prev).add(sellerId));
      setTarget(null);
      setAlertMessage(actionErrorMessage(code, "Ce vendeur a déjà accès à la plateforme."));
    }
    refetchAll();
  }

  function onDone(kind: TrialActionKind, result: TrialActionResult) {
    const name = target?.sellerName ?? "Le vendeur";
    if (target) {
      // The seller's state just changed: what we remembered about them is no longer reliable.
      setKnownActive((prev) => {
        const next = new Set(prev);
        next.delete(target.sellerId);
        return next;
      });
    }
    setTarget(null);
    const end = result.endsAt ? ` jusqu’au ${formatDateParis(result.endsAt)}` : "";
    const premium = result.tier === "PREMIUM";
    setNotice(
      {
        grant: premium ? `Premium offert à ${name}${end}.` : `Essai accordé à ${name}${end}.`,
        extend: premium ? `Premium offert de ${name} prolongé${end}.` : `Essai de ${name} prolongé${end}.`,
        revoke: premium ? `Premium offert de ${name} révoqué.` : `Essai de ${name} révoqué.`,
        refuse: `Demande de ${name} refusée.`,
      }[kind],
    );
    refetchAll(); // the screen shows what the server says, not what we assume
  }

  async function onToggleTest(row: ActivationRow) {
    setToggleError(null);
    try {
      await toggleTest.mutate({ row, next: !row.isTestAccount });
      refetchAll();
    } catch (err) {
      setToggleError(err instanceof ApiError ? err.message : "Impossible de modifier le compte.");
    }
  }

  function actionButtons(sellerId: string, name: string, facts: TrialFacts, emptyDash = true) {
    // A conflict answer fills in what a list without access information could not know.
    const known = facts.accessActive === undefined && knownActive.has(sellerId);
    const actions = availableActions(known ? { ...facts, accessActive: true } : facts);
    // A row with nothing to do shows no placeholder when other controls sit under it.
    if (actions.length === 0) {
      return emptyDash ? <span className="text-[12px] text-on-surface-variant">—</span> : null;
    }
    return (
      <div className="flex flex-wrap gap-1.5">
        {actions.map((kind) => (
          <Button
            key={kind}
            className="whitespace-nowrap"
            size="sm"
            variant={kind === "grant" ? "default" : "outline"}
            disabled={refreshing}
            onClick={() => open(kind, sellerId, name, facts)}
          >
            {ACTION_LABEL[kind]}
          </Button>
        ))}
      </div>
    );
  }

  const nameOf = (displayName: string | null, email: string) => displayName ?? email;

  const allColumns: Column<ActivationRow>[] = [
    {
      key: "seller",
      header: "Vendeur",
      cell: (r) => (
        <SellerCell name={r.displayName} email={r.email} isTestAccount={r.isTestAccount} isSuspended={r.isSuspended} />
      ),
    },
    {
      key: "signup",
      header: "Inscrit le",
      cell: (r) => <span className="text-[13px] text-on-surface-variant">{formatDateParis(r.signedUpAt)}</span>,
      width: "110px",
    },
    { key: "onboarding", header: "Inscription", cell: (r) => <OnboardingCell row={r} />, width: "150px" },
    { key: "access", header: "Accès", cell: (r) => <AccessBadge access={r.access} tier={r.trialTier} />, width: "140px" },
    {
      key: "listings",
      header: "Annonces",
      align: "right",
      cell: (r) => <span className="text-[13px] tabular-nums">{r.listings}</span>,
      width: "90px",
    },
    {
      key: "orders",
      header: "Commandes",
      align: "right",
      cell: (r) => <span className="text-[13px] tabular-nums">{r.orders}</span>,
      width: "100px",
    },
    { key: "request", header: "Demande", cell: (r) => <RequestBadge state={r.trialRequest} />, width: "160px" },
    {
      key: "actions",
      header: "Actions",
      cell: (r) => (
        <div className="flex flex-col gap-1.5">
          {actionButtons(r.sellerId, nameOf(r.displayName, r.email), factsFromActivationRow(r), false)}
          <button
            type="button"
            className="w-fit text-left text-[11.5px] text-on-surface-variant underline-offset-2 hover:underline disabled:opacity-50"
            disabled={toggleTest.isPending}
            onClick={() => onToggleTest(r)}
          >
            {r.isTestAccount ? "Retirer le marquage « compte test »" : "Marquer comme compte test"}
          </button>
        </div>
      ),
      width: "260px",
    },
  ];

  const trialColumns: Column<TrialListItem>[] = [
    { key: "seller", header: "Vendeur", cell: (r) => <SellerCell name={r.displayName} email={r.email} /> },
    {
      key: "signup",
      header: "Inscrit le",
      cell: (r) => <span className="text-[13px] text-on-surface-variant">{formatDateParis(r.signedUpAt)}</span>,
      width: "110px",
    },
    {
      key: "request",
      header: "Demande",
      cell: (r) => (
        <div className="flex flex-col gap-0.5">
          <RequestBadge state={r.requestState} />
          {r.requestedAt && (
            <span className="text-[11px] text-on-surface-variant">le {formatDateParis(r.requestedAt)}</span>
          )}
        </div>
      ),
      width: "170px",
    },
    {
      key: "duplicates",
      header: "Doublons possibles",
      cell: (r) => <DuplicateHints hints={r.duplicates} />,
      width: "280px",
    },
    {
      key: "actions",
      header: "Actions",
      cell: (r) => actionButtons(r.sellerId, nameOf(r.displayName, r.email), factsFromTrialItem(r)),
      width: "260px",
    },
  ];

  const summaryData = summary.data;
  // Until the response for the current query arrives there is no data (not a stale page): show it as loading.
  const summaryLoading = summary.isLoading || (summary.data === null && !summary.isError);
  const trialsLoading = trials.isLoading || (trials.data === null && !trials.isError);

  // An action (or another admin) can empty the page we are on: step back instead of
  // leaving the admin on an empty page with no way to go back.
  const listLoading = view === "all" ? summary.isLoading : trials.isLoading;
  const listRows = view === "all" ? summary.data?.sellers : trials.data;
  const listLoaded = view === "all" ? summary.data !== null : trials.data !== null;
  useEffect(() => {
    if (page > 1 && listLoaded && !listLoading && (listRows?.length ?? 0) === 0) setPage(page - 1);
  }, [page, listLoaded, listLoading, listRows]);
  const allPagination: Pagination | null = summaryData
    ? { hasMore: summaryData.pagination.hasMore, total: null, nextCursor: null, page, limit: PAGE_SIZE }
    : null;

  return (
    <div className="flex flex-col">
      {summary.isError && (
        <p role="alert" className="mb-3 text-[13px] text-error">
          Les compteurs n’ont pas pu être chargés : {summary.error?.message}
        </p>
      )}
      {summaryData && (
        <CountersGrid
          counters={summaryData.counters}
          windowDays={summaryData.windowDays}
          capped={summaryData.countersCapped}
        />
      )}

      <div className="frost mb-3 flex flex-wrap items-center gap-2 rounded-md p-3">
        <div role="tablist" aria-label="Vue" className="flex flex-wrap gap-1.5">
          {VIEWS.map((v) => (
            <Button
              key={v.id}
              role="tab"
              aria-selected={view === v.id}
              size="sm"
              variant={view === v.id ? "default" : "outline"}
              onClick={() => {
                setView(v.id);
                setPage(1);
                setNotice(null);
              }}
            >
              {v.label}
            </Button>
          ))}
        </div>
        {/* The same switch for every view: the counters, the table and both trial lists. */}
        <label className="ml-auto flex items-center gap-2 text-[12px] text-on-surface-variant">
          <input
            type="checkbox"
            checked={includeTest}
            onChange={(e) => {
              setIncludeTest(e.target.checked);
              setPage(1);
            }}
          />
          Inclure les comptes test
        </label>
      </div>

      {alertMessage && (
        <p role="alert" className="mb-3 rounded-md bg-error/15 px-3 py-2 text-[13px] text-error">
          {alertMessage}
        </p>
      )}
      {notice && (
        <p role="status" className="mb-3 rounded-md bg-success/15 px-3 py-2 text-[13px] text-success">
          {notice}
        </p>
      )}
      {toggleError && (
        <p role="alert" className="mb-3 text-[13px] text-error">
          {toggleError}
        </p>
      )}

      {/* Wide screens: the table. Phones: one card per row (a table cannot show its actions at 390 px). */}
      {!narrow ? (
        <div>
        {view === "all" ? (
          <DataTable
            columns={allColumns}
            rows={summaryData?.sellers ?? []}
            rowKey={(r) => r.sellerId}
            pageSize={PAGE_SIZE}
            isLoading={summaryLoading}
            isError={summary.isError}
            error={summary.error}
            onRetry={summary.refetch}
            emptyLabel={EMPTY_LABEL.all}
            serverPagination={{
              pagination: allPagination,
              page,
              onPageChange: setPage,
              pageSize: PAGE_SIZE,
              isFetching: summaryLoading,
            }}
          />
        ) : (
          <DataTable
            columns={trialColumns}
            rows={trials.data ?? []}
            rowKey={(r) => r.sellerId}
            pageSize={PAGE_SIZE}
            isLoading={trialsLoading}
            isError={trials.isError}
            error={trials.error}
            onRetry={trials.refetch}
            emptyLabel={EMPTY_LABEL[view]}
            serverPagination={{
              pagination: trials.pagination,
              page,
              onPageChange: setPage,
              pageSize: PAGE_SIZE,
              isFetching: trialsLoading,
            }}
          />
        )}
        </div>
      ) : (
        <div>
        {view === "all" ? (
          <ColumnCards
            columns={allColumns}
            rows={summaryData?.sellers ?? []}
            rowKey={(r) => r.sellerId}
            isLoading={summaryLoading}
            errorMessage={summary.isError ? (summary.error?.message ?? "Erreur de chargement.") : null}
            emptyLabel={EMPTY_LABEL.all}
            onRetry={summary.refetch}
            page={page}
            hasMore={allPagination?.hasMore ?? false}
            onPageChange={setPage}
          />
        ) : (
          <ColumnCards
            columns={trialColumns}
            rows={trials.data ?? []}
            rowKey={(r) => r.sellerId}
            isLoading={trialsLoading}
            errorMessage={trials.isError ? (trials.error?.message ?? "Erreur de chargement.") : null}
            emptyLabel={EMPTY_LABEL[view]}
            onRetry={trials.refetch}
            page={page}
            hasMore={trials.pagination?.hasMore ?? false}
            onPageChange={setPage}
          />
        )}
      </div>
      )}

      <TrialActionDialog
        target={target}
        onClose={() => setTarget(null)}
        onDone={onDone}
        onStale={onStale}
      />
    </div>
  );
}

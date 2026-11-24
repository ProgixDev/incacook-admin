import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { Column } from "@/components/dashboard/data-table";

/**
 * Phone layout for a table: one card per row, each column as a labelled line.
 * The wide table cannot show its action column at 390 px, so below `md` the page
 * renders these cards from the very same column definitions.
 */
export function ColumnCards<T>({
  columns,
  rows,
  rowKey,
  isLoading,
  errorMessage,
  emptyLabel,
  onRetry,
  page,
  hasMore,
  onPageChange,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  isLoading: boolean;
  errorMessage: string | null;
  emptyLabel: ReactNode;
  onRetry: () => void;
  page: number;
  hasMore: boolean;
  onPageChange: (page: number) => void;
}) {
  if (errorMessage) {
    return (
      <div role="alert" className="rounded-md border border-outline-variant bg-surface-container-low p-4 text-[13px] text-error">
        {errorMessage}
        <div className="mt-2">
          <Button size="sm" onClick={onRetry}>
            Réessayer
          </Button>
        </div>
      </div>
    );
  }
  if (isLoading && rows.length === 0) {
    return <p className="p-4 text-[13px] text-on-surface-variant">Chargement…</p>;
  }
  if (rows.length === 0) {
    return (
      <p className="rounded-md border border-outline-variant bg-surface-container-low p-6 text-center text-[13px] text-on-surface-variant">
        {emptyLabel}
      </p>
    );
  }
  const [first, ...rest] = columns;
  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-3">
        {rows.map((row) => (
          <li
            key={rowKey(row)}
            className="flex flex-col gap-2.5 rounded-md border border-outline-variant bg-surface-container-low p-3"
          >
            <div className="min-w-0">{first.cell(row)}</div>
            {rest.map((c) => (
              <div key={c.key} className="flex items-start justify-between gap-3">
                <span className="shrink-0 pt-0.5 text-[10.5px] font-medium uppercase tracking-wider text-on-surface-variant">
                  {c.header}
                </span>
                <div className="min-w-0 text-right">{c.cell(row)}</div>
              </div>
            ))}
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between">
        <Button size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Précédent
        </Button>
        <span className="text-[12px] text-on-surface-variant">Page {page}</span>
        <Button size="sm" disabled={!hasMore} onClick={() => onPageChange(page + 1)}>
          Suivant
        </Button>
      </div>
    </div>
  );
}

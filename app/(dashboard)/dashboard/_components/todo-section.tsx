"use client";

import Link from "next/link";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { useAdminQuery } from "@/lib/query";
import { formatNum } from "@/lib/utils";
import { todoView, type TodoResponse } from "./todo-model";

/**
 * "À traiter": what needs an admin right now, one line per queue with something waiting, each
 * linking to the page (and filter) that handles it. It does not depend on the period selector.
 */
export function TodoSection() {
  const todo = useAdminQuery<TodoResponse>({ path: "/admin/todo" });

  if (todo.isError) {
    return (
      <section
        aria-label="À traiter"
        className="mb-4 rounded-md border border-outline-variant bg-surface-container-low p-4"
      >
        <p role="alert" className="text-[13px] text-on-surface-variant">
          La liste « À traiter » est indisponible.{" "}
          <button
            type="button"
            className="underline underline-offset-2"
            onClick={() => todo.refetch()}
          >
            Réessayer
          </button>
        </p>
      </section>
    );
  }

  if (!todo.data) {
    return (
      <div
        aria-hidden
        className="mb-4 h-[84px] animate-pulse rounded-md border border-outline-variant bg-surface-container-low"
      />
    );
  }

  const { items, unavailable, allClear } = todoView(todo.data);

  return (
    <section
      aria-label="À traiter"
      className="mb-4 rounded-md border border-outline-variant bg-surface-container-low"
    >
      <h2 className="px-4 pt-3 text-[10.5px] font-semibold uppercase tracking-wider text-on-surface-variant">
        À traiter
      </h2>
      {allClear ? (
        <p className="flex items-center gap-2 px-4 py-3 text-[13px] text-on-surface-variant">
          <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
          Rien à traiter pour le moment.
        </p>
      ) : items.length === 0 ? null : (
        <ul className="divide-y divide-outline-variant/60 pt-1">
          {items.map((it) => (
            <li key={it.key}>
              <Link
                href={it.href}
                className="flex min-h-11 items-center gap-3 px-4 py-2 transition-colors hover:bg-surface-container-high focus-visible:bg-surface-container-high focus-visible:outline-none"
              >
                <span className="min-w-8 rounded-full bg-warning/20 px-2 py-0.5 text-center text-[12px] font-semibold tabular-nums text-[#A07A00] dark:text-warning">
                  {formatNum(it.count)}
                </span>
                <span className="text-[13px] font-medium text-on-surface">
                  {it.label}
                </span>
                <span className="hidden text-[12px] text-on-surface-variant sm:inline">
                  {it.hint}
                </span>
                <ChevronRight
                  className="ml-auto h-4 w-4 text-on-surface-variant"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
      {unavailable.length > 0 && (
        <p
          role="note"
          className="border-t border-outline-variant/60 px-4 py-2 text-[12px] text-warning"
        >
          Compteur indisponible : {unavailable.join(", ")}.
        </p>
      )}
    </section>
  );
}

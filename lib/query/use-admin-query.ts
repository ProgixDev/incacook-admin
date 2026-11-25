"use client";

/**
 * `useAdminQuery` — the one client-side hook every admin list page uses to
 * fetch server-paginated, filterable data through the typed API client
 * (`@/lib/api`).
 *
 * It wraps a `GET` against the offset/page admin contract
 * (`page` / `limit` / `offset` + `search`, see docs/backend-communication.md §3)
 * and returns `{ data, pagination, isLoading, isError, error, refetch }`.
 *
 * Behaviour:
 *  - Debounces `search` so rapid typing issues a single request.
 *  - Aborts the in-flight request whenever the query params change (or on
 *    unmount) — the superseded response is dropped, not surfaced.
 *  - Maps a thrown `ApiError` into the error state, exposing `message` and
 *    `correlationId` to the UI.
 *
 * Deliberately dependency-light: a hand-rolled fetch-state hook, no react-query.
 */

import * as React from "react";
import { get, ApiError, type Pagination, type RequestOptions } from "@/lib/api";
import { authRequest } from "@/lib/auth";

/** Server-side list query params, forwarded verbatim as URL query params. */
export interface AdminQueryParams {
  /** 1-based page number (offset/page contract). */
  page?: number;
  /** Page size. */
  limit?: number;
  /** Explicit row offset — alternative to `page`. */
  offset?: number;
  /** Free-text search term (debounced before it hits the wire). */
  search?: string;
  /** Any additional filter params merged into the query string. */
  extra?: Record<string, string | number | boolean | null | undefined>;
}

export interface UseAdminQueryOptions {
  /** Path under `/v1`, e.g. `"/admin/users"`. */
  path: string;
  /** Server-side pagination / search / filter params. */
  params?: AdminQueryParams;
  /** Debounce applied to `params.search` (ms). Set `0` to disable. */
  searchDebounceMs?: number;
  /** When `false`, the hook holds off fetching (e.g. before auth is ready). */
  enabled?: boolean;
  /**
   * Default `true`: while a request for new params is in flight, the previous params' data stays in
   * `data` (no flicker on plain lists). Set `false` when a row can be acted on: `data` is then
   * `null` until the response for the CURRENT params has arrived, so a previous page or filter is
   * never shown, nor acted on, under the new one. A refetch of the same params keeps its data.
   */
  keepPreviousData?: boolean;

  // --- Auth ------------------------------------------------------------------
  // By default (neither `token` nor `getToken` given) the hook routes through
  // the `lib/auth` session: it attaches the admin bearer and inherits the
  // single-flight 401 → refresh → replay. All admin endpoints require auth, so
  // this is the correct default and pages don't wire tokens themselves.
  // Pass `token`/`getToken` only to override with a caller-managed bearer
  // (that path does NOT auto-refresh).
  /** Explicit bearer override (bypasses session auto-refresh). */
  token?: string | null;
  /** Lazy bearer override, used when `token` is not provided. */
  getToken?: () => string | null | undefined;
}

export interface UseAdminQueryResult<TData> {
  /** Decoded `data` from the success envelope, or `null` before first load. */
  data: TData | null;
  /** Pagination block from the envelope (`total` / `hasMore` / `page` / …). */
  pagination: Pagination | null;
  /** True while a request is in flight. */
  isLoading: boolean;
  /** True when the last request failed (and was not superseded/aborted). */
  isError: boolean;
  /** The mapped `ApiError` (carries `message` + `correlationId`), else null. */
  error: ApiError | null;
  /** Re-run the current query, bypassing any cache. */
  refetch: () => void;
}

interface QueryState<TData> {
  /** The params the data (or error) belongs to. */
  key: string | null;
  data: TData | null;
  pagination: Pagination | null;
  isLoading: boolean;
  isError: boolean;
  error: ApiError | null;
}

/** `code` the client stamps on an aborted request — never surfaced to the UI. */
const ABORTED_CODE = "REQUEST_ABORTED";

export function useAdminQuery<TData = unknown>(
  options: UseAdminQueryOptions,
): UseAdminQueryResult<TData> {
  const {
    path,
    params,
    searchDebounceMs = 300,
    enabled = true,
    keepPreviousData = true,
    token,
    getToken,
  } = options;

  const page = params?.page;
  const limit = params?.limit;
  const offset = params?.offset;
  const search = params?.search ?? "";
  const extra = params?.extra;

  // Debounce only the search term; page/limit/filter changes fetch immediately.
  const [debouncedSearch, setDebouncedSearch] = React.useState(search);
  React.useEffect(() => {
    if (searchDebounceMs <= 0) {
      setDebouncedSearch(search);
      return;
    }
    const id = setTimeout(() => setDebouncedSearch(search), searchDebounceMs);
    return () => clearTimeout(id);
  }, [search, searchDebounceMs]);

  // `extra` is often an inline object (new identity every render). Serialize it
  // so it participates in the fetch dependency by value, not by reference.
  const serializedExtra = extra ? JSON.stringify(extra) : "";

  // Latest-value refs for things we don't want to key the fetch on directly.
  const getTokenRef = React.useRef(getToken);
  getTokenRef.current = getToken;
  const extraRef = React.useRef(extra);
  extraRef.current = extra;

  const [refetchTick, setRefetchTick] = React.useState(0);
  const refetch = React.useCallback(() => setRefetchTick((t) => t + 1), []);

  // What the data on screen must belong to: every param that changes the response.
  const requestKey = JSON.stringify([path, page, limit, offset, debouncedSearch, serializedExtra]);
  const requestKeyRef = React.useRef(requestKey);
  requestKeyRef.current = requestKey;

  const [state, setState] = React.useState<QueryState<TData>>({
    key: null,
    data: null,
    pagination: null,
    isLoading: enabled,
    isError: false,
    error: null,
  });

  React.useEffect(() => {
    if (!enabled) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }

    const controller = new AbortController();
    setState((s) => ({ ...s, isLoading: true, isError: false, error: null }));

    const runGet = (authOpts: RequestOptions = {}) =>
      get<TData>(path, {
        query: {
          page,
          limit,
          offset,
          // Skip an empty search so we don't send `?search=`.
          search: debouncedSearch ? debouncedSearch : undefined,
          ...extraRef.current,
        },
        signal: controller.signal,
        ...authOpts,
      });

    // Default read path routes through the auth layer so every admin list
    // inherits the bearer AND the single-flight 401 → refresh → replay. An
    // explicit `token`/`getToken` override is caller-managed (no auto-refresh).
    const request =
      token != null
        ? runGet({ token })
        : getTokenRef.current
          ? runGet({ getToken: getTokenRef.current })
          : authRequest<TData>((opts) => runGet(opts));

    request
      .then((res) => {
        if (controller.signal.aborted) return;
        setState({
          key: requestKeyRef.current,
          data: res.data,
          pagination: res.pagination,
          isLoading: false,
          isError: false,
          error: null,
        });
      })
      .catch((err: unknown) => {
        // A superseded request — ignore it, a newer fetch is already running.
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.code === ABORTED_CODE) return;

        const apiError =
          err instanceof ApiError
            ? err
            : new ApiError({
                statusCode: 0,
                code: "UNKNOWN",
                message:
                  err instanceof Error ? err.message : "Unknown request error",
                details: err,
              });
        setState((s) => ({
          ...s,
          isLoading: false,
          isError: true,
          error: apiError,
        }));
      });

    return () => controller.abort();
    // `token` is included so the fetch re-runs once auth injects a token.
  }, [
    path,
    page,
    limit,
    offset,
    debouncedSearch,
    serializedExtra,
    token,
    enabled,
    refetchTick,
  ]);

  const current = keepPreviousData || state.key === requestKey;
  return {
    data: current ? state.data : null,
    pagination: current ? state.pagination : null,
    isLoading: state.isLoading,
    isError: state.isError,
    error: state.error,
    refetch,
  };
}

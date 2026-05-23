/**
 * Base composable for module datatables
 * Provides standardized data fetching, pagination, filtering, and sorting
 */

import { ref, computed, type Ref, type ComputedRef } from "vue";
import type {
  PaginatedResponse,
  DatatableQueryParams,
} from "@/types/datatable";
import { normalizePaginatedResponse } from "@/types/datatable";

export interface UseModuleDatatableOptions<
  T,
  F extends Record<string, unknown> = Record<string, unknown>,
> {
  /** API function to fetch data */
  fetchFn: (
    params: DatatableQueryParams<F>,
  ) => Promise<PaginatedResponse<T> | unknown>;
  /** Key in response that contains the data array (for legacy APIs) */
  dataKey?: string;
  /** Default page size */
  defaultPageSize?: number;
  /** Available page sizes */
  pageSizes?: number[];
  /** Default filters */
  defaultFilters?: F;
  /** Whether to fetch on mount */
  fetchOnMount?: boolean;
}

export interface UseModuleDatatableReturn<
  T,
  F extends Record<string, unknown>,
> {
  // State
  data: Ref<T[]>;
  loading: Ref<boolean>;
  error: Ref<string | null>;

  // Pagination state
  page: Ref<number>;
  pageSize: Ref<number>;
  total: Ref<number>;
  totalPages: ComputedRef<number>;

  // Filter state
  filters: Ref<F>;

  // Sort state
  sortBy: Ref<string | undefined>;
  sortOrder: Ref<"asc" | "desc">;

  // Computed
  hasData: ComputedRef<boolean>;
  isEmpty: ComputedRef<boolean>;
  paginationConfig: ComputedRef<object>; // For n-data-table

  // Actions
  fetch: () => Promise<void>;
  refresh: () => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setFilters: (newFilters: Partial<F>) => void;
  resetFilters: () => void;
  setSort: (key: string, order?: "asc" | "desc") => void;
  clearSort: () => void;
  clear: () => void;
}

export function useModuleDatatable<
  T,
  F extends Record<string, unknown> = Record<string, unknown>,
>(options: UseModuleDatatableOptions<T, F>): UseModuleDatatableReturn<T, F> {
  const {
    fetchFn,
    dataKey,
    defaultPageSize = 20,
    pageSizes = [10, 20, 50, 100],
    defaultFilters = {} as F,
    fetchOnMount = true,
  } = options;

  // State
  const data = ref<T[]>([]) as Ref<T[]>;
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Pagination
  const page = ref(1);
  const pageSize = ref(defaultPageSize);
  const total = ref(0);

  // Filters
  const filters = ref<F>({ ...defaultFilters }) as Ref<F>;

  // Sort
  const sortBy = ref<string | undefined>(undefined);
  const sortOrder = ref<"asc" | "desc">("asc");

  // Computed
  const totalPages = computed(() =>
    pageSize.value > 0 ? Math.ceil(total.value / pageSize.value) : 0,
  );
  const hasData = computed(() => data.value.length > 0);
  const isEmpty = computed(() => !loading.value && data.value.length === 0);

  const paginationConfig = computed(() => ({
    page: page.value,
    pageSize: pageSize.value,
    itemCount: total.value,
    showSizePicker: true,
    showQuickJumper: true,
    pageSizes,
    onChange: (p: number) => setPage(p),
    onUpdatePageSize: (size: number) => setPageSize(size),
  }));

  // Actions
  async function fetch(): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      const rawResponse = await fetchFn({
        page: page.value,
        pageSize: pageSize.value,
        filters: filters.value,
        sortBy: sortBy.value,
        sortOrder: sortOrder.value,
      });

      // Normalize response to standard format
      const response = normalizePaginatedResponse<T>(
        rawResponse as PaginatedResponse<T>,
        dataKey,
      );

      data.value = response.data;
      total.value = response.total;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to fetch data";
      console.error("Datatable fetch error:", e);
    } finally {
      loading.value = false;
    }
  }

  async function refresh(): Promise<void> {
    await fetch();
  }

  function setPage(newPage: number): void {
    page.value = newPage;
    fetch();
  }

  function setPageSize(size: number): void {
    pageSize.value = size;
    page.value = 1; // Reset to first page
    fetch();
  }

  function setFilters(newFilters: Partial<F>): void {
    filters.value = { ...filters.value, ...newFilters };
    page.value = 1; // Reset to first page
    fetch();
  }

  function resetFilters(): void {
    filters.value = { ...defaultFilters } as F;
    page.value = 1;
    fetch();
  }

  function setSort(key: string, order: "asc" | "desc" = "asc"): void {
    sortBy.value = key;
    sortOrder.value = order;
    fetch();
  }

  function clearSort(): void {
    sortBy.value = undefined;
    sortOrder.value = "asc";
    fetch();
  }

  function clear(): void {
    data.value = [];
    total.value = 0;
    page.value = 1;
    error.value = null;
  }

  // Initial fetch
  if (fetchOnMount) {
    fetch();
  }

  return {
    data,
    loading,
    error,
    page,
    pageSize,
    total,
    totalPages,
    filters,
    sortBy,
    sortOrder,
    hasData,
    isEmpty,
    paginationConfig,
    fetch,
    refresh,
    setPage,
    setPageSize,
    setFilters,
    resetFilters,
    setSort,
    clearSort,
    clear,
  };
}

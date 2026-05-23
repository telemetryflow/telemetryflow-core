/**
 * Standardized Datatable Types for TelemetryFlow
 * Used for consistent table data handling across modules
 */

import type { DataTableColumns, PaginationProps } from "naive-ui";

/**
 * Standardized paginated response from API
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Legacy paginated response format (for backwards compatibility)
 */
export interface LegacyPaginatedResponse<T> {
  [key: string]: T[] | number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Convert legacy response to standard format
 */
export function normalizePaginatedResponse<T>(
  response: LegacyPaginatedResponse<T> | PaginatedResponse<T>,
  dataKey?: string,
): PaginatedResponse<T> {
  if ("data" in response && Array.isArray(response.data)) {
    return response as PaginatedResponse<T>;
  }

  // Legacy format - find the array key
  const legacyResponse = response as LegacyPaginatedResponse<T>;
  const arrayKey =
    dataKey ||
    Object.keys(legacyResponse).find((key) =>
      Array.isArray(legacyResponse[key]),
    );

  const data = arrayKey ? (legacyResponse[arrayKey] as T[]) : [];
  const pageSize = Number(
    legacyResponse.limit || legacyResponse.pageSize || 20,
  );
  const page = legacyResponse.page || 1;
  const total = legacyResponse.total || 0;
  const totalPages = legacyResponse.totalPages || Math.ceil(total / pageSize);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
  };
}

/**
 * Datatable state for composables
 */
export interface DatatableState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: Record<string, unknown>;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Datatable configuration
 */
export interface DatatableConfig<T> {
  columns: DataTableColumns<T>;
  rowKey: keyof T | ((row: T) => string);
  defaultPageSize?: number;
  pageSizes?: number[];
  striped?: boolean;
  bordered?: boolean;
  stickyHeader?: boolean;
}

/**
 * Filter option for select filters
 */
export interface FilterOption {
  label: string;
  value: string | number | boolean;
}

/**
 * Filter configuration
 */
export interface FilterConfig {
  key: string;
  label: string;
  type: "select" | "text" | "date" | "daterange" | "checkbox" | "multiselect";
  options?: FilterOption[];
  placeholder?: string;
  defaultValue?: unknown;
}

/**
 * Sort configuration
 */
export interface SortConfig {
  key: string;
  order: "asc" | "desc";
}

/**
 * Table query parameters
 */
export interface DatatableQueryParams<F = Record<string, unknown>> {
  page: number;
  pageSize: number;
  filters?: F;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Create Naive UI pagination config from state
 */
export function createPaginationConfig(
  state: {
    page: number;
    pageSize: number;
    total: number;
  },
  options?: {
    pageSizes?: number[];
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
  },
): Partial<PaginationProps> {
  return {
    page: state.page,
    pageSize: state.pageSize,
    itemCount: state.total,
    showSizePicker: true,
    pageSizes: options?.pageSizes || [10, 20, 50, 100],
    onChange: options?.onPageChange,
    onUpdatePageSize: options?.onPageSizeChange,
  };
}

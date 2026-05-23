/**
 * useDataTableFromRegistry - Composable to build NDataTable configs from registry
 *
 * Bridges the datatable registry (datatableId → definition with columns/features)
 * to Naive UI NDataTable component props. Provides column definitions with
 * render function factory based on renderType, plus pagination/feature config.
 *
 * Usage:
 *   const { columns, pagination, features, definition } = useDataTableFromRegistry('SVM30001', {
 *     status: (row) => h(NTag, { type: statusType(row.status) }, { default: () => row.status }),
 *   });
 *
 *   <NDataTable :columns="columns" :data="data" :pagination="pagination" />
 */

import { h, type VNode } from "vue";
import {
  getDataTableById,
  type DataTableDefinition,
  type DataTableColumn,
  type DataTableFeatures,
} from "@/constants/datatable-registry";

// ─── Types ──────────────────────────────────────────────────────────────────────

/** Custom render function override for a column key */
export type ColumnRenderFn = (row: Record<string, unknown>) => VNode | string;

/** Map of column key → custom render function */
export type ColumnRenderOverrides = Record<string, ColumnRenderFn>;

/** NDataTable column compatible type */
export interface NDataTableColumn {
  title: string;
  key: string;
  width?: number;
  minWidth?: number;
  ellipsis?: boolean;
  sortable?: boolean;
  fixed?: "left" | "right";
  align?: "left" | "center" | "right";
  render?: (row: Record<string, unknown>) => VNode | string;
}

/** Pagination config for registry-based NDataTable */
export interface RegistryPaginationConfig {
  pageSize: number;
  showSizePicker: boolean;
  pageSizes: number[];
}

export interface DataTableFromRegistryResult {
  /** Column definitions ready for NDataTable :columns prop */
  columns: NDataTableColumn[];
  /** Pagination config (false if not paginated) */
  pagination: RegistryPaginationConfig | false;
  /** Feature flags from registry */
  features: DataTableFeatures;
  /** Full definition from registry */
  definition: DataTableDefinition;
}

// ─── Default Render Factory ─────────────────────────────────────────────────────

/**
 * Create a default render function based on column renderType.
 * Views can override specific columns with custom render functions.
 */
function createDefaultRenderer(
  col: DataTableColumn,
): ((row: Record<string, unknown>) => VNode | string) | undefined {
  switch (col.renderType) {
    case "text":
      return undefined; // NDataTable default text rendering

    case "date":
      return (row: Record<string, unknown>) => {
        const val = row[col.key];
        if (!val) return "-";
        const date =
          val instanceof Date ? val : new Date(val as string | number);
        return date.toLocaleString();
      };

    case "tag":
      return (row: Record<string, unknown>) => {
        const val = String(row[col.key] ?? "");
        return h(
          "span",
          {
            class: "registry-tag",
            style: { fontSize: "12px" },
          },
          val,
        );
      };

    case "badge":
      return (row: Record<string, unknown>) => {
        const val = String(row[col.key] ?? "");
        return h("span", { class: "registry-badge" }, val);
      };

    case "progress":
      return (row: Record<string, unknown>) => {
        const val = Number(row[col.key] ?? 0);
        return h("div", { class: "registry-progress" }, [
          h("div", {
            class: "registry-progress-bar",
            style: { width: `${Math.min(100, val)}%` },
          }),
          h("span", `${val}%`),
        ]);
      };

    case "switch":
      return (row: Record<string, unknown>) => {
        const val = Boolean(row[col.key]);
        return h(
          "span",
          { style: { color: val ? "#22c55e" : "#6b7280" } },
          val ? "Enabled" : "Disabled",
        );
      };

    case "icon":
      return (row: Record<string, unknown>) => {
        const val = String(row[col.key] ?? "");
        return h("span", { class: "registry-icon" }, val);
      };

    case "sparkline":
      // Sparkline requires a custom chart component — leave as placeholder
      return () => {
        return h("span", { style: { color: "#9ca3af" } }, "▁▂▃▄▅");
      };

    case "actions":
      // Actions require view-specific buttons — must be overridden
      return () => h("span", { style: { color: "#9ca3af" } }, "—");

    case "custom":
      // Custom render must be provided via overrides
      return undefined;

    default:
      return undefined;
  }
}

// ─── Composable ─────────────────────────────────────────────────────────────────

/**
 * Build NDataTable columns and pagination from a registry datatableId
 *
 * @param datatableId - The datatable registry ID (e.g., 'SVM30001')
 * @param renderOverrides - Optional map of column key → custom render function
 * @returns Column definitions, pagination config, and features
 */
export function useDataTableFromRegistry(
  datatableId: string,
  renderOverrides?: ColumnRenderOverrides,
): DataTableFromRegistryResult {
  const definition = getDataTableById(datatableId);
  if (!definition) {
    throw new Error(
      `[useDataTableFromRegistry] DataTable "${datatableId}" not found in registry`,
    );
  }

  // Build columns from registry definition
  const columns: NDataTableColumn[] = definition.columns.map((col) => {
    const render = renderOverrides?.[col.key] ?? createDefaultRenderer(col);

    return {
      title: col.title,
      key: col.key,
      ellipsis: false,
      ...(col.width && { minWidth: col.width }),
      ...(col.sortable && { sortable: true }),
      ...(col.fixed && { fixed: col.fixed }),
      ...(col.align && { align: col.align }),
      ...(render && { render }),
    };
  });

  // Build pagination from features
  const pagination: RegistryPaginationConfig | false = definition.features
    .pagination
    ? {
        pageSize: definition.features.pageSize ?? 10,
        showSizePicker: true,
        pageSizes: definition.features.pageSizes ?? [5, 10, 20, 50],
      }
    : false;

  return {
    columns,
    pagination,
    features: definition.features,
    definition,
  };
}

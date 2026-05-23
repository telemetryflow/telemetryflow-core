import type { DataTableColumn } from "naive-ui";

/**
 * Keys that should not have sorting enabled
 */
const NON_SORTABLE_KEYS = ["actions", "action", "operations", "expand"];

/**
 * Add sorting capability to all columns except specified non-sortable columns
 * @param columns - Array of DataTableColumn definitions
 * @param excludeKeys - Additional keys to exclude from sorting (default: actions, action, operations, expand)
 * @returns Columns with sorter property added
 */
export function withSortableColumns<T = unknown>(
  columns: DataTableColumn<T>[],
  excludeKeys: string[] = [],
): DataTableColumn<T>[] {
  const allExcluded = [...NON_SORTABLE_KEYS, ...excludeKeys];

  return columns.map((column) => {
    // Skip columns that are dividers or have no key
    if (
      !("key" in column) ||
      column.type === "selection" ||
      column.type === "expand"
    ) {
      return column;
    }

    const key = column.key as string;

    // Skip non-sortable columns
    if (allExcluded.includes(key)) {
      return column;
    }

    // Add sorter if not already defined
    if (!("sorter" in column)) {
      return {
        ...column,
        sorter: "default",
      };
    }

    return column;
  });
}

/**
 * Create a custom sorter function for a specific field
 * @param key - The key to sort by
 * @param type - The type of sorting (string, number, date)
 */
export function createSorter<T>(
  key: keyof T,
  type: "string" | "number" | "date" = "string",
): (a: T, b: T) => number {
  return (a: T, b: T) => {
    const aVal = a[key];
    const bVal = b[key];

    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    switch (type) {
      case "number":
        return (aVal as number) - (bVal as number);
      case "date":
        return (
          new Date(aVal as string).getTime() -
          new Date(bVal as string).getTime()
        );
      case "string":
      default:
        return String(aVal).localeCompare(String(bVal));
    }
  };
}

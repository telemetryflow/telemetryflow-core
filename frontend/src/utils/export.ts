/**
 * Export utilities for data tables
 */

import dayjs from "dayjs";

/**
 * Convert data array to CSV string
 */
export function convertToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns?: { key: string; title: string }[],
): string {
  if (data.length === 0) return "";

  // Get headers from columns or from first data item
  const headers = columns
    ? columns.map((col) => col.key)
    : Object.keys(data[0]);

  const headerTitles = columns ? columns.map((col) => col.title) : headers;

  // Create CSV content
  const csvRows: string[] = [];

  // Add header row
  csvRows.push(headerTitles.map((h) => `"${h}"`).join(","));

  // Add data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      // Handle different value types
      if (value === null || value === undefined) return '""';
      if (typeof value === "object")
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(","));
  }

  return csvRows.join("\n");
}

/**
 * Convert data array to JSON string
 */
export function convertToJSON<T>(data: T[], pretty = true): string {
  return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
}

/**
 * Download content as a file
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export data as CSV file
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columns?: { key: string; title: string }[],
): void {
  const csv = convertToCSV(data, columns);
  const filenameWithExt = filename.endsWith(".csv")
    ? filename
    : `${filename}.csv`;
  downloadFile(csv, filenameWithExt, "text/csv;charset=utf-8;");
}

/**
 * Export data as JSON file
 */
export function exportToJSON<T>(data: T[], filename: string): void {
  const json = convertToJSON(data);
  const filenameWithExt = filename.endsWith(".json")
    ? filename
    : `${filename}.json`;
  downloadFile(json, filenameWithExt, "application/json");
}

/**
 * Get current timestamp for filename
 */
export function getExportFilename(prefix: string): string {
  const timestamp = dayjs().format("YYYY-MM-DD HH:mm:ss").replace(/[: ]/g, "-");
  return `${prefix}-${timestamp}`;
}

/**
 * Field Extractor Utility
 * Extracts and categorizes fields from log records for the Fields Sidebar
 */

import type {
  LogRecord,
  FieldMetadata,
  FieldType,
  FieldTopValue,
} from "@/types";

/**
 * Standard log fields that should always be available
 */
export const STANDARD_LOG_FIELDS: Array<{
  name: string;
  path: string;
  type: FieldType;
  description: string;
}> = [
  {
    name: "timestamp",
    path: "timestamp",
    type: "date",
    description: "Log timestamp",
  },
  {
    name: "observedTimestamp",
    path: "observedTimestamp",
    type: "date",
    description: "When the log was observed",
  },
  {
    name: "severityNumber",
    path: "severityNumber",
    type: "number",
    description: "Numeric severity level",
  },
  {
    name: "severityText",
    path: "severityText",
    type: "keyword",
    description: "Text severity level",
  },
  {
    name: "body",
    path: "body",
    type: "string",
    description: "Log message body",
  },
  {
    name: "traceId",
    path: "traceId",
    type: "keyword",
    description: "Trace ID for correlation",
  },
  {
    name: "spanId",
    path: "spanId",
    type: "keyword",
    description: "Span ID for correlation",
  },
];

/**
 * Default selected fields for the logs table
 */
export const DEFAULT_SELECTED_FIELDS = [
  "timestamp",
  "severityText",
  "resource.service.name",
  "body",
];

/**
 * Field category types
 */
export type FieldCategory = "standard" | "resource" | "attributes";

/**
 * Get field category from path
 */
export function getFieldCategory(path: string): FieldCategory {
  if (path.startsWith("resource.")) return "resource";
  if (path.startsWith("attributes.")) return "attributes";
  return "standard";
}

/**
 * Detect field type from value
 */
export function detectFieldType(value: unknown): FieldType {
  if (value === null || value === undefined) return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "string") {
    // Check if it's a date
    if (!isNaN(Date.parse(value)) && value.match(/^\d{4}-\d{2}-\d{2}/)) {
      return "date";
    }
    // Check if it looks like a keyword (short string without spaces)
    if (value.length < 50 && !value.includes(" ")) {
      return "keyword";
    }
  }
  return "string";
}

/**
 * Extract all fields from a collection of log records
 */
export function extractFieldsFromLogs(logs: LogRecord[]): FieldMetadata[] {
  const fieldMap = new Map<
    string,
    {
      count: number;
      type: FieldType;
      values: Map<string, number>;
    }
  >();

  // Helper to process nested objects
  const processObject = (obj: Record<string, unknown>, prefix = "") => {
    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined || value === null) continue;

      const path = prefix ? `${prefix}.${key}` : key;

      if (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
      ) {
        // Recursively process nested objects
        processObject(value as Record<string, unknown>, path);
      } else {
        const existing = fieldMap.get(path) || {
          count: 0,
          type: detectFieldType(value),
          values: new Map(),
        };

        existing.count++;

        // Update type if more specific
        const detectedType = detectFieldType(value);
        if (existing.type === "string" && detectedType !== "string") {
          existing.type = detectedType;
        }

        // Track values for top values (limit string length)
        const strValue = String(value).substring(0, 100);
        existing.values.set(strValue, (existing.values.get(strValue) || 0) + 1);

        fieldMap.set(path, existing);
      }
    }
  };

  // Process each log
  logs.forEach((log) => {
    // Process standard fields
    processObject({
      timestamp: log.timestamp,
      observedTimestamp: log.observedTimestamp,
      severityNumber: log.severityNumber,
      severityText: log.severityText,
      body: log.body,
      traceId: log.traceId,
      spanId: log.spanId,
    });

    // Process resource fields
    if (log.resource) {
      processObject(log.resource, "resource");
    }

    // Process attributes
    if (log.attributes) {
      processObject(log.attributes, "attributes");
    }
  });

  // Convert to FieldMetadata array
  const fields: FieldMetadata[] = Array.from(fieldMap.entries())
    .map(([path, data]) => {
      // Calculate top values with percentages
      const topValues: FieldTopValue[] = Array.from(data.values.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([value, count]) => ({
          value,
          count,
          percentage: Math.round((count / data.count) * 100),
        }));

      return {
        name: path.split(".").pop() || path,
        path,
        type: data.type,
        count: data.count,
        isNested: path.includes("."),
        parent: path.includes(".")
          ? path.split(".").slice(0, -1).join(".")
          : undefined,
        topValues,
      };
    })
    .sort((a, b) => {
      // Sort: standard fields first, then by count
      const catA = getFieldCategory(a.path);
      const catB = getFieldCategory(b.path);
      if (catA !== catB) {
        const order: Record<FieldCategory, number> = {
          standard: 0,
          resource: 1,
          attributes: 2,
        };
        return order[catA] - order[catB];
      }
      return b.count - a.count;
    });

  return fields;
}

/**
 * Group fields by category
 */
export function groupFieldsByCategory(
  fields: FieldMetadata[],
): Record<FieldCategory, FieldMetadata[]> {
  const groups: Record<FieldCategory, FieldMetadata[]> = {
    standard: [],
    resource: [],
    attributes: [],
  };

  fields.forEach((field) => {
    const category = getFieldCategory(field.path);
    groups[category].push(field);
  });

  return groups;
}

/**
 * Get field value from log record by path.
 *
 * Handles both nested objects and flat dotted keys (e.g. OTEL resource
 * attributes where `log.resource["host.id"]` is stored as a flat key
 * but the extracted path is `"resource.host.id"`).
 */
export function getFieldValueByPath(
  log: LogRecord,
  fieldPath: string,
): unknown {
  const parts = fieldPath.split(".");
  let value: unknown = log;

  for (let i = 0; i < parts.length; i++) {
    if (value == null || typeof value !== "object") return undefined;

    const obj = value as Record<string, unknown>;

    // Try direct key first (nested access)
    if (parts[i] in obj) {
      value = obj[parts[i]];
      continue;
    }

    // Try joining remaining parts as a flat dotted key (longest match first).
    // E.g. for ["resource","host","id"] at i=1, try "host.id" then "host".
    let found = false;
    for (let j = parts.length; j > i; j--) {
      const flatKey = parts.slice(i, j).join(".");
      if (flatKey in obj) {
        value = obj[flatKey];
        i = j - 1; // skip consumed parts (loop increments i)
        found = true;
        break;
      }
    }

    if (!found) return undefined;
  }

  return value;
}

/**
 * Format field value for display
 */
export function formatFieldValue(value: unknown, type: FieldType): string {
  if (value === null || value === undefined) return "-";

  switch (type) {
    case "date":
      if (typeof value === "number") {
        return new Date(value).toISOString();
      }
      return String(value);
    case "number":
      return Number(value).toLocaleString();
    case "boolean":
      return value ? "true" : "false";
    default:
      return String(value);
  }
}

/**
 * Get display name for field (last part of path)
 */
export function getFieldDisplayName(path: string): string {
  return path.split(".").pop() || path;
}

/**
 * Check if a field is a standard log field
 */
export function isStandardField(path: string): boolean {
  return STANDARD_LOG_FIELDS.some((f) => f.path === path);
}

/**
 * Get field description if available
 */
export function getFieldDescription(path: string): string | undefined {
  const standardField = STANDARD_LOG_FIELDS.find((f) => f.path === path);
  return standardField?.description;
}

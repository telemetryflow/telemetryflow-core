/**
 * TFQL (TelemetryFlow Query Language) utilities
 * Helpers for building and parsing TFQL queries
 */

import type { LocationQuery } from "vue-router";

/**
 * Field mapping from URL parameter names to TFQL field paths
 */
export const URL_PARAM_TO_TFQL_FIELD: Record<string, string> = {
  pod: "resource.k8s.pod.name",
  namespace: "resource.k8s.namespace.name",
  cluster: "resource.k8s.cluster.id",
  service: "serviceName",
  node: "resource.k8s.node.name",
  vm: "resource.host.name",
  agent: "resource.host.name",
  container: "resource.k8s.container.name",
  deployment: "resource.k8s.deployment.name",
  host: "resource.host.name",
  level: "severityText",
  traceId: "traceId",
  spanId: "spanId",
};

/**
 * Format a filter value for TFQL query
 * Wraps value in quotes if it contains spaces or special characters
 */
export function formatTfqlValue(value: string): string {
  // Check if value needs quoting (spaces, special chars, etc.)
  if (
    value.includes(" ") ||
    value.includes("(") ||
    value.includes(")") ||
    value.includes(",")
  ) {
    return `"${value}"`;
  }
  return value;
}

/**
 * Build a TFQL query term from field and value
 */
export function buildTfqlTerm(
  field: string,
  value: string,
  operator: string = ":",
): string {
  return `${field}${operator}${formatTfqlValue(value)}`;
}

/**
 * Build a TFQL query string from Vue Router query params
 * Converts URL params like ?pod=xxx&namespace=yyy to TFQL format
 */
export function buildTfqlFromUrlParams(query: LocationQuery): string {
  const searchTerms: string[] = [];

  for (const [param, tfqlField] of Object.entries(URL_PARAM_TO_TFQL_FIELD)) {
    const value = query[param];
    if (value && typeof value === "string") {
      searchTerms.push(buildTfqlTerm(tfqlField, value));
    }
  }

  return searchTerms.join(" AND ");
}

/**
 * Parse a simple TFQL term into field, operator, and value
 * Example: "field:value" -> { field: "field", operator: ":", value: "value" }
 */
export function parseTfqlTerm(
  term: string,
): { field: string; operator: string; value: string } | null {
  // Match patterns like: field:value, field:*value*, field:>100, field:"quoted value"
  const match = term.match(/^([a-zA-Z0-9_.]+)(:|:\*|>|<|>=|<=)(.+)$/);
  if (!match) return null;

  let value = match[3];
  // Remove surrounding quotes if present
  if (value.startsWith('"') && value.endsWith('"')) {
    value = value.slice(1, -1);
  }

  return {
    field: match[1],
    operator: match[2],
    value,
  };
}

/**
 * Get the URL parameter name for a TFQL field path
 */
export function getTfqlFieldUrlParam(tfqlField: string): string | undefined {
  for (const [param, field] of Object.entries(URL_PARAM_TO_TFQL_FIELD)) {
    if (field === tfqlField) {
      return param;
    }
  }
  return undefined;
}

/**
 * Convert a TFQL query to URL query params
 * Inverse of buildTfqlFromUrlParams
 */
export function tfqlToUrlParams(tfqlQuery: string): Record<string, string> {
  const params: Record<string, string> = {};

  // Split by AND (case insensitive)
  const terms = tfqlQuery.split(/\s+AND\s+/i);

  for (const term of terms) {
    const parsed = parseTfqlTerm(term.trim());
    if (parsed) {
      const urlParam = getTfqlFieldUrlParam(parsed.field);
      if (urlParam) {
        params[urlParam] = parsed.value;
      }
    }
  }

  return params;
}

/**
 * Mapping from TFQL resource field paths to LogQuery structured fields
 */
const TFQL_RESOURCE_TO_LOGQUERY_FIELD: Record<string, string> = {
  "resource.k8s.namespace.name": "k8sNamespace",
  "resource.k8s.pod.name": "k8sPodName",
  "resource.k8s.container.name": "k8sContainerName",
  "resource.k8s.cluster.id": "k8sClusterId",
  "resource.k8s.node.name": "k8sNodeName",
  "resource.k8s.deployment.name": "k8sDeploymentName",
  "resource.host.name": "hostName",
};

/**
 * Parse TFQL query string and extract resource.* filter terms as structured LogQuery fields.
 * Returns the cleaned query (with resource.* terms removed) and the extracted structured fields.
 */
export function parseTfqlResourceFilters(tfqlQuery: string): {
  cleanedQuery: string;
  structuredFilters: Record<string, string>;
} {
  if (!tfqlQuery.trim()) return { cleanedQuery: "", structuredFilters: {} };

  const terms = tfqlQuery.split(/\s+AND\s+/i);
  const remaining: string[] = [];
  const structuredFilters: Record<string, string> = {};

  for (const term of terms) {
    const parsed = parseTfqlTerm(term.trim());
    if (parsed && TFQL_RESOURCE_TO_LOGQUERY_FIELD[parsed.field]) {
      structuredFilters[TFQL_RESOURCE_TO_LOGQUERY_FIELD[parsed.field]] = parsed.value;
    } else if (term.trim()) {
      remaining.push(term.trim());
    }
  }

  return { cleanedQuery: remaining.join(" AND "), structuredFilters };
}

/**
 * Decompose a TFQL query into structured filters for volume/patterns endpoints.
 * Extracts severityText, serviceName, body, and source terms into separate fields.
 * Remaining unrecognized terms are treated as body search text.
 */
export interface TfqlStructuredFilters {
  bodyQuery?: string;
  severity?: string[];
  serviceName?: string[];
  source?: string[];
}

const TFQL_FIELD_TO_FILTER: Record<string, keyof TfqlStructuredFilters> = {
  severityText: "severity",
  severity_text: "severity",
  level: "severity",
  serviceName: "serviceName",
  service_name: "serviceName",
  service: "serviceName",
  source: "source",
  scope_name: "source",
};

export function parseTfqlToStructuredFilters(tfqlQuery: string): TfqlStructuredFilters {
  if (!tfqlQuery.trim()) return {};

  const terms = tfqlQuery.split(/\s+AND\s+/i);
  const filters: TfqlStructuredFilters = {};
  const bodyParts: string[] = [];

  for (const term of terms) {
    const trimmed = term.trim();
    const parsed = parseTfqlTerm(trimmed);

    if (parsed) {
      const filterKey = TFQL_FIELD_TO_FILTER[parsed.field];
      if (filterKey && filterKey !== "bodyQuery") {
        // Accumulate array-type filters (severity, serviceName, source)
        const arr = (filters[filterKey] as string[] | undefined) || [];
        arr.push(parsed.value.replace(/^\*|\*$/g, ""));
        (filters as any)[filterKey] = arr;
      } else if (parsed.field === "body") {
        // body:*timeout* → strip wildcards for LIKE search
        bodyParts.push(parsed.value.replace(/^\*|\*$/g, ""));
      } else {
        // Unrecognized field:value — treat as body search
        bodyParts.push(trimmed);
      }
    } else if (trimmed) {
      // Plain text (no field: prefix) — treat as body search
      bodyParts.push(trimmed);
    }
  }

  if (bodyParts.length > 0) {
    filters.bodyQuery = bodyParts.join(" ");
  }

  return filters;
}

/**
 * TFQL operators with descriptions
 */
export const TFQL_OPERATORS = [
  { label: ":", value: ":", description: "equals" },
  { label: ":*", value: ":*", description: "wildcard match" },
  { label: ">", value: ">", description: "greater than" },
  { label: "<", value: "<", description: "less than" },
  { label: ">=", value: ">=", description: "greater or equal" },
  { label: "<=", value: "<=", description: "less or equal" },
] as const;

/**
 * TFQL boolean operators
 */
export const TFQL_BOOLEAN_OPERATORS = ["AND", "OR", "NOT"] as const;

export type TfqlOperator = (typeof TFQL_OPERATORS)[number]["value"];
export type TfqlBooleanOperator = (typeof TFQL_BOOLEAN_OPERATORS)[number];

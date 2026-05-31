/**
 * JSON formatting and syntax highlighting utilities
 */

/**
 * Highlighted JSON line with line number
 */
export interface JsonHighlightedLine {
  number: number;
  content: string;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Highlight a single JSON line with syntax coloring
 * Returns HTML string with span elements for different JSON tokens:
 * - .json-key: object keys
 * - .json-string: string values
 * - .json-number: numeric values
 * - .json-boolean: true/false
 * - .json-null: null values
 * - .json-bracket: {}, []
 */
export function highlightJsonLine(line: string): string {
  // Escape HTML first
  let escaped = escapeHtml(line);

  // Highlight JSON key (quoted string followed by :)
  escaped = escaped.replace(
    /^(\s*)"([^"]+)"(\s*:)/g,
    '$1<span class="json-key">"$2"</span>$3',
  );

  // Highlight string values (after colon)
  escaped = escaped.replace(
    /(:\s*)"([^"]*)"(,?)$/g,
    '$1<span class="json-string">"$2"</span>$3',
  );

  // Highlight numbers (after colon)
  escaped = escaped.replace(
    /(:\s*)(-?\d+\.?\d*)(,?)$/g,
    '$1<span class="json-number">$2</span>$3',
  );

  // Highlight booleans
  escaped = escaped.replace(
    /(:\s*)(true|false)(,?)$/g,
    '$1<span class="json-boolean">$2</span>$3',
  );

  // Highlight null
  escaped = escaped.replace(
    /(:\s*)(null)(,?)$/g,
    '$1<span class="json-null">$2</span>$3',
  );

  // Highlight brackets and braces
  escaped = escaped.replace(
    /([{}[\]])/g,
    '<span class="json-bracket">$1</span>',
  );

  return escaped;
}

/**
 * Format JSON object with syntax highlighting for HTML display
 * Returns HTML string with span elements for different JSON tokens
 */
export function formatJsonWithHighlight(obj: unknown): string {
  const json = JSON.stringify(obj, null, 2);
  return json
    .split("\n")
    .map((line) => highlightJsonLine(line))
    .join("\n");
}

/**
 * Format JSON with syntax highlighting AND line numbers
 * Returns array of objects with line number and highlighted content
 */
export function getJsonHighlightedLines(obj: unknown): JsonHighlightedLine[] {
  const json = JSON.stringify(obj, null, 2);
  const lines = json.split("\n");

  return lines.map((line, index) => ({
    number: index + 1,
    content: highlightJsonLine(line),
  }));
}

/**
 * Legacy function - Format JSON with line numbers
 * Returns an object with lineNumbers and highlightedLines arrays
 * @deprecated Use getJsonHighlightedLines instead for better typing
 */
export function formatJsonWithLineNumbers(obj: unknown): {
  lineNumbers: number[];
  lines: string[];
} {
  const json = JSON.stringify(obj, null, 2);
  const lines = json.split("\n");

  const highlightedLines = lines.map((line) => highlightJsonLine(line));

  return {
    lineNumbers: lines.map((_, i) => i + 1),
    lines: highlightedLines,
  };
}

/**
 * Pretty print JSON with indentation
 */
export function prettyJson(obj: unknown, indent: number = 2): string {
  return JSON.stringify(obj, null, indent);
}

/**
 * Safely parse JSON string
 */
export function safeJsonParse<T = unknown>(str: string, fallback: T): T {
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

/**
 * Check if a string is valid JSON
 */
export function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get JSON value type as a string
 */
export function getJsonValueType(
  value: unknown,
): "string" | "number" | "boolean" | "null" | "array" | "object" {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value as "string" | "number" | "boolean" | "object";
}

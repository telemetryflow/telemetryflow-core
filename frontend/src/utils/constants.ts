/**
 * Log level color definitions
 * Used for styling log level badges and indicators
 */
export const levelColors: Record<string, { color: string; bg: string }> = {
  trace: { color: "#94a3b8", bg: "rgba(148, 163, 184, 0.1)" },
  debug: { color: "#60a5fa", bg: "rgba(96, 165, 250, 0.1)" },
  info: { color: "#22c55e", bg: "rgba(34, 197, 94, 0.1)" },
  warn: { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)" },
  error: { color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)" },
  fatal: { color: "#7c3aed", bg: "rgba(124, 58, 237, 0.1)" },
};

/**
 * Severity number to text mapping (OpenTelemetry severity numbers)
 */
export function getSeverityDescription(num: number): string {
  if (num <= 4) return "TRACE";
  if (num <= 8) return "DEBUG";
  if (num <= 12) return "INFO";
  if (num <= 16) return "WARN";
  if (num <= 20) return "ERROR";
  return "FATAL";
}

/**
 * Get level color by severity number
 */
export function getLevelColorBySeverity(severityNumber: number): {
  color: string;
  bg: string;
} {
  const level = getSeverityDescription(severityNumber).toLowerCase();
  return levelColors[level] || levelColors.info;
}

/**
 * Get level color by level name
 */
export function getLevelColor(level: string): { color: string; bg: string } {
  return levelColors[level.toLowerCase()] || levelColors.info;
}

/**
 * Span status codes
 */
export const spanStatusCodes: Record<number, string> = {
  0: "UNSET",
  1: "OK",
  2: "ERROR",
};

/**
 * Span kind descriptions
 */
export const spanKinds: Record<number, string> = {
  0: "UNSPECIFIED",
  1: "INTERNAL",
  2: "SERVER",
  3: "CLIENT",
  4: "PRODUCER",
  5: "CONSUMER",
};

/**
 * Get span status text
 */
export function getSpanStatusText(code: number): string {
  return spanStatusCodes[code] || "UNKNOWN";
}

/**
 * Get span kind text
 */
export function getSpanKindText(kind: number): string {
  return spanKinds[kind] || "UNKNOWN";
}

/**
 * Stat Panel Registry Types
 *
 * Shared type definitions for stat panel registry modules.
 */

// ─── Types ──────────────────────────────────────────────────────────────────────

export type StatPanelModuleCode =
  | "HOM"
  | "MET"
  | "TRC"
  | "LOG"
  | "COR"
  | "EXP"
  | "ALR"
  | "RPT"
  | "UPT"
  | "STP"
  | "SVM"
  | "NWM"
  | "K8S"
  | "INF"
  | "AGT"
  | "RET"
  | "SUB"
  | "IAM"
  | "TEN"
  | "AUD"
  | "APK"
  | "NOT"
  | "LLM"
  | "DMS"
  | "AID"
  | "CRM"
  | "PRM"
  | "CST"
  | "INV"
  | "DBM"
  | "QRY";

export type StatPanelColor =
  | "primary"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "purple";

export type StatPanelSize = "default" | "small";

export interface StatPanelDefinition {
  statPanelId: string;
  module: StatPanelModuleCode;
  title: string;
  icon: string;
  color: StatPanelColor;
  valueColor?: string;
  unit: string;
  size: StatPanelSize;
  dataSource: string;
  hasTrend: boolean;
  hasTimeRange: boolean;
  description: string;
  view: string;
  position: string;
}

// ─── Extended Module Metadata ────────────────────────────────────────────────────

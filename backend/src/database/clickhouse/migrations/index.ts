/**
 * ClickHouse Core Migrations Index
 *
 * Core telemetry tables (logs, metrics, traces) and their materialized views.
 * Module-specific migrations are in their respective module directories.
 */

import { CreateLogsTable1704240000002 } from "./1704240000002-CreateLogsTable";
import { CreateMetricsTable1704240000003 } from "./1704240000003-CreateMetricsTable";
import { CreateTracesTable1704240000004 } from "./1704240000004-CreateTracesTable";
import { AddOptimizationViews1704240000005 } from "./1704240000005-AddOptimizationViews";
import { AddIntervalViews1704240000006 } from "./1704240000006-AddIntervalViews";
import { AddPercentileColumns1704240000007 } from "./1704240000007-AddPercentileColumns";
import { FixMetricsViewsAddOrgId1704240000008 } from "./1704240000008-FixMetricsViewsAddOrgId";
import { AddK8sLogsBloomFilters1704240000009 } from "./1704240000009-AddK8sLogsBloomFilters";
import { AddLogsBodyTokenIndex1704240000010 } from "./1704240000010-AddLogsBodyTokenIndex";

export {
  CreateLogsTable1704240000002,
  CreateMetricsTable1704240000003,
  CreateTracesTable1704240000004,
  AddOptimizationViews1704240000005,
  AddIntervalViews1704240000006,
  AddPercentileColumns1704240000007,
  FixMetricsViewsAddOrgId1704240000008,
  AddK8sLogsBloomFilters1704240000009,
  AddLogsBodyTokenIndex1704240000010,
};

/** Named array export for migration runner discovery */
export const CoreClickHouseMigrations = [
  CreateLogsTable1704240000002,
  CreateMetricsTable1704240000003,
  CreateTracesTable1704240000004,
  AddOptimizationViews1704240000005,
  AddIntervalViews1704240000006,
  AddPercentileColumns1704240000007,
  FixMetricsViewsAddOrgId1704240000008,
  AddK8sLogsBloomFilters1704240000009,
  AddLogsBodyTokenIndex1704240000010,
];

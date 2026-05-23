/**
 * Graph Registry — COST OPTIMIZATION (CST)
 * 4 graph definitions — cost trend, breakdown, by-provider, provider comparison
 */

import type { GraphDefinition } from "./types";

export const CST_GRAPHS: GraphDefinition[] = [
  {
    graphId: "CST10001",
    module: "CST",
    title: "Cost Trend",
    component: "TimeseriesChart",
    chartType: "timeseries",
    signalType: "mixed",
    unit: "USD",
    description: "Daily cost trend over time, split by provider",
    dataSource: "api",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "FETCH cost_data_daily_mv AGGREGATE sum(total_cost_usd) BY provider, day",
        legendFormat: "{{provider}}",
        seriesKey: "provider",
      },
    ],
    view: "ai-intelligence/cost-optimization/index.vue",
    position: "main",
    toggleable: true,
  },
  {
    graphId: "CST10002",
    module: "CST",
    title: "Cost Breakdown by Service",
    component: "BarChart",
    chartType: "bar",
    signalType: "mixed",
    unit: "USD",
    description: "Cost breakdown by cloud service",
    dataSource: "api",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "FETCH cost_data_daily_mv AGGREGATE sum(total_cost_usd) BY service_name ORDER BY sum(total_cost_usd) DESC LIMIT 10",
        legendFormat: "{{service_name}}",
        seriesKey: "service_name",
      },
    ],
    view: "ai-intelligence/cost-optimization/index.vue",
    position: "main",
    toggleable: true,
  },
  {
    graphId: "CST10003",
    module: "CST",
    title: "Cost by Provider",
    component: "BarChart",
    chartType: "dynamic",
    signalType: "mixed",
    unit: "USD",
    description: "Cost distribution across cloud providers",
    dataSource: "api",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "FETCH cost_data_daily_mv AGGREGATE sum(total_cost_usd) BY provider",
        legendFormat: "{{provider}}",
        seriesKey: "provider",
      },
    ],
    view: "ai-intelligence/cost-optimization/index.vue",
    position: "main",
    toggleable: true,
  },
  {
    graphId: "CST10004",
    module: "CST",
    title: "Provider Cost Comparison",
    component: "BarChart",
    chartType: "bar",
    signalType: "mixed",
    unit: "USD",
    description: "Side-by-side provider cost comparison",
    dataSource: "api",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "FETCH cost_data_daily_mv AGGREGATE sum(total_cost_usd) BY provider, day GROUP BY day ORDER BY day",
        legendFormat: "{{provider}}",
        seriesKey: "provider",
      },
    ],
    view: "ai-intelligence/cost-optimization/index.vue",
    position: "main",
    toggleable: true,
  },
];

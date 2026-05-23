/**
 * Graph Registry — DASHBOARDS (DSH)
 * 2 graph definitions
 *
 * Auto-extracted from graph-registry.ts
 */

import type { GraphDefinition } from "./types";

export const DSH_GRAPHS: GraphDefinition[] = [
  // │ DASHBOARDS (DSH) - 2 graphs (dynamic containers)
  // └──────────────────────────────────────────────────────────────────────────────
  {
    graphId: "DSH10001",
    module: "DSH",
    title: "Dashboard Builder Widgets",
    component: "GraphPanel",
    chartType: "dynamic",
    signalType: "mixed",
    unit: "varies",
    description:
      "Dynamic editable widgets in dashboard builder (timeseries/stat/gauge/bar/table/text)",
    dataSource: "dashboard.widgets[]",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "FETCH metrics AGGREGATE avg(value) INTERVAL 5m",
        legend: "Builder Widget",
        legendFormat: "Dashboard Builder Widgets",
        seriesKey: "__name__",
      },
    ],
    view: "dashboards/builder.vue",
    position: "draggable-grid",
    toggleable: true,
  },
  {
    graphId: "DSH10002",
    module: "DSH",
    title: "Dashboard Viewer Widgets",
    component: "GraphPanel",
    chartType: "dynamic",
    signalType: "mixed",
    unit: "varies",
    description: "Dynamic view-only widgets in dashboard viewer",
    dataSource: "dashboard.widgets[]",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "FETCH metrics AGGREGATE avg(value) INTERVAL 5m",
        legend: "Viewer Widget",
        legendFormat: "Dashboard Viewer Widgets",
        seriesKey: "__name__",
      },
    ],
    view: "dashboards/view.vue",
    position: "grid-layout",
    toggleable: true,
  },

];

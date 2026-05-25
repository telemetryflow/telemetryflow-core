/**
 * ClickHouse Translator
 * Translates TFQL AST to ClickHouse SQL for time-series signals (metrics, logs, traces)
 */

import {
  TfqlAstNode,
  FetchNode,
  CorrelateNode,
  TimeValue,
  IntervalNode,
  SignalTarget,
  AggregationFunction,
} from "../../domain/types/ast-nodes.types";
import {
  BaseTranslator,
  TranslatorResult,
  TranslationContext,
  FieldMapping,
} from "./BaseTranslator";

// ============================================================================
// ClickHouse Table Schemas
// ============================================================================

interface ClickHouseTableConfig {
  tableName: string;
  timestampColumn: string;
  defaultColumns: string[];
  jsonColumns: string[];
}

const TABLE_CONFIGS: Record<SignalTarget, ClickHouseTableConfig> = {
  metrics: {
    tableName: "metrics",
    timestampColumn: "timestamp",
    defaultColumns: [
      "timestamp",
      "metric_name",
      "value",
      "service_name",
      "organization_id",
    ],
    jsonColumns: ["labels", "attributes"],
  },
  logs: {
    tableName: "logs",
    timestampColumn: "timestamp",
    defaultColumns: [
      "timestamp",
      "severity",
      "body",
      "service_name",
      "trace_id",
      "span_id",
      "organization_id",
    ],
    jsonColumns: ["attributes", "resource_attributes"],
  },
  traces: {
    tableName: "traces",
    timestampColumn: "timestamp",
    defaultColumns: [
      "timestamp",
      "trace_id",
      "span_id",
      "parent_span_id",
      "span_name",
      "service_name",
      "duration_ns",
      "status",
      "organization_id",
    ],
    jsonColumns: ["attributes", "events", "links"],
  },
  exemplars: {
    tableName: "exemplars",
    timestampColumn: "timestamp",
    defaultColumns: [
      "timestamp",
      "trace_id",
      "span_id",
      "metric_name",
      "value",
      "organization_id",
    ],
    jsonColumns: ["labels"],
  },
  correlations: {
    tableName: "signal_correlations",
    timestampColumn: "timestamp",
    defaultColumns: [
      "timestamp",
      "correlation_id",
      "metric_name",
      "log_pattern",
      "trace_id",
      "organization_id",
    ],
    jsonColumns: ["context"],
  },
};

// QAN queries target — table name varies by engine filter
const QUERIES_TABLE_CONFIG: ClickHouseTableConfig = {
  tableName: "db_mysql_queries",
  timestampColumn: "timestamp",
  defaultColumns: [
    "timestamp",
    "digest",
    "digest_text",
    "schema_name",
    "calls",
    "total_time_us",
    "avg_time_us",
    "max_time_us",
    "rows_sent",
    "rows_examined",
    "rows_affected",
    "tmp_tables",
    "tmp_disk_tables",
    "no_index_used",
    "organization_id",
    "instance_id",
  ],
  jsonColumns: [],
};

const QUERIES_ENGINE_TABLE_MAP: Record<string, string> = {
  mysql: "db_mysql_queries",
  mariadb: "db_mysql_queries",
  percona: "db_mysql_queries",
  postgresql: "db_postgresql_queries",
  clickhouse: "db_clickhouse_queries",
};

// ============================================================================
// ClickHouse Translator
// ============================================================================

export class ClickHouseTranslator extends BaseTranslator {
  private currentTarget: SignalTarget | "queries" | null = null;
  private queriesEngine: string | null = null;

  constructor(context: TranslationContext) {
    super(context);
  }

  getTargetDatabase(): "clickhouse" {
    return "clickhouse";
  }

  translate(ast: TfqlAstNode): TranslatorResult {
    this.reset();

    const sql = this.translateNode(ast);

    // Create parameterized version
    let parameterizedSql = sql;
    this.params.forEach((_, idx) => {
      parameterizedSql = parameterizedSql.replace(`{p${idx}}`, "?");
    });

    const tables: string[] = [];
    if (ast.type === "FETCH") {
      tables.push(this.getTableName(ast.target));
    } else if (ast.type === "CORRELATE") {
      tables.push(this.getTableName(ast.left.target));
      tables.push(this.getTableName(ast.right.target));
    }

    return {
      sql,
      params: this.params,
      parameterizedSql,
      metadata: this.buildMetadata(ast, tables),
    };
  }

  protected getFieldMappings(target: string): Map<string, FieldMapping> {
    const mappings = new Map<string, FieldMapping>();

    // Common mappings
    mappings.set("timestamp", { astField: "timestamp", dbColumn: "timestamp" });
    mappings.set("service", { astField: "service", dbColumn: "service_name" });
    mappings.set("service_name", {
      astField: "service_name",
      dbColumn: "service_name",
    });

    // Target-specific mappings
    switch (target) {
      case "metrics":
        mappings.set("name", { astField: "name", dbColumn: "metric_name" });
        mappings.set("metric_name", {
          astField: "metric_name",
          dbColumn: "metric_name",
        });
        break;
      case "logs":
        mappings.set("level", { astField: "level", dbColumn: "severity" });
        mappings.set("severity", {
          astField: "severity",
          dbColumn: "severity",
        });
        mappings.set("message", { astField: "message", dbColumn: "body" });
        mappings.set("body", { astField: "body", dbColumn: "body" });
        break;
      case "traces":
        mappings.set("name", { astField: "name", dbColumn: "span_name" });
        mappings.set("span_name", {
          astField: "span_name",
          dbColumn: "span_name",
        });
        mappings.set("duration", {
          astField: "duration",
          dbColumn: "duration_ns",
        });
        mappings.set("duration_ms", {
          astField: "duration_ms",
          dbColumn: "duration_ns",
          transform: () => "duration_ns / 1000000",
        });
        break;
      case "queries":
        mappings.set("query_id", { astField: "query_id", dbColumn: "digest" });
        mappings.set("fingerprint", {
          astField: "fingerprint",
          dbColumn: "digest_text",
        });
        mappings.set("schema", {
          astField: "schema",
          dbColumn: "schema_name",
        });
        mappings.set("avg_duration_us", {
          astField: "avg_duration_us",
          dbColumn: "avg_time_us",
        });
        mappings.set("max_duration_us", {
          astField: "max_duration_us",
          dbColumn: "max_time_us",
        });
        mappings.set("total_duration_us", {
          astField: "total_duration_us",
          dbColumn: "total_time_us",
        });
        mappings.set("avg_duration_ms", {
          astField: "avg_duration_ms",
          dbColumn: "avg_time_us",
          transform: () => "avg_time_us / 1000",
        });
        mappings.set("max_duration_ms", {
          astField: "max_duration_ms",
          dbColumn: "max_time_us",
          transform: () => "max_time_us / 1000",
        });
        mappings.set("total_duration_ms", {
          astField: "total_duration_ms",
          dbColumn: "total_time_us",
          transform: () => "total_time_us / 1000",
        });
        mappings.set("instance", {
          astField: "instance",
          dbColumn: "instance_id",
        });
        break;
    }

    return mappings;
  }

  protected getTableName(target: string): string {
    if (target === "queries") {
      if (this.queriesEngine && QUERIES_ENGINE_TABLE_MAP[this.queriesEngine]) {
        return QUERIES_ENGINE_TABLE_MAP[this.queriesEngine];
      }
      return QUERIES_TABLE_CONFIG.tableName;
    }

    const config = TABLE_CONFIGS[target as SignalTarget];
    if (!config) {
      throw new Error(
        `Unknown target: ${target}. Expected one of: ${Object.keys(TABLE_CONFIGS).join(", ")}, queries`,
      );
    }
    return config.tableName;
  }

  // ==========================================================================
  // FETCH Translation
  // ==========================================================================

  protected translateFetch(node: FetchNode): string {
    this.currentTarget = node.target as SignalTarget | "queries";
    this.queriesEngine = null;

    const isQueries = node.target === "queries";

    // For queries target, extract engine from filters to determine table
    let queriesTableName = QUERIES_TABLE_CONFIG.tableName;
    if (isQueries) {
      const engine = this.extractEngineFromFilter(node.filter);
      this.queriesEngine = engine;
      if (engine && QUERIES_ENGINE_TABLE_MAP[engine]) {
        queriesTableName = QUERIES_ENGINE_TABLE_MAP[engine];
      }
    }

    const config = isQueries
      ? { ...QUERIES_TABLE_CONFIG, tableName: queriesTableName }
      : TABLE_CONFIGS[this.currentTarget as SignalTarget];

    if (!config) {
      throw new Error(`Target '${node.target}' not supported for ClickHouse`);
    }

    const parts: string[] = ["SELECT"];

    // SELECT clause
    if (node.aggregation) {
      parts.push(this.translateAggregation(node.aggregation));
      if (node.groupBy) {
        parts.push(
          ", " +
            node.groupBy.fields.map((f) => this.translateField(f)).join(", "),
        );
      }
    } else if (node.fields && node.fields.length > 0) {
      parts.push(node.fields.map((f) => this.translateField(f)).join(", "));
    } else {
      parts.push(config.defaultColumns.join(", "));
    }

    // FROM clause — qualify with database prefix when available
    const qualifiedTable = this.context.database
      ? `${this.context.database}.${config.tableName}`
      : config.tableName;
    parts.push(`FROM ${qualifiedTable}`);

    // WHERE clause
    const whereConditions: string[] = [];

    // Always filter by organization
    whereConditions.push(
      `organization_id = ${this.addParameter(this.context.organizationId)}`,
    );

    // Workspace filter if provided
    if (this.context.workspaceId) {
      whereConditions.push(
        `workspace_id = ${this.addParameter(this.context.workspaceId)}`,
      );
    }

    // Time range
    if (node.timeRange) {
      whereConditions.push(this.translateTimeRange(node.timeRange));
    }

    // Custom filters
    if (node.filter) {
      whereConditions.push(this.translateFilter(node.filter));
    }

    parts.push(`WHERE ${whereConditions.join(" AND ")}`);

    // GROUP BY with interval for time series
    if (node.groupBy || node.interval) {
      const groupByFields: string[] = [];

      if (node.interval) {
        groupByFields.push(this.translateInterval(node.interval));
      }

      if (node.groupBy) {
        groupByFields.push(
          ...node.groupBy.fields.map((f) => this.translateField(f)),
        );
      }

      if (groupByFields.length > 0) {
        parts.push(`GROUP BY ${groupByFields.join(", ")}`);
      }
    }

    // ORDER BY
    if (node.orderBy) {
      parts.push(this.translateOrderBy(node.orderBy));
    } else if (node.interval) {
      // Default order by time bucket for time series
      parts.push("ORDER BY time_bucket ASC");
    }

    // LIMIT
    if (node.limit) {
      parts.push(this.translateLimit(node.limit));
    }

    // OFFSET
    if (node.offset) {
      parts.push(this.translateOffset(node.offset));
    }

    return parts.join(" ");
  }

  private extractEngineFromFilter(filter: import("../../domain/types/ast-nodes.types").FilterNode | undefined): string | null {
    if (!filter) return null;
    for (const condition of filter.conditions) {
      if (condition.type === "CONDITION") {
        const cond = condition as import("../../domain/types/ast-nodes.types").ConditionNode;
        if (cond.field === "engine" && typeof cond.value === "string") {
          return cond.value;
        }
      } else if (condition.type === "FILTER") {
        const engine = this.extractEngineFromFilter(condition as import("../../domain/types/ast-nodes.types").FilterNode);
        if (engine) return engine;
      }
    }
    return null;
  }

  // ==========================================================================
  // CORRELATE Translation
  // ==========================================================================

  protected translateCorrelate(node: CorrelateNode): string {
    const leftQuery = this.translateFetch(node.left);
    const rightQuery = this.translateFetch(node.right);

    const leftAlias = "left_signal";
    const rightAlias = "right_signal";

    let joinType: string;
    switch (node.joinType) {
      case "LEFT":
        joinType = "LEFT JOIN";
        break;
      case "RIGHT":
        joinType = "RIGHT JOIN";
        break;
      default:
        joinType = "INNER JOIN";
    }

    const joinCondition = `${leftAlias}.${node.joinField} = ${rightAlias}.${node.joinField}`;

    let sql = `
      SELECT *
      FROM (${leftQuery}) AS ${leftAlias}
      ${joinType} (${rightQuery}) AS ${rightAlias}
      ON ${joinCondition}
    `;

    // Add time range correlation if specified
    if (node.timeRange) {
      const timeCondition = this.translateTimeRangeForCorrelation(
        node,
        leftAlias,
        rightAlias,
      );
      sql += ` AND ${timeCondition}`;
    }

    return sql.trim().replace(/\s+/g, " ");
  }

  private translateTimeRangeForCorrelation(
    node: CorrelateNode,
    leftAlias: string,
    rightAlias: string,
  ): string {
    // Correlate signals within a time window
    return `abs(toUnixTimestamp(${leftAlias}.timestamp) - toUnixTimestamp(${rightAlias}.timestamp)) <= 300`;
  }

  // ==========================================================================
  // Time Translation
  // ==========================================================================

  protected translateTimeValue(value: TimeValue): string {
    if (value.type === "absolute") {
      return `toDateTime64('${value.value.toISOString()}', 3)`;
    }

    // Relative time
    const { value: amount, unit } = value;
    const intervalMap: Record<string, string> = {
      s: "SECOND",
      m: "MINUTE",
      h: "HOUR",
      d: "DAY",
      w: "WEEK",
      M: "MONTH",
      y: "YEAR",
    };

    const chUnit = intervalMap[unit] || "SECOND";
    return `now() - INTERVAL ${amount} ${chUnit}`;
  }

  protected translateInterval(node: IntervalNode): string {
    const { value, unit } = node;

    // Map to ClickHouse interval functions
    switch (unit) {
      case "s":
        return `toStartOfInterval(timestamp, INTERVAL ${value} SECOND) AS time_bucket`;
      case "m":
        if (value === 1) return "toStartOfMinute(timestamp) AS time_bucket";
        if (value === 5)
          return "toStartOfFiveMinutes(timestamp) AS time_bucket";
        if (value === 15)
          return "toStartOfFifteenMinutes(timestamp) AS time_bucket";
        return `toStartOfInterval(timestamp, INTERVAL ${value} MINUTE) AS time_bucket`;
      case "h":
        if (value === 1) return "toStartOfHour(timestamp) AS time_bucket";
        return `toStartOfInterval(timestamp, INTERVAL ${value} HOUR) AS time_bucket`;
      case "d":
        if (value === 1) return "toStartOfDay(timestamp) AS time_bucket";
        return `toStartOfInterval(timestamp, INTERVAL ${value} DAY) AS time_bucket`;
      default:
        return `toStartOfInterval(timestamp, INTERVAL ${value} SECOND) AS time_bucket`;
    }
  }

  // ==========================================================================
  // Aggregation Translation
  // ==========================================================================

  protected translateAggregationFunction(
    func: AggregationFunction | string,
    field: string,
    args?: unknown[],
  ): string {
    switch (func) {
      case "count":
        return field === "*" ? "count()" : `count(${field})`;
      case "sum":
        return `sum(${field})`;
      case "avg":
        return `avg(${field})`;
      case "min":
        return `min(${field})`;
      case "max":
        return `max(${field})`;

      // Rate functions
      case "rate":
        return `(max(${field}) - min(${field})) / (toUnixTimestamp(max(timestamp)) - toUnixTimestamp(min(timestamp)))`;
      case "increase":
        return `max(${field}) - min(${field})`;
      case "irate":
        // Instant rate - use last two points
        return `(last_value(${field}) - any(${field})) / (toUnixTimestamp(max(timestamp)) - toUnixTimestamp(min(timestamp)))`;
      case "delta":
        return `max(${field}) - min(${field})`;

      // Percentiles
      case "p50":
        return `quantile(0.50)(${field})`;
      case "p75":
        return `quantile(0.75)(${field})`;
      case "p90":
        return `quantile(0.90)(${field})`;
      case "p95":
        return `quantile(0.95)(${field})`;
      case "p99":
        return `quantile(0.99)(${field})`;
      case "histogram_quantile": {
        const quantile = args?.[0] ?? 0.95;
        return `quantile(${quantile})(${field})`;
      }

      // TopK/BottomK
      case "topk": {
        const topK = args?.[0] ?? 10;
        return `topK(${topK})(${field})`;
      }
      case "bottomk": {
        const bottomK = args?.[0] ?? 10;
        return `topKWeighted(${bottomK})(${field}, -1)`;
      }

      default:
        throw new Error(`Unsupported aggregation function: ${func}`);
    }
  }

  // ==========================================================================
  // Field Translation
  // ==========================================================================

  protected translateNestedField(field: string): string {
    const [parent, ...rest] = field.split(".");
    const jsonPath = rest.join(".");

    // Check if parent is a known JSON column
    const config = this.currentTarget
      ? this.currentTarget === "queries"
        ? QUERIES_TABLE_CONFIG
        : TABLE_CONFIGS[this.currentTarget]
      : null;
    const isJsonColumn = config?.jsonColumns.includes(parent);

    if (isJsonColumn) {
      // Use ClickHouse JSON extraction
      const safeJsonPath = jsonPath.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
      return `JSONExtractString(${parent}, '${safeJsonPath}')`;
    }

    // Regular nested field (might be a struct)
    return `${this.escapeIdentifier(parent)}.${this.escapeIdentifier(rest.join("."))}`;
  }

  protected translateRegex(
    field: string,
    pattern: string,
    negated: boolean,
  ): string {
    const escapedPattern = pattern
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'");
    const safeField = this.escapeIdentifier(field);
    const func = negated ? "NOT match" : "match";
    return `${func}(${safeField}, '${escapedPattern}')`;
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  protected getParameterPlaceholder(index: number): string {
    return `{p${index}}`;
  }

  protected escapeIdentifier(identifier: string): string {
    // ClickHouse uses backticks for identifiers with special characters
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
      return identifier;
    }
    return `\`${identifier.replace(/`/g, "``")}\``;
  }
}

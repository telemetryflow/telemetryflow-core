/**
 * PostgreSQL Translator
 * Translates TFQL AST to PostgreSQL for infrastructure resources (K8s, VMs, etc.)
 */

import {
  TfqlAstNode,
  FetchNode,
  CorrelateNode,
  TimeValue,
  IntervalNode,
  InfrastructureTarget,
  MonitoringTarget,
  AggregationFunction,
} from "../../domain/types/ast-nodes.types";
import {
  BaseTranslator,
  TranslatorResult,
  TranslationContext,
  FieldMapping,
} from "./BaseTranslator";

// ============================================================================
// PostgreSQL Table Schemas
// ============================================================================

interface PostgresTableConfig {
  tableName: string;
  schema: string;
  primaryKey: string;
  timestampColumn: string | null;
  defaultColumns: string[];
  jsonColumns: string[];
}

const TABLE_CONFIGS: Record<
  InfrastructureTarget | MonitoringTarget,
  PostgresTableConfig
> = {
  agents: {
    tableName: "agents",
    schema: "public",
    primaryKey: "id",
    timestampColumn: "last_heartbeat_at",
    defaultColumns: [
      "id",
      "name",
      "hostname",
      "ip_address",
      "status",
      "agent_version",
      "organization_id",
      "last_heartbeat_at",
    ],
    jsonColumns: ["metadata", "capabilities"],
  },
  vms: {
    tableName: "virtual_machines",
    schema: "public",
    primaryKey: "id",
    timestampColumn: "updated_at",
    defaultColumns: [
      "id",
      "name",
      "hostname",
      "status",
      "provider",
      "instance_type",
      "region",
      "organization_id",
    ],
    jsonColumns: ["tags", "metadata"],
  },
  clusters: {
    tableName: "kubernetes_clusters",
    schema: "public",
    primaryKey: "id",
    timestampColumn: "updated_at",
    defaultColumns: [
      "id",
      "name",
      "provider",
      "kubernetes_version",
      "status",
      "node_count",
      "organization_id",
    ],
    jsonColumns: ["metadata", "labels"],
  },
  namespaces: {
    tableName: "kubernetes_namespaces",
    schema: "public",
    primaryKey: "id",
    timestampColumn: "updated_at",
    defaultColumns: ["id", "name", "cluster_id", "status", "organization_id"],
    jsonColumns: ["labels", "annotations"],
  },
  nodes: {
    tableName: "kubernetes_nodes",
    schema: "public",
    primaryKey: "id",
    timestampColumn: "updated_at",
    defaultColumns: [
      "id",
      "name",
      "cluster_id",
      "status",
      "kubelet_version",
      "os_image",
      "container_runtime",
      "organization_id",
    ],
    jsonColumns: ["labels", "taints", "conditions", "capacity", "allocatable"],
  },
  pods: {
    tableName: "kubernetes_pods",
    schema: "public",
    primaryKey: "id",
    timestampColumn: "updated_at",
    defaultColumns: [
      "id",
      "name",
      "namespace_id",
      "node_id",
      "status",
      "phase",
      "restart_count",
      "organization_id",
    ],
    jsonColumns: ["labels", "annotations", "containers", "conditions"],
  },
  deployments: {
    tableName: "kubernetes_deployments",
    schema: "public",
    primaryKey: "id",
    timestampColumn: "updated_at",
    defaultColumns: [
      "id",
      "name",
      "namespace_id",
      "replicas",
      "ready_replicas",
      "available_replicas",
      "strategy",
      "organization_id",
    ],
    jsonColumns: ["labels", "annotations", "selector", "conditions"],
  },
  pvs: {
    tableName: "kubernetes_persistent_volumes",
    schema: "public",
    primaryKey: "id",
    timestampColumn: "updated_at",
    defaultColumns: [
      "id",
      "name",
      "cluster_id",
      "capacity",
      "access_modes",
      "reclaim_policy",
      "storage_class",
      "phase",
      "organization_id",
    ],
    jsonColumns: ["labels", "annotations", "claim_ref"],
  },
  pvcs: {
    tableName: "kubernetes_persistent_volume_claims",
    schema: "public",
    primaryKey: "id",
    timestampColumn: "updated_at",
    defaultColumns: [
      "id",
      "name",
      "namespace_id",
      "volume_name",
      "access_modes",
      "storage_class",
      "phase",
      "requested_storage",
      "organization_id",
    ],
    jsonColumns: ["labels", "annotations", "resources"],
  },
  monitors: {
    tableName: "uptime_monitors",
    schema: "public",
    primaryKey: "id",
    timestampColumn: "last_check_at",
    defaultColumns: [
      "id",
      "name",
      "url",
      "type",
      "status",
      "interval",
      "timeout",
      "is_active",
      "is_paused",
      "organization_id",
    ],
    jsonColumns: ["http_config", "tags", "notification_channels"],
  },
  status_pages: {
    tableName: "status_pages",
    schema: "public",
    primaryKey: "id",
    timestampColumn: "updated_at",
    defaultColumns: [
      "id",
      "title",
      "slug",
      "description",
      "is_public",
      "overall_status",
      "organization_id",
    ],
    jsonColumns: ["branding", "display_options"],
  },
  incidents: {
    tableName: "status_page_incidents",
    schema: "public",
    primaryKey: "id",
    timestampColumn: "created_at",
    defaultColumns: [
      "id",
      "status_page_id",
      "title",
      "impact",
      "status",
      "message",
      "organization_id",
    ],
    jsonColumns: ["affected_monitors", "updates"],
  },
  services: {
    tableName: "service_map_services",
    schema: "public",
    primaryKey: "id",
    timestampColumn: "updated_at",
    defaultColumns: [
      "id",
      "name",
      "type",
      "status",
      "version",
      "endpoint",
      "namespace",
      "environment",
      "organization_id",
    ],
    jsonColumns: ["tags", "metadata"],
  },
  service_dependencies: {
    tableName: "service_map_dependencies",
    schema: "public",
    primaryKey: "id",
    timestampColumn: "updated_at",
    defaultColumns: [
      "id",
      "source_service_id",
      "target_service_id",
      "type",
      "status",
      "protocol",
      "organization_id",
    ],
    jsonColumns: ["metadata"],
  },
  network_nodes: {
    tableName: "network_map_nodes",
    schema: "public",
    primaryKey: "id",
    timestampColumn: "updated_at",
    defaultColumns: [
      "id",
      "name",
      "type",
      "status",
      "ip_address",
      "hostname",
      "port",
      "namespace",
      "cluster",
      "region",
      "organization_id",
    ],
    jsonColumns: ["tags", "metadata"],
  },
  network_connections: {
    tableName: "network_map_connections",
    schema: "public",
    primaryKey: "id",
    timestampColumn: "updated_at",
    defaultColumns: [
      "id",
      "source_node_id",
      "target_node_id",
      "type",
      "status",
      "source_port",
      "target_port",
      "protocol",
      "organization_id",
    ],
    jsonColumns: ["metadata"],
  },
};

// ============================================================================
// PostgreSQL Translator
// ============================================================================

export class PostgresTranslator extends BaseTranslator {
  private currentTarget: InfrastructureTarget | MonitoringTarget | null = null;

  constructor(context: TranslationContext) {
    super(context);
  }

  getTargetDatabase(): "postgresql" {
    return "postgresql";
  }

  translate(ast: TfqlAstNode): TranslatorResult {
    this.reset();

    const sql = this.translateNode(ast);

    // Create parameterized version with $1, $2, etc.
    let parameterizedSql = sql;
    this.params.forEach((_, idx) => {
      parameterizedSql = parameterizedSql.replace(`$${idx + 1}`, `$${idx + 1}`);
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
    mappings.set("id", { astField: "id", dbColumn: "id" });
    mappings.set("name", { astField: "name", dbColumn: "name" });
    mappings.set("status", { astField: "status", dbColumn: "status" });

    // K8s specific mappings
    switch (target) {
      case "pods":
        mappings.set("namespace", {
          astField: "namespace",
          dbColumn: "namespace_id",
        });
        mappings.set("node", { astField: "node", dbColumn: "node_id" });
        mappings.set("restarts", {
          astField: "restarts",
          dbColumn: "restart_count",
        });
        break;
      case "nodes":
        mappings.set("cluster", {
          astField: "cluster",
          dbColumn: "cluster_id",
        });
        mappings.set("version", {
          astField: "version",
          dbColumn: "kubelet_version",
        });
        break;
      case "deployments":
        mappings.set("namespace", {
          astField: "namespace",
          dbColumn: "namespace_id",
        });
        mappings.set("ready", {
          astField: "ready",
          dbColumn: "ready_replicas",
        });
        mappings.set("available", {
          astField: "available",
          dbColumn: "available_replicas",
        });
        break;
      case "monitors":
        mappings.set("url", { astField: "url", dbColumn: "url" });
        mappings.set("type", { astField: "type", dbColumn: "type" });
        mappings.set("interval", {
          astField: "interval",
          dbColumn: "interval",
        });
        mappings.set("isActive", {
          astField: "isActive",
          dbColumn: "is_active",
        });
        mappings.set("isPaused", {
          astField: "isPaused",
          dbColumn: "is_paused",
        });
        break;
      case "services":
        mappings.set("type", { astField: "type", dbColumn: "type" });
        mappings.set("version", { astField: "version", dbColumn: "version" });
        mappings.set("endpoint", {
          astField: "endpoint",
          dbColumn: "endpoint",
        });
        mappings.set("namespace", {
          astField: "namespace",
          dbColumn: "namespace",
        });
        mappings.set("environment", {
          astField: "environment",
          dbColumn: "environment",
        });
        break;
      case "network_nodes":
        mappings.set("type", { astField: "type", dbColumn: "type" });
        mappings.set("ipAddress", {
          astField: "ipAddress",
          dbColumn: "ip_address",
        });
        mappings.set("hostname", {
          astField: "hostname",
          dbColumn: "hostname",
        });
        mappings.set("cluster", { astField: "cluster", dbColumn: "cluster" });
        mappings.set("region", { astField: "region", dbColumn: "region" });
        break;
    }

    return mappings;
  }

  protected getTableName(target: string): string {
    const config = TABLE_CONFIGS[target as InfrastructureTarget];
    if (!config) {
      throw new Error(
        `Unknown target: ${target}. Expected one of: ${Object.keys(TABLE_CONFIGS).join(", ")}`,
      );
    }
    return `${config.schema}.${config.tableName}`;
  }

  // ==========================================================================
  // FETCH Translation
  // ==========================================================================

  protected translateFetch(node: FetchNode): string {
    this.currentTarget = node.target as InfrastructureTarget | MonitoringTarget;
    const config = TABLE_CONFIGS[this.currentTarget];

    if (!config) {
      throw new Error(`Target '${node.target}' not supported for PostgreSQL`);
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

    // FROM clause
    parts.push(`FROM ${config.schema}.${config.tableName}`);

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

    // Time range (if table has timestamp column)
    if (node.timeRange && config.timestampColumn) {
      whereConditions.push(
        this.translateTimeRangeWithColumn(
          node.timeRange,
          config.timestampColumn,
        ),
      );
    }

    // Custom filters
    if (node.filter) {
      whereConditions.push(this.translateFilter(node.filter));
    }

    parts.push(`WHERE ${whereConditions.join(" AND ")}`);

    // GROUP BY
    if (node.groupBy) {
      parts.push(this.translateGroupBy(node.groupBy));
    }

    // ORDER BY
    if (node.orderBy) {
      parts.push(this.translateOrderBy(node.orderBy));
    } else if (config.timestampColumn) {
      // Default order by updated_at for infrastructure
      parts.push(`ORDER BY ${config.timestampColumn} DESC`);
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

  // ==========================================================================
  // CORRELATE Translation
  // ==========================================================================

  protected translateCorrelate(node: CorrelateNode): string {
    const leftQuery = this.translateFetch(node.left);
    const rightQuery = this.translateFetch(node.right);

    const leftAlias = "left_infra";
    const rightAlias = "right_infra";

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

    return `
      SELECT *
      FROM (${leftQuery}) AS ${leftAlias}
      ${joinType} (${rightQuery}) AS ${rightAlias}
      ON ${joinCondition}
    `
      .trim()
      .replace(/\s+/g, " ");
  }

  // ==========================================================================
  // Time Translation
  // ==========================================================================

  protected translateTimeValue(value: TimeValue): string {
    if (value.type === "absolute") {
      return `'${value.value.toISOString()}'::timestamptz`;
    }

    // Relative time
    const { value: amount, unit } = value;
    const intervalMap: Record<string, string> = {
      s: "seconds",
      m: "minutes",
      h: "hours",
      d: "days",
      w: "weeks",
      M: "months",
      y: "years",
    };

    const pgUnit = intervalMap[unit] || "seconds";
    return `NOW() - INTERVAL '${amount} ${pgUnit}'`;
  }

  private translateTimeRangeWithColumn(
    node: { from: TimeValue; to: TimeValue },
    column: string,
  ): string {
    const from = this.translateTimeValue(node.from);
    const to = this.translateTimeValue(node.to);
    return `${column} >= ${from} AND ${column} <= ${to}`;
  }

  protected translateInterval(node: IntervalNode): string {
    const { value, unit } = node;

    // PostgreSQL date_trunc or date_bin
    const unitMap: Record<string, string> = {
      s: "second",
      m: "minute",
      h: "hour",
      d: "day",
    };

    const pgUnit = unitMap[unit] || "minute";

    if (value === 1) {
      return `date_trunc('${pgUnit}', updated_at) AS time_bucket`;
    }

    // For non-1 intervals, use date_bin (PostgreSQL 14+)
    return `date_bin('${value} ${pgUnit}s', updated_at, TIMESTAMP '2000-01-01') AS time_bucket`;
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
        return field === "*" ? "COUNT(*)" : `COUNT(${field})`;
      case "sum":
        return `SUM(${field})`;
      case "avg":
        return `AVG(${field})`;
      case "min":
        return `MIN(${field})`;
      case "max":
        return `MAX(${field})`;

      // Percentiles (using PostgreSQL percentile_cont)
      case "p50":
        return `PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY ${field})`;
      case "p75":
        return `PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY ${field})`;
      case "p90":
        return `PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY ${field})`;
      case "p95":
        return `PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY ${field})`;
      case "p99":
        return `PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY ${field})`;
      case "histogram_quantile": {
        const quantile = args?.[0] ?? 0.95;
        return `PERCENTILE_CONT(${quantile}) WITHIN GROUP (ORDER BY ${field})`;
      }

      // Rate functions - less meaningful for infrastructure but supported
      case "rate":
      case "increase":
      case "delta":
        return `MAX(${field}) - MIN(${field})`;

      default:
        throw new Error(
          `Unsupported aggregation function for PostgreSQL: ${func}`,
        );
    }
  }

  // ==========================================================================
  // Field Translation
  // ==========================================================================

  protected translateNestedField(field: string): string {
    const [parent, ...rest] = field.split(".");

    // Check if parent is a known JSON column
    const config = this.currentTarget
      ? TABLE_CONFIGS[this.currentTarget]
      : null;
    const isJsonColumn = config?.jsonColumns.includes(parent);

    if (isJsonColumn) {
      // Use PostgreSQL JSONB extraction
      // labels.env -> labels->>'env'
      if (rest.length === 1) {
        return `${parent}->>'${rest[0]}'`;
      }
      // Deep path: labels.kubernetes.io/name -> labels#>>'{kubernetes.io,name}'
      return `${parent}#>>'{${rest.join(",")}}'`;
    }

    // Regular nested field
    return `"${parent}"."${rest.join(".")}"`;
  }

  protected translateRegex(
    field: string,
    pattern: string,
    negated: boolean,
  ): string {
    const operator = negated ? "!~" : "~";
    return `${field} ${operator} '${pattern.replace(/'/g, "''")}'`;
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  protected getParameterPlaceholder(index: number): string {
    return `$${index + 1}`;
  }

  protected escapeIdentifier(identifier: string): string {
    // PostgreSQL uses double quotes for identifiers
    if (/^[a-z_][a-z0-9_]*$/.test(identifier)) {
      return identifier;
    }
    return `"${identifier.replace(/"/g, '""')}"`;
  }
}

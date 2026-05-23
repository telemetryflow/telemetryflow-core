/**
 * Query Definition Value Object
 * TASK-03: TFQL Integration for Alert Rules
 *
 * Supports multiple query languages:
 * - condition: Legacy simple conditions
 * - tfql: TelemetryFlow Query Language
 * - promql: Prometheus Query Language
 * - elasticsearch: Elasticsearch DSL
 * - sql: Direct SQL queries
 */

import { AlertCondition, AlertConditionProps } from "./AlertCondition";

/**
 * Query Language Enum
 */
export enum QueryLanguage {
  CONDITION = "condition", // Legacy simple conditions
  TFQL = "tfql",
  PROMQL = "promql",
  ELASTICSEARCH = "elasticsearch",
  SQL = "sql",
}

/**
 * Alert Source Type Enum
 * Identifies the source/origin of the alert data
 */
export enum AlertSourceType {
  PROMETHEUS = "prometheus", // Traditional Prometheus alerts
  TFO_AGENT = "tfo-agent", // TelemetryFlow Agent (host metrics)
  TFO_COLLECTOR = "tfo-collector", // TelemetryFlow OTEL Collector
  CUSTOM = "custom", // Custom alert source
}

/**
 * Query Target Enum
 * TFQL fetch targets
 */
export enum QueryTarget {
  METRICS = "metrics",
  LOGS = "logs",
  TRACES = "traces",
  EXEMPLARS = "exemplars",
  CORRELATIONS = "correlations",
  AGENTS = "agents",
}

/**
 * AST Node type (simplified)
 */
export interface TfqlAstNode {
  type: string;
  target?: string;
  filters?: Array<{
    field: string;
    operator: string;
    value: unknown;
  }>;
  aggregations?: Array<{
    function: string;
    field?: string;
    alias?: string;
  }>;
  groupBy?: string[];
  orderBy?: Array<{
    field: string;
    direction: "asc" | "desc";
  }>;
  limit?: number;
  timerange?: {
    type: "relative" | "absolute";
    value?: string;
    from?: string;
    to?: string;
    timezone?: string;
  };
  interval?: string;
}

/**
 * Query Definition Props
 */
export interface QueryDefinitionProps {
  language: QueryLanguage;
  query?: string; // Raw query string (TFQL/PromQL)
  target?: QueryTarget; // Fetch target
  ast?: TfqlAstNode; // Parsed AST
  conditions?: AlertConditionProps[]; // Legacy conditions
  sourceType: AlertSourceType;
}

/**
 * Query Definition Value Object
 */
export class QueryDefinition {
  private constructor(
    private readonly language: QueryLanguage,
    private readonly sourceType: AlertSourceType,
    private readonly query?: string,
    private readonly target?: QueryTarget,
    private readonly ast?: TfqlAstNode,
    private readonly conditions?: AlertCondition[],
  ) {}

  /**
   * Create a QueryDefinition from props
   */
  static create(props: QueryDefinitionProps): QueryDefinition {
    if (!props.language) {
      throw new Error("Query language is required");
    }

    if (!props.sourceType) {
      throw new Error("Source type is required");
    }

    // Validate based on language type
    if (props.language === QueryLanguage.CONDITION) {
      if (!props.conditions || props.conditions.length === 0) {
        throw new Error("Conditions are required for condition-based queries");
      }
    } else {
      if (!props.query) {
        throw new Error("Query string is required for non-condition queries");
      }
    }

    const conditions = props.conditions?.map((c) => AlertCondition.create(c));

    return new QueryDefinition(
      props.language,
      props.sourceType,
      props.query,
      props.target,
      props.ast,
      conditions,
    );
  }

  /**
   * Create a TFQL-based QueryDefinition
   */
  static fromTfql(query: string, sourceType: AlertSourceType): QueryDefinition {
    if (!query) {
      throw new Error("TFQL query string is required");
    }

    // Basic target detection from query
    const targetMatch = query.match(/FETCH\s+(\w+)/i);
    const target = targetMatch
      ? (targetMatch[1].toLowerCase() as QueryTarget)
      : undefined;

    return new QueryDefinition(
      QueryLanguage.TFQL,
      sourceType,
      query,
      target,
      undefined, // AST would be parsed by TFQL parser
      undefined,
    );
  }

  /**
   * Create a PromQL-based QueryDefinition
   */
  static fromPromql(
    query: string,
    sourceType: AlertSourceType = AlertSourceType.PROMETHEUS,
  ): QueryDefinition {
    if (!query) {
      throw new Error("PromQL query string is required");
    }

    return new QueryDefinition(
      QueryLanguage.PROMQL,
      sourceType,
      query,
      QueryTarget.METRICS, // PromQL is always metrics
      undefined,
      undefined,
    );
  }

  /**
   * Create a legacy condition-based QueryDefinition
   */
  static fromConditions(
    conditions: AlertConditionProps[],
    sourceType: AlertSourceType = AlertSourceType.PROMETHEUS,
  ): QueryDefinition {
    if (!conditions || conditions.length === 0) {
      throw new Error("At least one condition is required");
    }

    const alertConditions = conditions.map((c) => AlertCondition.create(c));

    return new QueryDefinition(
      QueryLanguage.CONDITION,
      sourceType,
      undefined,
      QueryTarget.METRICS,
      undefined,
      alertConditions,
    );
  }

  /**
   * Convert from JSON
   */
  static fromJSON(json: QueryDefinitionProps): QueryDefinition {
    return QueryDefinition.create(json);
  }

  /**
   * Convert to JSON
   */
  toJSON(): QueryDefinitionProps {
    return {
      language: this.language,
      query: this.query,
      target: this.target,
      ast: this.ast,
      conditions: this.conditions?.map((c) => c.toJSON()),
      sourceType: this.sourceType,
    };
  }

  // Getters
  getLanguage(): QueryLanguage {
    return this.language;
  }

  getSourceType(): AlertSourceType {
    return this.sourceType;
  }

  getQuery(): string | undefined {
    return this.query;
  }

  getTarget(): QueryTarget | undefined {
    return this.target;
  }

  getAst(): TfqlAstNode | undefined {
    return this.ast;
  }

  getConditions(): AlertCondition[] {
    return this.conditions ? [...this.conditions] : [];
  }

  // Type checks
  isTfql(): boolean {
    return this.language === QueryLanguage.TFQL;
  }

  isPromql(): boolean {
    return this.language === QueryLanguage.PROMQL;
  }

  isLegacyCondition(): boolean {
    return this.language === QueryLanguage.CONDITION;
  }

  isTfoAgent(): boolean {
    return this.sourceType === AlertSourceType.TFO_AGENT;
  }

  isTfoCollector(): boolean {
    return this.sourceType === AlertSourceType.TFO_COLLECTOR;
  }

  /**
   * Convert legacy conditions to TFQL syntax
   */
  toTfql(): string {
    if (this.language === QueryLanguage.TFQL) {
      return this.query!;
    }

    if (this.language === QueryLanguage.CONDITION && this.conditions) {
      return this.conditionsToTfql(this.conditions);
    }

    if (this.language === QueryLanguage.PROMQL) {
      // Basic PromQL to TFQL conversion
      const escapedPromql = this.query
        ?.replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"');
      return `-- Converted from PromQL\n-- Original: ${this.query}\nFETCH metrics\nWHERE promql_expr = "${escapedPromql}"`;
    }

    return "";
  }

  /**
   * Convert conditions array to TFQL syntax
   */
  private conditionsToTfql(conditions: AlertCondition[]): string {
    if (conditions.length === 0) return "";

    const condition = conditions[0];
    const metric = condition.getMetric();
    const aggregation = condition.getAggregation();
    const operator = condition.getOperator();
    const threshold = condition.getThreshold();
    const duration = condition.getDuration();
    const labels = condition.getLabels();

    let tfql = `FETCH metrics WHERE name = "${metric}"`;

    // Add label filters
    Object.entries(labels).forEach(([key, value]) => {
      tfql += `\n  AND ${key} = "${value}"`;
    });

    // Add aggregation
    tfql += `\n| ${aggregation}()`;

    // Add threshold comparison
    const operatorMap: Record<string, string> = {
      gt: ">",
      gte: ">=",
      lt: "<",
      lte: "<=",
      eq: "=",
      neq: "!=",
    };
    tfql += ` ${operatorMap[operator] || operator} ${threshold}`;

    // Add duration
    tfql += `\nFOR ${duration}`;

    return tfql;
  }

  /**
   * Build a human-readable description
   */
  describe(): string {
    if (this.isLegacyCondition() && this.conditions) {
      return this.conditions.map((c) => c.describe()).join(" AND ");
    }

    if (this.query) {
      return `${this.language.toUpperCase()}: ${this.query.substring(0, 100)}${this.query.length > 100 ? "..." : ""}`;
    }

    return `${this.language} query (${this.sourceType})`;
  }

  /**
   * Create a copy with updated AST
   */
  withParsedAst(ast: TfqlAstNode): QueryDefinition {
    return new QueryDefinition(
      this.language,
      this.sourceType,
      this.query,
      this.target,
      ast,
      this.conditions,
    );
  }
}

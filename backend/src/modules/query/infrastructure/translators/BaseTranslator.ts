/**
 * Base Translator
 * Abstract base class for translating TFQL AST to database-specific queries
 */

import {
  TfqlAstNode,
  FetchNode,
  CorrelateNode,
  SubqueryNode,
  FilterNode,
  ConditionNode,
  AggregationNode,
  TimeRangeNode,
  GroupByNode,
  OrderByNode,
  LimitNode,
  OffsetNode,
  IntervalNode,
  TimeValue,
  ComparisonOperator,
} from "../../domain/types/ast-nodes.types";

// ============================================================================
// Types
// ============================================================================

export interface TranslationContext {
  organizationId: string;
  workspaceId?: string;
  tenantId?: string;
  timezone?: string;
  /** ClickHouse database name for qualifying table references (e.g. "telemetryflow_db") */
  database?: string;
  parameters: Map<string, unknown>;
}

export interface TranslatorResult {
  sql: string;
  params: unknown[];
  parameterizedSql: string;
  metadata: TranslationMetadata;
}

export interface TranslationMetadata {
  targetDatabase: "clickhouse" | "postgresql";
  estimatedComplexity: "low" | "medium" | "high";
  usesAggregation: boolean;
  usesTimeRange: boolean;
  usesGroupBy: boolean;
  tables: string[];
  warnings?: string[];
}

export interface FieldMapping {
  astField: string;
  dbColumn: string;
  transform?: (value: unknown) => string;
}

// ============================================================================
// Base Translator
// ============================================================================

export abstract class BaseTranslator {
  protected readonly context: TranslationContext;
  protected paramIndex: number = 0;
  protected params: unknown[] = [];

  constructor(context: TranslationContext) {
    this.context = context;
  }

  /**
   * Translate TFQL AST to database query
   */
  abstract translate(ast: TfqlAstNode): TranslatorResult;

  /**
   * Get the target database type
   */
  abstract getTargetDatabase(): "clickhouse" | "postgresql";

  /**
   * Get field mappings for the target
   */
  protected abstract getFieldMappings(
    target: string,
  ): Map<string, FieldMapping>;

  /**
   * Get table name for target
   */
  protected abstract getTableName(target: string): string;

  // ==========================================================================
  // Common Translation Methods
  // ==========================================================================

  protected translateNode(node: TfqlAstNode): string {
    switch (node.type) {
      case "FETCH":
        return this.translateFetch(node);
      case "CORRELATE":
        return this.translateCorrelate(node);
      case "SUBQUERY":
        return this.translateSubquery(node);
      default:
        throw new Error(`Unknown node type: ${(node as TfqlAstNode).type}`);
    }
  }

  protected abstract translateFetch(node: FetchNode): string;
  protected abstract translateCorrelate(node: CorrelateNode): string;

  protected translateSubquery(node: SubqueryNode): string {
    const innerQuery = this.translateNode(node.query);
    return `(${innerQuery}) AS ${this.escapeIdentifier(node.alias)}`;
  }

  // ==========================================================================
  // Filter Translation
  // ==========================================================================

  protected translateFilter(node: FilterNode): string {
    const conditions = node.conditions.map((cond) => {
      if (cond.type === "FILTER") {
        return `(${this.translateFilter(cond)})`;
      }
      return this.translateCondition(cond);
    });

    return conditions.join(` ${node.logicalOperator} `);
  }

  protected translateCondition(node: ConditionNode): string {
    const field = this.translateField(node.field);
    const operator = this.translateOperator(node.operator);
    const value = this.addParameter(node.value);

    if (node.negated) {
      return `NOT (${field} ${operator} ${value})`;
    }

    // Handle special operators
    switch (node.operator) {
      case "IN":
      case "NOT IN":
        if (Array.isArray(node.value)) {
          const values = node.value.map((v) => this.addParameter(v));
          return `${field} ${operator} (${values.join(", ")})`;
        }
        return `${field} ${operator} (${value})`;

      case "LIKE":
      case "NOT LIKE":
        return `${field} ${operator} ${value}`;

      case "REGEX":
      case "NOT REGEX":
        return this.translateRegex(
          field,
          node.value as string,
          node.operator === "NOT REGEX",
        );

      default:
        return `${field} ${operator} ${value}`;
    }
  }

  protected abstract translateRegex(
    field: string,
    pattern: string,
    negated: boolean,
  ): string;

  protected translateOperator(op: ComparisonOperator): string {
    const operatorMap: Record<ComparisonOperator, string> = {
      "=": "=",
      "!=": "!=",
      ">": ">",
      "<": "<",
      ">=": ">=",
      "<=": "<=",
      IN: "IN",
      "NOT IN": "NOT IN",
      LIKE: "LIKE",
      "NOT LIKE": "NOT LIKE",
      REGEX: "REGEX",
      "NOT REGEX": "NOT REGEX",
    };
    return operatorMap[op] || op;
  }

  // ==========================================================================
  // Time Range Translation
  // ==========================================================================

  protected translateTimeRange(node: TimeRangeNode): string {
    const from = this.translateTimeValue(node.from);
    const to = this.translateTimeValue(node.to);
    return `timestamp >= ${from} AND timestamp <= ${to}`;
  }

  protected abstract translateTimeValue(value: TimeValue): string;

  // ==========================================================================
  // Aggregation Translation
  // ==========================================================================

  protected translateAggregation(node: AggregationNode): string {
    const field = this.translateField(node.field);
    const func = this.translateAggregationFunction(
      node.function,
      field,
      node.args,
    );

    if (node.alias) {
      return `${func} AS ${this.escapeIdentifier(node.alias)}`;
    }
    return func;
  }

  protected abstract translateAggregationFunction(
    func: string,
    field: string,
    args?: unknown[],
  ): string;

  // ==========================================================================
  // Group By Translation
  // ==========================================================================

  protected translateGroupBy(node: GroupByNode): string {
    const fields = node.fields.map((f) => this.translateField(f));
    return `GROUP BY ${fields.join(", ")}`;
  }

  // ==========================================================================
  // Order By Translation
  // ==========================================================================

  protected translateOrderBy(node: OrderByNode): string {
    const clauses = node.clauses.map((clause) => {
      const field = this.translateField(clause.field);
      return `${field} ${clause.order}`;
    });
    return `ORDER BY ${clauses.join(", ")}`;
  }

  // ==========================================================================
  // Limit/Offset Translation
  // ==========================================================================

  protected translateLimit(node: LimitNode): string {
    const param = this.addParameter(Math.max(0, Math.floor(Number(node.value))));
    return `LIMIT ${param}`;
  }

  protected translateOffset(node: OffsetNode): string {
    const param = this.addParameter(Math.max(0, Math.floor(Number(node.value))));
    return `OFFSET ${param}`;
  }

  // ==========================================================================
  // Interval Translation
  // ==========================================================================

  protected abstract translateInterval(node: IntervalNode): string;

  // ==========================================================================
  // Field Translation
  // ==========================================================================

  protected translateField(field: string): string {
    // Handle nested fields (e.g., labels.env, attributes.service_name)
    if (field.includes(".")) {
      return this.translateNestedField(field);
    }
    return this.escapeIdentifier(field);
  }

  protected abstract translateNestedField(field: string): string;

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  protected addParameter(value: unknown): string {
    this.params.push(value);
    return this.getParameterPlaceholder(this.paramIndex++);
  }

  protected abstract getParameterPlaceholder(index: number): string;

  protected abstract escapeIdentifier(identifier: string): string;

  protected escapeString(value: string): string {
    return value.replace(/'/g, "''");
  }

  protected reset(): void {
    this.paramIndex = 0;
    this.params = [];
  }

  protected buildMetadata(
    node: TfqlAstNode,
    tables: string[],
  ): TranslationMetadata {
    const fetchNode = node.type === "FETCH" ? node : null;

    return {
      targetDatabase: this.getTargetDatabase(),
      estimatedComplexity: this.estimateComplexity(node),
      usesAggregation: fetchNode?.aggregation !== undefined,
      usesTimeRange: fetchNode?.timeRange !== undefined,
      usesGroupBy: fetchNode?.groupBy !== undefined,
      tables,
    };
  }

  protected estimateComplexity(node: TfqlAstNode): "low" | "medium" | "high" {
    if (node.type === "CORRELATE") {
      return "high";
    }

    if (node.type === "FETCH") {
      const hasAggregation = node.aggregation !== undefined;
      const hasGroupBy = node.groupBy !== undefined;
      const hasComplexFilter = this.hasComplexFilter(node.filter);

      if (hasAggregation && hasGroupBy && hasComplexFilter) {
        return "high";
      }
      if (hasAggregation || hasGroupBy) {
        return "medium";
      }
    }

    return "low";
  }

  protected hasComplexFilter(filter?: FilterNode): boolean {
    if (!filter) return false;

    // More than 3 conditions or nested filters = complex
    if (filter.conditions.length > 3) return true;

    return filter.conditions.some((c) => c.type === "FILTER");
  }
}

import { BaseQueryBuilder } from "../base/BaseQueryBuilder";
import { QueryCondition } from "../../../domain/interfaces/IQueryBuilder";

/**
 * Built PostgreSQL Query
 */
export interface BuiltPostgresQuery {
  sql: string;
  params: Record<string, unknown>;
}

/**
 * PostgreSQL Query Result
 */
export interface PostgresQueryResult<T> {
  data: T[];
  total: number;
}

/**
 * Abstract PostgreSQL Query Builder
 * Base class for all PostgreSQL-based infrastructure queries
 */
export abstract class PostgresQueryBuilder<T> extends BaseQueryBuilder<
  BuiltPostgresQuery,
  PostgresQueryResult<T>
> {
  protected tableName: string;

  constructor(tableName: string) {
    super();
    this.tableName = tableName;
  }

  /**
   * Build the complete SQL query
   */
  build(): BuiltPostgresQuery {
    const selectClause = this.buildSelectClause();
    const { sql: whereClause, params } = this.buildWhereClause();
    const groupByClause = this.buildGroupByClause();
    const orderByClause = this.buildOrderByClause();
    const limitClause = this.buildLimitClause(params);

    let sql = `${selectClause} FROM ${this.tableName}`;

    if (whereClause) {
      sql += ` ${whereClause}`;
    }

    if (groupByClause) {
      sql += ` ${groupByClause}`;
    }

    if (orderByClause) {
      sql += ` ${orderByClause}`;
    }

    if (limitClause) {
      sql += ` ${limitClause}`;
    }

    return { sql, params };
  }

  /**
   * Build SELECT clause
   */
  protected buildSelectClause(): string {
    if (this.aggregations.length > 0) {
      const aggFields = this.aggregations.map((agg) => {
        const alias = agg.alias || agg.field;
        switch (agg.type) {
          case "count":
            return `COUNT(${agg.field}) AS ${alias}`;
          case "sum":
            return `SUM(${agg.field}) AS ${alias}`;
          case "avg":
            return `AVG(${agg.field}) AS ${alias}`;
          case "min":
            return `MIN(${agg.field}) AS ${alias}`;
          case "max":
            return `MAX(${agg.field}) AS ${alias}`;
          default:
            return `${agg.type}(${agg.field}) AS ${alias}`;
        }
      });

      if (this.groupByFields.length > 0) {
        return `SELECT ${this.groupByFields.join(", ")}, ${aggFields.join(", ")}`;
      }

      return `SELECT ${aggFields.join(", ")}`;
    }

    if (this.selectFields.length > 0) {
      return `SELECT ${this.selectFields.join(", ")}`;
    }

    return `SELECT *`;
  }

  /**
   * Build WHERE clause with tenant context
   */
  protected buildWhereClause(): {
    sql: string;
    params: Record<string, unknown>;
  } {
    const conditions: string[] = [];
    const params: Record<string, unknown> = {};
    let paramIndex = 0;

    // Add tenant context conditions
    if (this.tenantContextValue) {
      const paramName = `org_${paramIndex++}`;
      conditions.push(`organization_id = $${paramName}`);
      params[paramName] = this.tenantContextValue.organizationId;

      if (this.tenantContextValue.workspaceId) {
        const paramName = `ws_${paramIndex++}`;
        conditions.push(`workspace_id = $${paramName}`);
        params[paramName] = this.tenantContextValue.workspaceId;
      }

      if (this.tenantContextValue.tenantId) {
        const paramName = `tenant_${paramIndex++}`;
        conditions.push(`tenant_id = $${paramName}`);
        params[paramName] = this.tenantContextValue.tenantId;
      }
    }

    // Add time range conditions
    if (this.timeRangeValue) {
      const fromParam = `from_${paramIndex++}`;
      const toParam = `to_${paramIndex++}`;
      conditions.push(`created_at >= $${fromParam}`);
      conditions.push(`created_at <= $${toParam}`);
      params[fromParam] = this.timeRangeValue.from;
      params[toParam] = this.timeRangeValue.to;
    }

    // Add WHERE conditions
    for (const condition of this.whereConditions) {
      const { sql, param } = this.buildCondition(condition, paramIndex);
      conditions.push(sql);
      if (param) {
        params[`param_${paramIndex}`] = param;
        paramIndex++;
      }
    }

    if (conditions.length === 0) {
      return { sql: "", params };
    }

    return {
      sql: `WHERE ${conditions.join(" AND ")}`,
      params,
    };
  }

  /**
   * Build a single condition
   */
  protected buildCondition(
    condition: QueryCondition,
    paramIndex: number,
  ): { sql: string; param?: unknown } {
    const paramName = `param_${paramIndex}`;
    const operator = this.formatOperator(condition.operator);

    switch (condition.operator) {
      case "IN":
      case "NOT IN":
        return {
          sql: `${condition.field} ${operator} ($${paramName})`,
          param: condition.value,
        };
      case "LIKE":
      case "NOT LIKE":
        return {
          sql: `${condition.field} ${operator} $${paramName}`,
          param: `%${condition.value}%`,
        };
      case "REGEX":
        return {
          sql: `${condition.field} ~ $${paramName}`,
          param: condition.value,
        };
      case "NOT REGEX":
        return {
          sql: `${condition.field} !~ $${paramName}`,
          param: condition.value,
        };
      default:
        return {
          sql: `${condition.field} ${operator} $${paramName}`,
          param: condition.value,
        };
    }
  }

  /**
   * Build GROUP BY clause
   */
  protected buildGroupByClause(): string {
    if (this.groupByFields.length === 0) {
      return "";
    }
    return `GROUP BY ${this.groupByFields.join(", ")}`;
  }

  /**
   * Build ORDER BY clause
   */
  protected buildOrderByClause(): string {
    if (this.orderByFields.length === 0) {
      return "";
    }

    const orderClauses = this.orderByFields.map(
      (field) => `${field.field} ${field.order}`,
    );

    return `ORDER BY ${orderClauses.join(", ")}`;
  }

  /**
   * Build LIMIT/OFFSET clause with parameterized values
   */
  protected buildLimitClause(params: Record<string, unknown>): string {
    const clauses: string[] = [];

    if (this.limitValue !== null) {
      params.__limit = this.limitValue;
      clauses.push("LIMIT $__limit");
    }

    if (this.offsetValue !== null) {
      params.__offset = this.offsetValue;
      clauses.push("OFFSET $__offset");
    }

    return clauses.join(" ");
  }

  /**
   * Execute the query (to be implemented by concrete classes)
   */
  abstract execute(): Promise<PostgresQueryResult<T>>;
}

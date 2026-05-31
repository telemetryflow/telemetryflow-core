import { PostgresQueryBuilder } from '../infrastructure/query-builders/postgres/PostgresQueryBuilder';
import { TenantContext } from '../domain/value-objects/TenantContext';
import { TimeRange } from '../domain/value-objects/TimeRange';
import { AggregationType, SortOrder } from '../domain/value-objects/AggregationInterval';

class TestQueryBuilder extends PostgresQueryBuilder<any> {
  constructor() {
    super('test_table');
  }

  async execute(): Promise<any> {
    return { data: [], total: 0 };
  }
}

describe('PostgresQueryBuilder', () => {
  let builder: TestQueryBuilder;

  beforeEach(() => {
    builder = new TestQueryBuilder();
  });

  describe('Tenant Context', () => {
    it('should set tenant context', () => {
      const ctx = TenantContext.create({
        organizationId: 'org-123',
        workspaceId: 'ws-456',
      });

      const result = builder.tenantContext(ctx);

      expect(result).toBe(builder);
    });

    it('should include organization_id in WHERE clause', () => {
      const ctx = TenantContext.create({
        organizationId: 'org-123',
      });

      builder.tenantContext(ctx);
      const { sql, params } = builder.build();

      expect(sql).toContain('organization_id');
      const orgValues = Object.values(params).filter(v => v === 'org-123');
      expect(orgValues.length).toBeGreaterThanOrEqual(1);
    });

    it('should include workspace_id when provided', () => {
      const ctx = TenantContext.create({
        organizationId: 'org-123',
        workspaceId: 'ws-456',
      });

      builder.tenantContext(ctx);
      const { sql, params } = builder.build();

      expect(sql).toContain('workspace_id');
      const wsValues = Object.values(params).filter(v => v === 'ws-456');
      expect(wsValues.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Time Range', () => {
    it('should set time range', () => {
      const range = TimeRange.lastHours(24);
      const result = builder.timeRange(range);

      expect(result).toBe(builder);
    });

    it('should include time range in WHERE clause', () => {
      const range = TimeRange.lastHours(24);
      builder.timeRange(range);
      const { sql, params } = builder.build();

      expect(sql).toContain('created_at >=');
      expect(sql).toContain('created_at <=');
      const fromKeys = Object.keys(params).filter(k => k.startsWith('from_'));
      const toKeys = Object.keys(params).filter(k => k.startsWith('to_'));
      expect(fromKeys.length).toBeGreaterThanOrEqual(1);
      expect(toKeys.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('WHERE Conditions', () => {
    it('should add simple WHERE condition', () => {
      builder.andWhere({
        field: 'status',
        operator: '=',
        value: 'active',
      });

      const { sql, params } = builder.build();

      expect(sql).toContain('status =');
      const paramValues = Object.values(params);
      expect(paramValues).toContain('active');
    });

    it('should add LIKE condition', () => {
      builder.andWhere({
        field: 'name',
        operator: 'LIKE',
        value: 'test%',
      });

      const { sql, params } = builder.build();

      expect(sql).toContain('name LIKE');
      const paramValues = Object.values(params);
      expect(paramValues).toContain('%test%%');
    });

    it('should add IN condition', () => {
      builder.andWhere({
        field: 'type',
        operator: 'IN',
        value: ['http', 'tcp', 'dns'],
      });

      const { sql, params } = builder.build();

      expect(sql).toContain('type IN');
      const paramValues = Object.values(params);
      expect(paramValues).toContainEqual(['http', 'tcp', 'dns']);
    });

    it('should add multiple WHERE conditions', () => {
      builder
        .andWhere({
          field: 'status',
          operator: '=',
          value: 'active',
        })
        .andWhere({
          field: 'type',
          operator: '=',
          value: 'http',
        });

      const { sql, params } = builder.build();

      expect(sql).toContain('status =');
      expect(sql).toContain('type =');
      const paramValues = Object.values(params);
      expect(paramValues).toContain('active');
      expect(paramValues).toContain('http');
    });
  });

  describe('SELECT Clause', () => {
    it('should select all columns by default', () => {
      const { sql } = builder.build();

      expect(sql).toContain('SELECT *');
      expect(sql).toContain('FROM test_table');
    });

    it('should select specific columns', () => {
      builder.select('id', 'name', 'status');
      const { sql } = builder.build();

      expect(sql).toContain('SELECT id, name, status');
    });
  });

  describe('GROUP BY', () => {
    it('should add GROUP BY clause', () => {
      builder.groupBy('status', 'type');
      const { sql } = builder.build();

      expect(sql).toContain('GROUP BY status, type');
    });
  });

  describe('ORDER BY', () => {
    it('should add ORDER BY clause', () => {
      builder.orderBy('created_at', SortOrder.DESC);
      const { sql } = builder.build();

      expect(sql).toContain('ORDER BY created_at DESC');
    });

    it('should default to DESC order', () => {
      builder.orderBy('name');
      const { sql } = builder.build();

      expect(sql).toContain('ORDER BY name DESC');
    });
  });

  describe('Pagination', () => {
    it('should add LIMIT clause', () => {
      builder.limit(50);
      const { sql, params } = builder.build();

      expect(sql).toContain('LIMIT $__limit');
      expect(params.__limit).toBe(50);
    });

    it('should add OFFSET clause', () => {
      builder.offset(100);
      const { sql, params } = builder.build();

      expect(sql).toContain('OFFSET $__offset');
      expect(params.__offset).toBe(100);
    });

    it('should add both LIMIT and OFFSET', () => {
      builder.limit(25).offset(50);
      const { sql, params } = builder.build();

      expect(sql).toContain('LIMIT $__limit');
      expect(sql).toContain('OFFSET $__offset');
      expect(params.__limit).toBe(25);
      expect(params.__offset).toBe(50);
    });
  });

  describe('Aggregations', () => {
    it('should add COUNT aggregation', () => {
      builder.aggregate(AggregationType.COUNT, '*', 'total');
      const { sql } = builder.build();

      expect(sql).toContain('COUNT(*) AS total');
    });

    it('should add AVG aggregation', () => {
      builder.aggregate(AggregationType.AVG, 'value', 'avg_value');
      const { sql } = builder.build();

      expect(sql).toContain('AVG(value) AS avg_value');
    });

    it('should add SUM aggregation', () => {
      builder.aggregate(AggregationType.SUM, 'amount', 'total_amount');
      const { sql } = builder.build();

      expect(sql).toContain('SUM(amount) AS total_amount');
    });

    it('should add MAX aggregation', () => {
      builder.aggregate(AggregationType.MAX, 'score', 'max_score');
      const { sql } = builder.build();

      expect(sql).toContain('MAX(score) AS max_score');
    });

    it('should add MIN aggregation', () => {
      builder.aggregate(AggregationType.MIN, 'score', 'min_score');
      const { sql } = builder.build();

      expect(sql).toContain('MIN(score) AS min_score');
    });
  });

  describe('Complex Query Building', () => {
    it('should build complex query with all features', () => {
      const ctx = TenantContext.create({
        organizationId: 'org-123',
        workspaceId: 'ws-456',
      });
      const range = TimeRange.lastHours(24);

      builder
        .tenantContext(ctx)
        .timeRange(range)
        .select('id', 'name', 'status')
        .andWhere({
          field: 'status',
          operator: '=',
          value: 'active',
        })
        .andWhere({
          field: 'type',
          operator: 'IN',
          value: ['http', 'tcp'],
        })
        .groupBy('status')
        .orderBy('created_at', SortOrder.DESC)
        .limit(100)
        .offset(0);

      const { sql, params } = builder.build();

      expect(sql).toContain('SELECT id, name, status');
      expect(sql).toContain('FROM test_table');
      expect(sql).toContain('organization_id');
      expect(sql).toContain('workspace_id');
      expect(sql).toContain('created_at >=');
      expect(sql).toContain('status =');
      expect(sql).toContain('type IN');
      expect(sql).toContain('GROUP BY status');
      expect(sql).toContain('ORDER BY created_at DESC');
      expect(sql).toContain('LIMIT $__limit');
      expect(sql).toContain('OFFSET $__offset');

      const paramValues = Object.values(params);
      expect(paramValues).toContain('org-123');
      expect(paramValues).toContain('ws-456');
      expect(paramValues).toContain('active');
      expect(paramValues).toContainEqual(['http', 'tcp']);
    });
  });

  describe('Fluent API', () => {
    it('should support method chaining', () => {
      const ctx = TenantContext.create({ organizationId: 'org-123' });
      const range = TimeRange.lastHours(1);

      const result = builder
        .tenantContext(ctx)
        .timeRange(range)
        .select('id', 'name')
        .andWhere({ field: 'status', operator: '=', value: 'active' })
        .groupBy('status')
        .orderBy('name')
        .limit(10)
        .offset(0);

      expect(result).toBe(builder);
    });
  });

  describe('Parameter Binding', () => {
    it('should use parameterized queries', () => {
      builder.andWhere({
        field: 'name',
        operator: '=',
        value: "'; DROP TABLE users; --",
      });

      const { sql, params } = builder.build();

      expect(sql).not.toContain('DROP TABLE');
      const paramValues = Object.values(params);
      expect(paramValues).toContain("'; DROP TABLE users; --");
    });

    it('should handle special characters in values', () => {
      builder.andWhere({
        field: 'description',
        operator: 'LIKE',
        value: "test's \"value\" with % and _",
      });

      const { params } = builder.build();

      const paramValues = Object.values(params);
      expect(paramValues).toContain("%test's \"value\" with % and _%");
    });
  });
});

import { PostgresQueryBuilder } from '../infrastructure/query-builders/postgres/PostgresQueryBuilder';
import { TenantContext } from '../domain/value-objects/TenantContext';
import { TimeRange } from '../domain/value-objects/TimeRange';
import { SortOrder } from '../domain/value-objects/SortOrder';
import { AggregationType } from '../domain/value-objects/AggregationInterval';

// Concrete implementation for testing
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
      expect(params.organization_id).toBe('org-123');
    });

    it('should include workspace_id when provided', () => {
      const ctx = TenantContext.create({
        organizationId: 'org-123',
        workspaceId: 'ws-456',
      });

      builder.tenantContext(ctx);
      const { sql, params } = builder.build();

      expect(sql).toContain('workspace_id');
      expect(params.workspace_id).toBe('ws-456');
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
      expect(params.time_from).toBeDefined();
      expect(params.time_to).toBeDefined();
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
      expect(params.status).toBe('active');
    });

    it('should add LIKE condition', () => {
      builder.andWhere({
        field: 'name',
        operator: 'LIKE',
        value: 'test%',
      });

      const { sql, params } = builder.build();

      expect(sql).toContain('name LIKE');
      expect(params.name).toBe('test%');
    });

    it('should add IN condition', () => {
      builder.andWhere({
        field: 'type',
        operator: 'IN',
        value: ['http', 'tcp', 'dns'],
      });

      const { sql, params } = builder.build();

      expect(sql).toContain('type IN');
      expect(params.type).toEqual(['http', 'tcp', 'dns']);
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
      expect(params.status).toBe('active');
      expect(params.type).toBe('http');
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

      expect(sql).toContain('ORDER BY name');
    });
  });

  describe('Pagination', () => {
    it('should add LIMIT clause', () => {
      builder.limit(50);
      const { sql } = builder.build();

      expect(sql).toContain('LIMIT 50');
    });

    it('should add OFFSET clause', () => {
      builder.offset(100);
      const { sql } = builder.build();

      expect(sql).toContain('OFFSET 100');
    });

    it('should add both LIMIT and OFFSET', () => {
      builder.limit(25).offset(50);
      const { sql } = builder.build();

      expect(sql).toContain('LIMIT 25');
      expect(sql).toContain('OFFSET 50');
    });
  });

  describe('Soft Delete', () => {
    it('should exclude soft deleted records by default', () => {
      const { sql } = builder.build();

      expect(sql).toContain('deleted_at IS NULL');
    });
  });

  describe('Aggregations', () => {
    it('should add COUNT aggregation', () => {
      builder.aggregate(AggregationType.COUNT, '*', 'total');
      const { sql } = builder.build();

      expect(sql).toContain('COUNT(*) as total');
    });

    it('should add AVG aggregation', () => {
      builder.aggregate(AggregationType.AVG, 'value', 'avg_value');
      const { sql } = builder.build();

      expect(sql).toContain('AVG(value) as avg_value');
    });

    it('should add SUM aggregation', () => {
      builder.aggregate(AggregationType.SUM, 'amount', 'total_amount');
      const { sql } = builder.build();

      expect(sql).toContain('SUM(amount) as total_amount');
    });

    it('should add MAX aggregation', () => {
      builder.aggregate(AggregationType.MAX, 'score', 'max_score');
      const { sql } = builder.build();

      expect(sql).toContain('MAX(score) as max_score');
    });

    it('should add MIN aggregation', () => {
      builder.aggregate(AggregationType.MIN, 'score', 'min_score');
      const { sql } = builder.build();

      expect(sql).toContain('MIN(score) as min_score');
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
      expect(sql).toContain('deleted_at IS NULL');
      expect(sql).toContain('GROUP BY status');
      expect(sql).toContain('ORDER BY created_at DESC');
      expect(sql).toContain('LIMIT 100');
      expect(sql).toContain('OFFSET 0');

      expect(params.organization_id).toBe('org-123');
      expect(params.workspace_id).toBe('ws-456');
      expect(params.status).toBe('active');
      expect(params.type).toEqual(['http', 'tcp']);
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
    it('should prevent SQL injection with parameterized queries', () => {
      builder.andWhere({
        field: 'name',
        operator: '=',
        value: "'; DROP TABLE users; --",
      });

      const { sql, params } = builder.build();

      expect(sql).not.toContain('DROP TABLE');
      expect(params.name).toBe("'; DROP TABLE users; --");
    });

    it('should handle special characters in values', () => {
      builder.andWhere({
        field: 'description',
        operator: 'LIKE',
        value: "test's \"value\" with % and _",
      });

      const { sql, params } = builder.build();

      expect(params.description).toBe("test's \"value\" with % and _");
    });
  });
});

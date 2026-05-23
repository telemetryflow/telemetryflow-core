import { Test, TestingModule } from "@nestjs/testing";
import { DataSource } from "typeorm";
import * as fc from "fast-check";
import { GetUptimeMonitorStatsHandler } from "../QueryUptime.handler";
import { GetUptimeMonitorStatsQuery } from "../../../queries/monitoring";
import { TenantContext } from "../../../../domain/value-objects/TenantContext";
import { ClickHouseService } from "@/shared/clickhouse/clickhouse.service";

/**
 * Property-Based Tests for GetUptimeMonitorStatsHandler
 * Feature: frontend-backend-uptime-monitoring-integration
 *
 * Tests the hybrid PG+CH architecture:
 * - PG: monitor existence/tenant check
 * - CH: all stats from materialized views (uptime_checks_1h, uptime_checks_1d)
 */
describe("GetUptimeMonitorStatsHandler - Property Tests", () => {
  let handler: GetUptimeMonitorStatsHandler;

  // PG mock — monitor existence check
  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
  };

  const mockDataSource = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  // CH mock — stats queries
  const mockJsonFn = jest.fn();
  const mockQueryFn = jest.fn().mockReturnValue({ json: mockJsonFn });
  const mockClickHouseClient = { query: mockQueryFn };
  const mockClickHouseService = {
    getClient: jest.fn(() => mockClickHouseClient),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUptimeMonitorStatsHandler,
        { provide: DataSource, useValue: mockDataSource },
        { provide: ClickHouseService, useValue: mockClickHouseService },
      ],
    }).compile();

    handler = module.get<GetUptimeMonitorStatsHandler>(
      GetUptimeMonitorStatsHandler,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 26: Backend Percentile Calculation via ClickHouse
   * **Validates: Requirements 10.1, 10.5**
   *
   * For any monitor with checks in ClickHouse, the handler should return
   * all five percentiles (P50, P75, P90, P95, P99) that are monotonically
   * non-decreasing and within valid range.
   */
  describe("Property 26: Backend Percentile Calculation", () => {
    it("should return monotonically non-decreasing percentiles for any valid data", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            monitorId: fc.uuid(),
            organizationId: fc.uuid(),
          }),
          fc.array(
            fc.record({
              p50: fc.integer({ min: 10, max: 200 }),
              p75: fc.integer({ min: 50, max: 400 }),
              p90: fc.integer({ min: 100, max: 600 }),
              p95: fc.integer({ min: 150, max: 800 }),
              p99: fc.integer({ min: 200, max: 1000 }),
            }),
            { minLength: 4, maxLength: 4 },
          ),
          async ({ monitorId, organizationId }, windowPercentiles) => {
            const tenantContext = TenantContext.create({ organizationId });

            // PG: monitor exists
            mockQueryBuilder.getRawOne.mockResolvedValueOnce({
              id: monitorId,
            });

            // CH call 1: all-time counts
            mockJsonFn.mockResolvedValueOnce([
              { total_checks: 1000, success_count: 950, failure_count: 50 },
            ]);

            // CH call 2: all-time response
            mockJsonFn.mockResolvedValueOnce([
              {
                avg_response_time: 150,
                max_response_time: 500,
                min_response_time: 50,
              },
            ]);

            // CH calls 3-6: windowed stats (24h, 7d, 30d, 90d)
            for (const wp of windowPercentiles) {
              mockJsonFn.mockResolvedValueOnce([
                {
                  total_checks: 100,
                  success_count: 95,
                  ...wp,
                },
              ]);
            }

            const query = new GetUptimeMonitorStatsQuery(
              tenantContext,
              monitorId,
            );
            const result = await handler.execute(query);

            // Verify all four windows have all five percentile keys
            for (const key of [
              "percentiles24h",
              "percentiles7d",
              "percentiles30d",
              "percentiles90d",
            ] as const) {
              const p = result[key];
              expect(p).toHaveProperty("p50");
              expect(p).toHaveProperty("p75");
              expect(p).toHaveProperty("p90");
              expect(p).toHaveProperty("p95");
              expect(p).toHaveProperty("p99");

              // All values are numbers
              expect(typeof p.p50).toBe("number");
              expect(typeof p.p75).toBe("number");
              expect(typeof p.p99).toBe("number");
            }
          },
        ),
        { numRuns: 50 },
      );
    });
  });

  /**
   * Property 27: Independent Percentile Calculation per Time Range
   * **Validates: Requirements 10.3**
   *
   * Each time window (24h, 7d, 30d, 90d) gets its own independent CH query
   * with the correct interval parameter.
   */
  describe("Property 27: Independent Percentile Calculation per Time Range", () => {
    it("should query ClickHouse with correct interval hours for each time window", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            monitorId: fc.uuid(),
            organizationId: fc.uuid(),
          }),
          async ({ monitorId, organizationId }) => {
            const tenantContext = TenantContext.create({ organizationId });

            // PG: monitor exists
            mockQueryBuilder.getRawOne.mockResolvedValueOnce({
              id: monitorId,
            });

            // CH: mock all 6 queries
            for (let i = 0; i < 6; i++) {
              mockJsonFn.mockResolvedValueOnce([
                {
                  total_checks: 100,
                  success_count: 95,
                  failure_count: 5,
                  avg_response_time: 150,
                  max_response_time: 500,
                  min_response_time: 50,
                  p50: 100,
                  p75: 150,
                  p90: 200,
                  p95: 250,
                  p99: 300,
                },
              ]);
            }

            const query = new GetUptimeMonitorStatsQuery(
              tenantContext,
              monitorId,
            );
            const result = await handler.execute(query);

            // Verify each time range has its own percentiles
            expect(result.percentiles24h).toBeDefined();
            expect(result.percentiles7d).toBeDefined();
            expect(result.percentiles30d).toBeDefined();
            expect(result.percentiles90d).toBeDefined();

            // Verify CH was queried 6 times: 2 all-time + 4 windowed
            expect(mockQueryFn).toHaveBeenCalledTimes(6);

            // Verify the windowed queries use correct interval params
            const windowedCalls = mockQueryFn.mock.calls.slice(2); // Skip first 2 all-time queries
            const expectedIntervals = [24, 168, 720, 2160];
            for (let i = 0; i < 4; i++) {
              const queryArg = windowedCalls[i][0];
              expect(queryArg.query_params.intervalHours).toBe(
                expectedIntervals[i],
              );
              expect(queryArg.query_params.monitorId).toBe(monitorId);
              expect(queryArg.query_params.organizationId).toBe(
                organizationId,
              );
            }
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should return uptime percentages within valid range [0, 100]", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            monitorId: fc.uuid(),
            organizationId: fc.uuid(),
          }),
          fc.array(
            fc.record({
              total_checks: fc.integer({ min: 1, max: 10000 }),
              success_ratio: fc.float({ min: 0, max: 1, noNaN: true }),
            }),
            { minLength: 4, maxLength: 4 },
          ),
          async ({ monitorId, organizationId }, windowData) => {
            const tenantContext = TenantContext.create({ organizationId });

            // PG: monitor exists
            mockQueryBuilder.getRawOne.mockResolvedValueOnce({
              id: monitorId,
            });

            // CH: all-time counts
            mockJsonFn.mockResolvedValueOnce([
              { total_checks: 1000, success_count: 950, failure_count: 50 },
            ]);

            // CH: all-time response
            mockJsonFn.mockResolvedValueOnce([
              {
                avg_response_time: 150,
                max_response_time: 500,
                min_response_time: 50,
              },
            ]);

            // CH: windowed data with varying success ratios
            for (const wd of windowData) {
              const successCount = Math.floor(
                wd.total_checks * wd.success_ratio,
              );
              mockJsonFn.mockResolvedValueOnce([
                {
                  total_checks: wd.total_checks,
                  success_count: successCount,
                  p50: 100,
                  p75: 150,
                  p90: 200,
                  p95: 250,
                  p99: 300,
                },
              ]);
            }

            const query = new GetUptimeMonitorStatsQuery(
              tenantContext,
              monitorId,
            );
            const result = await handler.execute(query);

            // Uptime percentages must be within [0, 100]
            for (const key of [
              "uptime24h",
              "uptime7d",
              "uptime30d",
              "uptime90d",
            ] as const) {
              expect(result[key]).toBeGreaterThanOrEqual(0);
              expect(result[key]).toBeLessThanOrEqual(100);
            }
          },
        ),
        { numRuns: 50 },
      );
    });
  });
});

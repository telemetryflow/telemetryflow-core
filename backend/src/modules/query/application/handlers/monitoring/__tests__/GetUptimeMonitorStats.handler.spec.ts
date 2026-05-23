import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { DataSource } from "typeorm";
import { GetUptimeMonitorStatsHandler } from "../QueryUptime.handler";
import { GetUptimeMonitorStatsQuery } from "../../../queries/monitoring";
import { TenantContext } from "../../../../domain/value-objects/TenantContext";
import { ClickHouseService } from "@/shared/clickhouse/clickhouse.service";

describe("GetUptimeMonitorStatsHandler", () => {
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

  describe("execute", () => {
    const tenantContext = TenantContext.create({
      organizationId: "org-123",
    });
    const monitorId = "monitor-456";

    it("should throw NotFoundException when monitor does not exist", async () => {
      mockQueryBuilder.getRawOne.mockResolvedValueOnce(null);

      const query = new GetUptimeMonitorStatsQuery(tenantContext, monitorId);

      await expect(handler.execute(query)).rejects.toThrow(NotFoundException);
    });

    it("should calculate stats from ClickHouse materialized views", async () => {
      // PG: monitor exists
      mockQueryBuilder.getRawOne.mockResolvedValueOnce({ id: monitorId });

      // CH call 1: all-time counts from daily view
      mockJsonFn.mockResolvedValueOnce([
        { total_checks: 100, success_count: 95, failure_count: 5 },
      ]);

      // CH call 2: all-time response stats from hourly view
      mockJsonFn.mockResolvedValueOnce([
        {
          avg_response_time: 150.5,
          max_response_time: 500.0,
          min_response_time: 50.0,
        },
      ]);

      // CH calls 3-6: windowed stats (24h, 7d, 30d, 90d) — run in parallel
      mockJsonFn.mockResolvedValueOnce([
        {
          total_checks: 24,
          success_count: 23,
          p50: 120,
          p75: 180,
          p90: 250,
          p95: 320,
          p99: 450,
        },
      ]);
      mockJsonFn.mockResolvedValueOnce([
        {
          total_checks: 168,
          success_count: 160,
          p50: 125,
          p75: 185,
          p90: 255,
          p95: 325,
          p99: 455,
        },
      ]);
      mockJsonFn.mockResolvedValueOnce([
        {
          total_checks: 720,
          success_count: 684,
          p50: 130,
          p75: 190,
          p90: 260,
          p95: 330,
          p99: 460,
        },
      ]);
      mockJsonFn.mockResolvedValueOnce([
        {
          total_checks: 2160,
          success_count: 2052,
          p50: 135,
          p75: 195,
          p90: 265,
          p95: 335,
          p99: 465,
        },
      ]);

      const query = new GetUptimeMonitorStatsQuery(tenantContext, monitorId);
      const result = await handler.execute(query);

      expect(result).toEqual({
        monitorId,
        totalChecks: 100,
        upChecks: 95,
        downChecks: 5,
        uptimePercentage: 95.0,
        avgResponseTimeMs: 150.5,
        minResponseTimeMs: 50.0,
        maxResponseTimeMs: 500.0,
        uptime24h: expect.closeTo(95.8333, 2),
        uptime7d: expect.closeTo(95.2381, 2),
        uptime30d: 95.0,
        uptime90d: 95.0,
        percentiles24h: { p50: 120, p75: 180, p90: 250, p95: 320, p99: 450 },
        percentiles7d: { p50: 125, p75: 185, p90: 255, p95: 325, p99: 455 },
        percentiles30d: { p50: 130, p75: 190, p90: 260, p95: 330, p99: 460 },
        percentiles90d: { p50: 135, p75: 195, p90: 265, p95: 335, p99: 465 },
      });

      // Verify PG was called once for monitor check
      expect(mockDataSource.createQueryBuilder).toHaveBeenCalledTimes(1);
      // Verify CH was called 6 times (2 all-time + 4 windowed)
      expect(mockQueryFn).toHaveBeenCalledTimes(6);
    });

    it("should return zero percentiles when no check data exists", async () => {
      // PG: monitor exists
      mockQueryBuilder.getRawOne.mockResolvedValueOnce({ id: monitorId });

      // CH: all-time counts — no data
      mockJsonFn.mockResolvedValueOnce([
        { total_checks: 0, success_count: 0, failure_count: 0 },
      ]);

      // CH: all-time response — no data
      mockJsonFn.mockResolvedValueOnce([
        { avg_response_time: 0, max_response_time: 0, min_response_time: 0 },
      ]);

      // CH: windowed stats — all empty
      for (let i = 0; i < 4; i++) {
        mockJsonFn.mockResolvedValueOnce([
          {
            total_checks: 0,
            success_count: 0,
            p50: 0,
            p75: 0,
            p90: 0,
            p95: 0,
            p99: 0,
          },
        ]);
      }

      const query = new GetUptimeMonitorStatsQuery(tenantContext, monitorId);
      const result = await handler.execute(query);

      expect(result.totalChecks).toBe(0);
      expect(result.uptimePercentage).toBe(0);
      expect(result.avgResponseTimeMs).toBe(0);
      expect(result.uptime24h).toBe(0);
      expect(result.percentiles24h).toEqual({
        p50: 0,
        p75: 0,
        p90: 0,
        p95: 0,
        p99: 0,
      });
    });

    it("should use parameterized queries for ClickHouse", async () => {
      // PG: monitor exists
      mockQueryBuilder.getRawOne.mockResolvedValueOnce({ id: monitorId });

      // CH: return empty for all queries
      for (let i = 0; i < 6; i++) {
        mockJsonFn.mockResolvedValueOnce([{}]);
      }

      const query = new GetUptimeMonitorStatsQuery(tenantContext, monitorId);
      await handler.execute(query);

      // Verify parameterized queries are used (not string interpolation)
      for (const call of mockQueryFn.mock.calls) {
        const queryArg = call[0];
        expect(queryArg.query_params).toBeDefined();
        expect(queryArg.query_params.monitorId).toBe(monitorId);
        expect(queryArg.query_params.organizationId).toBe("org-123");
        expect(queryArg.format).toBe("JSONEachRow");
      }
    });

    it("should handle missing CH response rows gracefully", async () => {
      // PG: monitor exists
      mockQueryBuilder.getRawOne.mockResolvedValueOnce({ id: monitorId });

      // CH: return empty arrays (no rows)
      for (let i = 0; i < 6; i++) {
        mockJsonFn.mockResolvedValueOnce([]);
      }

      const query = new GetUptimeMonitorStatsQuery(tenantContext, monitorId);
      const result = await handler.execute(query);

      expect(result.totalChecks).toBe(0);
      expect(result.upChecks).toBe(0);
      expect(result.downChecks).toBe(0);
      expect(result.uptimePercentage).toBe(0);
      expect(result.avgResponseTimeMs).toBe(0);
    });
  });
});

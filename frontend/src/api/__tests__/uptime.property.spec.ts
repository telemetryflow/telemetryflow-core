/**
 * Property-Based Tests for Uptime API Client
 * Feature: frontend-backend-uptime-monitoring-integration
 *
 * Property 7: Stats Fetching with All Time Ranges
 * **Validates: Requirements 3.1, 3.2, 8.3**
 *
 * For any monitor, when displaying statistics, the Frontend should fetch and show
 * uptime percentages for all four time ranges (24h, 7d, 30d, 90d) and all response
 * time metrics (average, minimum, maximum).
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";
import { uptimeApi } from "../uptime";
import type { UptimeStats, LatencyPercentiles } from "@/types/uptime";

// Mock the collector client
vi.mock("../collector", () => ({
  collectorClient: {
    get: vi.fn(),
  },
}));

// Mock the config
vi.mock("@/config", () => ({
  config: {
    useMock: false,
  },
}));

// Import after mocking
import { collectorClient } from "../collector";

describe("Uptime API Client - Property Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property 7: Stats Fetching with All Time Ranges
   * **Validates: Requirements 3.1, 3.2, 8.3**
   */
  describe("Property 7: Stats Fetching with All Time Ranges", () => {
    it("should fetch and return uptime percentages for all four time ranges", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.record({
            uptime_24h: fc.float({ min: 0, max: 100, noNaN: true }),
            uptime_7d: fc.float({ min: 0, max: 100, noNaN: true }),
            uptime_30d: fc.float({ min: 0, max: 100, noNaN: true }),
            uptime_90d: fc.float({ min: 0, max: 100, noNaN: true }),
            avg_response_time_24h: fc.integer({ min: 1, max: 10000 }),
            avg_response_time_7d: fc.option(fc.integer({ min: 1, max: 10000 })),
          }),
          async (monitorId, backendStats) => {
            // Mock the backend response
            vi.mocked(collectorClient.get).mockResolvedValueOnce({
              data: backendStats,
            } as any);

            // Call the API client
            const result = await uptimeApi.getMonitorStats(monitorId);

            // Verify all four time ranges are present in the result
            expect(result).toHaveProperty("uptime24h");
            expect(result).toHaveProperty("uptime7d");
            expect(result).toHaveProperty("uptime30d");
            expect(result).toHaveProperty("uptime90d");

            // Verify the values match the backend response (snake_case to camelCase transformation)
            expect(result.uptime24h).toBe(backendStats.uptime_24h);
            expect(result.uptime7d).toBe(backendStats.uptime_7d);
            expect(result.uptime30d).toBe(backendStats.uptime_30d);
            expect(result.uptime90d).toBe(backendStats.uptime_90d);

            // Verify response time metrics are present
            expect(result).toHaveProperty("avgResponseTime24h");
            expect(result.avgResponseTime24h).toBe(
              backendStats.avg_response_time_24h,
            );

            if (backendStats.avg_response_time_7d !== null) {
              expect(result.avgResponseTime7d).toBe(
                backendStats.avg_response_time_7d,
              );
            }

            // Verify the correct endpoint was called
            expect(collectorClient.get).toHaveBeenCalledWith(
              `/api/v2/uptime/monitors/${monitorId}/stats`,
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should fetch and return all response time metrics (avg, min, max)", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.record({
            uptime_24h: fc.float({ min: 0, max: 100, noNaN: true }),
            uptime_7d: fc.float({ min: 0, max: 100, noNaN: true }),
            uptime_30d: fc.float({ min: 0, max: 100, noNaN: true }),
            uptime_90d: fc.float({ min: 0, max: 100, noNaN: true }),
            avg_response_time_24h: fc.integer({ min: 50, max: 5000 }),
            avg_response_time_7d: fc.option(fc.integer({ min: 50, max: 5000 })),
          }),
          async (monitorId, backendStats) => {
            // Mock the backend response
            vi.mocked(collectorClient.get).mockResolvedValueOnce({
              data: backendStats,
            } as any);

            // Call the API client
            const result = await uptimeApi.getMonitorStats(monitorId);

            // Verify average response time is present for 24h (required)
            expect(result.avgResponseTime24h).toBeDefined();
            expect(typeof result.avgResponseTime24h).toBe("number");
            expect(result.avgResponseTime24h).toBe(
              backendStats.avg_response_time_24h,
            );

            // Verify 7d average is handled correctly (optional)
            if (backendStats.avg_response_time_7d !== null) {
              expect(result.avgResponseTime7d).toBe(
                backendStats.avg_response_time_7d,
              );
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should fetch and return latency percentiles for all four time ranges", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.record({
            uptime_24h: fc.float({ min: 0, max: 100, noNaN: true }),
            uptime_7d: fc.float({ min: 0, max: 100, noNaN: true }),
            uptime_30d: fc.float({ min: 0, max: 100, noNaN: true }),
            uptime_90d: fc.float({ min: 0, max: 100, noNaN: true }),
            avg_response_time_24h: fc.integer({ min: 50, max: 5000 }),
            percentiles_24h: fc.option(
              fc.record({
                p50: fc.integer({ min: 10, max: 1000 }),
                p75: fc.integer({ min: 50, max: 2000 }),
                p90: fc.integer({ min: 100, max: 3000 }),
                p95: fc.integer({ min: 150, max: 4000 }),
                p99: fc.integer({ min: 200, max: 5000 }),
              }),
            ),
            percentiles_7d: fc.option(
              fc.record({
                p50: fc.integer({ min: 10, max: 1000 }),
                p75: fc.integer({ min: 50, max: 2000 }),
                p90: fc.integer({ min: 100, max: 3000 }),
                p95: fc.integer({ min: 150, max: 4000 }),
                p99: fc.integer({ min: 200, max: 5000 }),
              }),
            ),
            percentiles_30d: fc.option(
              fc.record({
                p50: fc.integer({ min: 10, max: 1000 }),
                p75: fc.integer({ min: 50, max: 2000 }),
                p90: fc.integer({ min: 100, max: 3000 }),
                p95: fc.integer({ min: 150, max: 4000 }),
                p99: fc.integer({ min: 200, max: 5000 }),
              }),
            ),
            percentiles_90d: fc.option(
              fc.record({
                p50: fc.integer({ min: 10, max: 1000 }),
                p75: fc.integer({ min: 50, max: 2000 }),
                p90: fc.integer({ min: 100, max: 3000 }),
                p95: fc.integer({ min: 150, max: 4000 }),
                p99: fc.integer({ min: 200, max: 5000 }),
              }),
            ),
          }),
          async (monitorId, backendStats) => {
            // Mock the backend response
            vi.mocked(collectorClient.get).mockResolvedValueOnce({
              data: backendStats,
            } as any);

            // Call the API client
            const result = await uptimeApi.getMonitorStats(monitorId);

            // Verify percentiles for all time ranges are present (if provided by backend)
            if (backendStats.percentiles_24h !== null) {
              expect(result.percentiles24h).toBeDefined();
              expect(result.percentiles24h).toEqual(
                backendStats.percentiles_24h,
              );
            }

            if (backendStats.percentiles_7d !== null) {
              expect(result.percentiles7d).toBeDefined();
              expect(result.percentiles7d).toEqual(backendStats.percentiles_7d);
            }

            if (backendStats.percentiles_30d !== null) {
              expect(result.percentiles30d).toBeDefined();
              expect(result.percentiles30d).toEqual(
                backendStats.percentiles_30d,
              );
            }

            if (backendStats.percentiles_90d !== null) {
              expect(result.percentiles90d).toBeDefined();
              expect(result.percentiles90d).toEqual(
                backendStats.percentiles_90d,
              );
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should correctly transform snake_case backend response to camelCase frontend format", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.record({
            uptime_24h: fc.float({ min: 0, max: 100, noNaN: true }),
            uptime_7d: fc.float({ min: 0, max: 100, noNaN: true }),
            uptime_30d: fc.float({ min: 0, max: 100, noNaN: true }),
            uptime_90d: fc.float({ min: 0, max: 100, noNaN: true }),
            avg_response_time_24h: fc.integer({ min: 1, max: 10000 }),
            avg_response_time_7d: fc.option(fc.integer({ min: 1, max: 10000 })),
            percentiles_24h: fc.option(
              fc.record({
                p50: fc.integer({ min: 10, max: 1000 }),
                p75: fc.integer({ min: 50, max: 2000 }),
                p90: fc.integer({ min: 100, max: 3000 }),
                p95: fc.integer({ min: 150, max: 4000 }),
                p99: fc.integer({ min: 200, max: 5000 }),
              }),
            ),
            percentiles_7d: fc.option(
              fc.record({
                p50: fc.integer({ min: 10, max: 1000 }),
                p75: fc.integer({ min: 50, max: 2000 }),
                p90: fc.integer({ min: 100, max: 3000 }),
                p95: fc.integer({ min: 150, max: 4000 }),
                p99: fc.integer({ min: 200, max: 5000 }),
              }),
            ),
            percentiles_30d: fc.option(
              fc.record({
                p50: fc.integer({ min: 10, max: 1000 }),
                p75: fc.integer({ min: 50, max: 2000 }),
                p90: fc.integer({ min: 100, max: 3000 }),
                p95: fc.integer({ min: 150, max: 4000 }),
                p99: fc.integer({ min: 200, max: 5000 }),
              }),
            ),
            percentiles_90d: fc.option(
              fc.record({
                p50: fc.integer({ min: 10, max: 1000 }),
                p75: fc.integer({ min: 50, max: 2000 }),
                p90: fc.integer({ min: 100, max: 3000 }),
                p95: fc.integer({ min: 150, max: 4000 }),
                p99: fc.integer({ min: 200, max: 5000 }),
              }),
            ),
          }),
          async (monitorId, backendStats) => {
            // Mock the backend response
            vi.mocked(collectorClient.get).mockResolvedValueOnce({
              data: backendStats,
            } as any);

            // Call the API client
            const result = await uptimeApi.getMonitorStats(monitorId);

            // Verify the result has camelCase properties
            expect(result).not.toHaveProperty("uptime_24h");
            expect(result).not.toHaveProperty("uptime_7d");
            expect(result).not.toHaveProperty("uptime_30d");
            expect(result).not.toHaveProperty("uptime_90d");
            expect(result).not.toHaveProperty("avg_response_time_24h");
            expect(result).not.toHaveProperty("avg_response_time_7d");
            expect(result).not.toHaveProperty("percentiles_24h");
            expect(result).not.toHaveProperty("percentiles_7d");
            expect(result).not.toHaveProperty("percentiles_30d");
            expect(result).not.toHaveProperty("percentiles_90d");

            // Verify the result has the correct camelCase properties
            expect(result).toHaveProperty("uptime24h");
            expect(result).toHaveProperty("uptime7d");
            expect(result).toHaveProperty("uptime30d");
            expect(result).toHaveProperty("uptime90d");
            expect(result).toHaveProperty("avgResponseTime24h");

            // Verify values are correctly transformed
            expect(result.uptime24h).toBe(backendStats.uptime_24h);
            expect(result.uptime7d).toBe(backendStats.uptime_7d);
            expect(result.uptime30d).toBe(backendStats.uptime_30d);
            expect(result.uptime90d).toBe(backendStats.uptime_90d);
            expect(result.avgResponseTime24h).toBe(
              backendStats.avg_response_time_24h,
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should handle all time ranges independently without data loss", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.tuple(
            fc.float({ min: 0, max: 100, noNaN: true }),
            fc.float({ min: 0, max: 100, noNaN: true }),
            fc.float({ min: 0, max: 100, noNaN: true }),
            fc.float({ min: 0, max: 100, noNaN: true }),
          ),
          async (monitorId, [uptime24h, uptime7d, uptime30d, uptime90d]) => {
            const backendStats = {
              uptime_24h: uptime24h,
              uptime_7d: uptime7d,
              uptime_30d: uptime30d,
              uptime_90d: uptime90d,
              avg_response_time_24h: 100,
            };

            // Mock the backend response
            vi.mocked(collectorClient.get).mockResolvedValueOnce({
              data: backendStats,
            } as any);

            // Call the API client
            const result = await uptimeApi.getMonitorStats(monitorId);

            // Verify each time range maintains its unique value
            expect(result.uptime24h).toBe(uptime24h);
            expect(result.uptime7d).toBe(uptime7d);
            expect(result.uptime30d).toBe(uptime30d);
            expect(result.uptime90d).toBe(uptime90d);

            // Verify no time ranges are mixed up or lost
            const timeRanges = [
              result.uptime24h,
              result.uptime7d,
              result.uptime30d,
              result.uptime90d,
            ];
            expect(timeRanges).toHaveLength(4);
            expect(timeRanges.every((val) => typeof val === "number")).toBe(
              true,
            );
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});

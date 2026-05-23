/**
 * Property-Based Tests for Uptime Store
 * Feature: frontend-backend-monitoring-uptime-integration
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import fc from "fast-check";
import { useUptimeStore } from "../uptime";
import { uptimeApi } from "@/api/uptime";
import type { MonitorStatus, MonitorType } from "@/types/uptime";

// Mock the API
vi.mock("@/api/uptime", () => ({
  uptimeApi: {
    listMonitors: vi.fn(),
  },
}));

describe("Uptime Store - Property-Based Tests", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  /**
   * **Validates: Requirements 1.4, 1.5, 1.6, 6.2, 8.7**
   * 
   * Property 3: Filter Parameter Transmission
   * 
   * For any filter criteria (name, type, status, isActive, isPaused, groupId, tags),
   * when applied by the user, the Frontend should send the filter parameters to the
   * Backend in the correct format and display only monitors matching those criteria.
   */
  describe("Property 3: Filter Parameter Transmission", () => {
    it("should transmit name filter to backend API", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          async (nameFilter) => {
            const store = useUptimeStore();
            vi.clearAllMocks();

            // Mock API response
            vi.mocked(uptimeApi.listMonitors).mockResolvedValue({
              data: [],
              total: 0,
              page: 1,
              pageSize: 20,
              totalPages: 0,
              hasNext: false,
              hasPrevious: false,
            });

            // Apply name filter
            await store.setFilters({ name: nameFilter });

            // Verify API was called with name filter
            expect(uptimeApi.listMonitors).toHaveBeenCalledWith(
              expect.objectContaining({
                name: nameFilter,
              })
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should transmit type filter to backend API", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom<MonitorType>(
            "http",
            "https",
            "tcp",
            "ping",
            "dns",
            "websocket"
          ),
          async (typeFilter) => {
            const store = useUptimeStore();
            vi.clearAllMocks();

            // Mock API response
            vi.mocked(uptimeApi.listMonitors).mockResolvedValue({
              data: [],
              total: 0,
              page: 1,
              pageSize: 20,
              totalPages: 0,
              hasNext: false,
              hasPrevious: false,
            });

            // Apply type filter
            await store.setFilters({ type: typeFilter });

            // Verify API was called with type filter
            expect(uptimeApi.listMonitors).toHaveBeenCalledWith(
              expect.objectContaining({
                type: typeFilter,
              })
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should transmit status filter to backend API", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom<MonitorStatus>(
            "up",
            "down",
            "degraded",
            "paused",
            "pending",
            "unknown"
          ),
          async (statusFilter) => {
            const store = useUptimeStore();
            vi.clearAllMocks();

            // Mock API response
            vi.mocked(uptimeApi.listMonitors).mockResolvedValue({
              data: [],
              total: 0,
              page: 1,
              pageSize: 20,
              totalPages: 0,
              hasNext: false,
              hasPrevious: false,
            });

            // Apply status filter
            await store.setFilters({ status: statusFilter });

            // Verify API was called with status filter
            expect(uptimeApi.listMonitors).toHaveBeenCalledWith(
              expect.objectContaining({
                status: statusFilter,
              })
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should transmit groupId filter to backend API", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          async (groupIdFilter) => {
            const store = useUptimeStore();
            vi.clearAllMocks();

            // Mock API response
            vi.mocked(uptimeApi.listMonitors).mockResolvedValue({
              data: [],
              total: 0,
              page: 1,
              pageSize: 20,
              totalPages: 0,
              hasNext: false,
              hasPrevious: false,
            });

            // Apply groupId filter
            await store.setFilters({ groupId: groupIdFilter });

            // Verify API was called with groupId filter
            expect(uptimeApi.listMonitors).toHaveBeenCalledWith(
              expect.objectContaining({
                groupId: groupIdFilter,
              })
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should transmit multiple filters simultaneously to backend API", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.option(fc.string({ minLength: 1, maxLength: 100 }), {
              nil: undefined,
            }),
            type: fc.option(
              fc.constantFrom<MonitorType>(
                "http",
                "https",
                "tcp",
                "ping",
                "dns",
                "websocket"
              ),
              { nil: undefined }
            ),
            status: fc.option(
              fc.constantFrom<MonitorStatus>(
                "up",
                "down",
                "degraded",
                "paused",
                "pending",
                "unknown"
              ),
              { nil: undefined }
            ),
            groupId: fc.option(fc.uuid(), { nil: undefined }),
          }),
          async (filters) => {
            const store = useUptimeStore();
            vi.clearAllMocks();

            // Mock API response
            vi.mocked(uptimeApi.listMonitors).mockResolvedValue({
              data: [],
              total: 0,
              page: 1,
              pageSize: 20,
              totalPages: 0,
              hasNext: false,
              hasPrevious: false,
            });

            // Apply multiple filters
            await store.setFilters(filters);

            // Verify API was called with all provided filters
            const expectedFilters: any = {};
            if (filters.name !== undefined) expectedFilters.name = filters.name;
            if (filters.type !== undefined) expectedFilters.type = filters.type;
            if (filters.status !== undefined)
              expectedFilters.status = filters.status;
            if (filters.groupId !== undefined)
              expectedFilters.groupId = filters.groupId;

            expect(uptimeApi.listMonitors).toHaveBeenCalledWith(
              expect.objectContaining(expectedFilters)
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reset to page 1 when filters change", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom<MonitorStatus>(
            "up",
            "down",
            "degraded",
            "paused",
            "pending"
          ),
          fc.integer({ min: 2, max: 10 }),
          async (statusFilter, initialPage) => {
            const store = useUptimeStore();
            vi.clearAllMocks();

            // Mock API response
            vi.mocked(uptimeApi.listMonitors).mockResolvedValue({
              data: [],
              total: 0,
              page: 1,
              pageSize: 20,
              totalPages: 0,
              hasNext: false,
              hasPrevious: false,
            });

            // Set initial page
            store.page = initialPage;

            // Apply filter
            await store.setFilters({ status: statusFilter });

            // Verify page was reset to 1
            expect(store.page).toBe(1);

            // Verify API was called with page 1
            expect(uptimeApi.listMonitors).toHaveBeenCalledWith(
              expect.objectContaining({
                page: 1,
              })
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should preserve pagination parameters when fetching with filters", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom<MonitorType>("http", "https", "tcp", "dns"),
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 10, max: 50 }),
          async (typeFilter, pageNum, pageSizeNum) => {
            const store = useUptimeStore();
            vi.clearAllMocks();

            // Mock API response
            vi.mocked(uptimeApi.listMonitors).mockResolvedValue({
              data: [],
              total: 0,
              page: pageNum,
              pageSize: pageSizeNum,
              totalPages: 0,
              hasNext: false,
              hasPrevious: false,
            });

            // Set pagination
            store.page = pageNum;
            store.pageSize = pageSizeNum;

            // Apply filter
            await store.fetchMonitors({ type: typeFilter });

            // Verify API was called with both filter and pagination
            expect(uptimeApi.listMonitors).toHaveBeenCalledWith(
              expect.objectContaining({
                type: typeFilter,
                page: pageNum,
                pageSize: pageSizeNum,
              })
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should clear all filters when clearFilters is called", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }),
            type: fc.constantFrom<MonitorType>("http", "https", "tcp"),
            status: fc.constantFrom<MonitorStatus>("up", "down", "degraded"),
            groupId: fc.uuid(),
          }),
          async (initialFilters) => {
            const store = useUptimeStore();
            vi.clearAllMocks();

            // Mock API response
            vi.mocked(uptimeApi.listMonitors).mockResolvedValue({
              data: [],
              total: 0,
              page: 1,
              pageSize: 20,
              totalPages: 0,
              hasNext: false,
              hasPrevious: false,
            });

            // Set filters
            await store.setFilters(initialFilters);
            vi.clearAllMocks();

            // Clear filters
            await store.clearFilters();

            // Verify filters are empty
            expect(store.filters).toEqual({});

            // Verify API was called without filters
            expect(uptimeApi.listMonitors).toHaveBeenLastCalledWith(
              expect.objectContaining({
                page: 1,
                pageSize: 20,
              })
            );

            // Verify no filter properties are present
            const lastCall = vi.mocked(uptimeApi.listMonitors).mock.calls[
              vi.mocked(uptimeApi.listMonitors).mock.calls.length - 1
            ][0];
            expect(lastCall.name).toBeUndefined();
            expect(lastCall.type).toBeUndefined();
            expect(lastCall.status).toBeUndefined();
            expect(lastCall.groupId).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

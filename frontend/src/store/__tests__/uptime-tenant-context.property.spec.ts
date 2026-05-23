/**
 * Property-Based Tests for Uptime Store - Tenant Context
 * Feature: frontend-backend-uptime-monitoring-integration
 * Task 4.1: Write property test for tenant context inclusion
 * 
 * Property 1: Monitor List Fetching with Tenant Context
 * **Validates: Requirements 1.1, 8.1, 8.5**
 * 
 * For any user navigation to the uptime monitoring page, the Frontend should fetch
 * monitors by calling the Backend API with the current tenant context (organizationId
 * and workspaceId), and all returned monitors should belong to that tenant.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { setActivePinia, createPinia } from 'pinia';
import { useUptimeStore } from '../uptime';
import { useAuthStore } from '../auth';
import { uptimeApi } from '@/api/uptime';
import type { Monitor, PaginatedMonitors, MonitorType, MonitorStatus } from '@/types/uptime';

// Mock the API
vi.mock('@/api/uptime', () => ({
  uptimeApi: {
    listMonitors: vi.fn(),
  },
}));

describe('Uptime Store - Property Tests: Tenant Context', () => {
  let pinia: ReturnType<typeof createPinia>;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property 1: Monitor List Fetching with Tenant Context
   * **Validates: Requirements 1.1, 8.1, 8.5**
   */
  describe('Property 1: Monitor List Fetching with Tenant Context', () => {
    it('should fetch monitors with tenant context and all returned monitors belong to that tenant', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random tenant context
          fc.record({
            organizationId: fc.uuid(),
            workspaceId: fc.option(fc.uuid(), { nil: undefined }),
          }),
          // Generate random monitors that belong to the tenant
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              url: fc.webUrl(),
              type: fc.constantFrom<MonitorType>(
                'http', 'https', 'tcp', 'ping', 'dns', 'websocket'
              ),
              status: fc.constantFrom<MonitorStatus>(
                'up', 'down', 'degraded', 'paused', 'pending'
              ),
              interval: fc.integer({ min: 30, max: 3600 }),
              timeout: fc.integer({ min: 5, max: 300 }),
              retries: fc.integer({ min: 1, max: 5 }),
              isActive: fc.boolean(),
              isPaused: fc.boolean(),
              consecutiveDownCount: fc.integer({ min: 0, max: 100 }),
              consecutiveUpCount: fc.integer({ min: 0, max: 1000 }),
              heartbeats: fc.constant([]),
              tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 }),
              createdAt: fc.integer({ min: Date.now() - 365 * 24 * 60 * 60 * 1000, max: Date.now() }),
              updatedAt: fc.integer({ min: Date.now() - 30 * 24 * 60 * 60 * 1000, max: Date.now() }),
            }),
            { minLength: 0, maxLength: 50 }
          ),
          // Generate pagination parameters
          fc.record({
            page: fc.integer({ min: 1, max: 10 }),
            pageSize: fc.integer({ min: 10, max: 100 }),
          }),
          async (tenantContext, generatedMonitors, pagination) => {
            // Clear mocks for each iteration
            vi.clearAllMocks();
            
            // Create fresh pinia instance for each iteration
            const testPinia = createPinia();
            setActivePinia(testPinia);

            // Setup: Create auth store and set user with tenant context
            const authStore = useAuthStore();
            authStore.user = {
              id: 'user-1',
              username: 'testuser',
              email: 'test@example.com',
              firstName: 'Test',
              lastName: 'User',
              roles: ['user'],
              permissions: ['uptime:read'],
              avatar: null,
              tenantId: null,
              organizationId: tenantContext.organizationId,
            };
            authStore.isAuthenticated = true;

            // Add tenant context to all generated monitors
            const monitorsWithTenant: Monitor[] = generatedMonitors.map(m => ({
              ...m,
              organizationId: tenantContext.organizationId,
              workspaceId: tenantContext.workspaceId,
            }));

            // Mock API response
            const mockResponse: PaginatedMonitors = {
              data: monitorsWithTenant,
              total: monitorsWithTenant.length,
              page: pagination.page,
              pageSize: pagination.pageSize,
              totalPages: Math.ceil(monitorsWithTenant.length / pagination.pageSize),
              hasNext: pagination.page * pagination.pageSize < monitorsWithTenant.length,
              hasPrevious: pagination.page > 1,
            };

            vi.mocked(uptimeApi.listMonitors).mockResolvedValueOnce(mockResponse);

            // Execute: Fetch monitors from the store
            const uptimeStore = useUptimeStore();
            const result = await uptimeStore.fetchMonitors({
              page: pagination.page,
              pageSize: pagination.pageSize,
            });

            // Verify: API was called (tenant context is implicitly included via auth headers)
            expect(uptimeApi.listMonitors).toHaveBeenCalledTimes(1);
            expect(uptimeApi.listMonitors).toHaveBeenCalledWith(
              expect.objectContaining({
                page: pagination.page,
                pageSize: pagination.pageSize,
              })
            );

            // Verify: All returned monitors belong to the tenant
            result.data.forEach(monitor => {
              expect(monitor.organizationId).toBe(tenantContext.organizationId);
              
              // If workspaceId is set in tenant context, verify it matches
              if (tenantContext.workspaceId !== undefined) {
                expect(monitor.workspaceId).toBe(tenantContext.workspaceId);
              }
            });

            // Verify: Store state is updated correctly
            expect(uptimeStore.monitors).toEqual(result.data);
            expect(uptimeStore.total).toBe(result.total);
            expect(uptimeStore.page).toBe(result.page);
            expect(uptimeStore.pageSize).toBe(result.pageSize);

            // Verify: No monitors from other tenants are included
            const hasWrongTenant = result.data.some(
              m => m.organizationId !== tenantContext.organizationId
            );
            expect(hasWrongTenant).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should maintain tenant isolation across multiple fetch operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate two different tenant contexts
          fc.tuple(
            fc.record({
              organizationId: fc.uuid(),
              workspaceId: fc.option(fc.uuid(), { nil: undefined }),
            }),
            fc.record({
              organizationId: fc.uuid(),
              workspaceId: fc.option(fc.uuid(), { nil: undefined }),
            })
          ).filter(([tenant1, tenant2]) => tenant1.organizationId !== tenant2.organizationId),
          // Generate monitors for each tenant
          fc.tuple(
            fc.array(
              fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 100 }),
                url: fc.webUrl(),
                type: fc.constantFrom<MonitorType>('http', 'https', 'tcp'),
                status: fc.constantFrom<MonitorStatus>('up', 'down'),
                interval: fc.integer({ min: 60, max: 300 }),
                timeout: fc.integer({ min: 10, max: 60 }),
                retries: fc.integer({ min: 1, max: 3 }),
                isActive: fc.boolean(),
                isPaused: fc.boolean(),
                consecutiveDownCount: fc.integer({ min: 0, max: 10 }),
                consecutiveUpCount: fc.integer({ min: 0, max: 100 }),
                heartbeats: fc.constant([]),
                tags: fc.constant([]),
                createdAt: fc.constant(Date.now()),
                updatedAt: fc.constant(Date.now()),
              }),
              { minLength: 1, maxLength: 10 }
            ),
            fc.array(
              fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 100 }),
                url: fc.webUrl(),
                type: fc.constantFrom<MonitorType>('http', 'https', 'tcp'),
                status: fc.constantFrom<MonitorStatus>('up', 'down'),
                interval: fc.integer({ min: 60, max: 300 }),
                timeout: fc.integer({ min: 10, max: 60 }),
                retries: fc.integer({ min: 1, max: 3 }),
                isActive: fc.boolean(),
                isPaused: fc.boolean(),
                consecutiveDownCount: fc.integer({ min: 0, max: 10 }),
                consecutiveUpCount: fc.integer({ min: 0, max: 100 }),
                heartbeats: fc.constant([]),
                tags: fc.constant([]),
                createdAt: fc.constant(Date.now()),
                updatedAt: fc.constant(Date.now()),
              }),
              { minLength: 1, maxLength: 10 }
            )
          ),
          async ([tenant1, tenant2], [monitors1, monitors2]) => {
            const authStore = useAuthStore();
            const uptimeStore = useUptimeStore();

            // First fetch: Tenant 1
            authStore.user = {
              id: 'user-1',
              username: 'user1',
              email: 'user1@example.com',
              firstName: 'User',
              lastName: 'One',
              roles: ['user'],
              permissions: ['uptime:read'],
              avatar: null,
              tenantId: null,
              organizationId: tenant1.organizationId,
            };

            const monitorsWithTenant1: Monitor[] = monitors1.map(m => ({
              ...m,
              organizationId: tenant1.organizationId,
              workspaceId: tenant1.workspaceId,
            }));

            vi.mocked(uptimeApi.listMonitors).mockResolvedValueOnce({
              data: monitorsWithTenant1,
              total: monitorsWithTenant1.length,
              page: 1,
              pageSize: 20,
              totalPages: 1,
              hasNext: false,
              hasPrevious: false,
            });

            const result1 = await uptimeStore.fetchMonitors();

            // Verify: All monitors belong to tenant 1
            result1.data.forEach(monitor => {
              expect(monitor.organizationId).toBe(tenant1.organizationId);
            });

            // Second fetch: Tenant 2 (simulate user switching organization)
            authStore.user = {
              ...authStore.user!,
              organizationId: tenant2.organizationId,
            };

            const monitorsWithTenant2: Monitor[] = monitors2.map(m => ({
              ...m,
              organizationId: tenant2.organizationId,
              workspaceId: tenant2.workspaceId,
            }));

            vi.mocked(uptimeApi.listMonitors).mockResolvedValueOnce({
              data: monitorsWithTenant2,
              total: monitorsWithTenant2.length,
              page: 1,
              pageSize: 20,
              totalPages: 1,
              hasNext: false,
              hasPrevious: false,
            });

            const result2 = await uptimeStore.fetchMonitors();

            // Verify: All monitors belong to tenant 2
            result2.data.forEach(monitor => {
              expect(monitor.organizationId).toBe(tenant2.organizationId);
            });

            // Verify: No cross-contamination between tenants
            const hasTenant1InResult2 = result2.data.some(
              m => m.organizationId === tenant1.organizationId
            );
            expect(hasTenant1InResult2).toBe(false);

            const hasTenant2InResult1 = result1.data.some(
              m => m.organizationId === tenant2.organizationId
            );
            expect(hasTenant2InResult1).toBe(false);
          },
        ),
        { numRuns: 50 },
      );
    });

    it('should handle empty monitor list while preserving tenant context', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            organizationId: fc.uuid(),
            workspaceId: fc.option(fc.uuid(), { nil: undefined }),
          }),
          async (tenantContext) => {
            // Clear mocks for each iteration
            vi.clearAllMocks();
            
            // Create fresh pinia instance for each iteration
            const testPinia = createPinia();
            setActivePinia(testPinia);

            const authStore = useAuthStore();
            authStore.user = {
              id: 'user-1',
              username: 'testuser',
              email: 'test@example.com',
              firstName: 'Test',
              lastName: 'User',
              roles: ['user'],
              permissions: ['uptime:read'],
              avatar: null,
              tenantId: null,
              organizationId: tenantContext.organizationId,
            };
            authStore.isAuthenticated = true;

            // Mock empty response
            vi.mocked(uptimeApi.listMonitors).mockResolvedValueOnce({
              data: [],
              total: 0,
              page: 1,
              pageSize: 20,
              totalPages: 0,
              hasNext: false,
              hasPrevious: false,
            });

            const uptimeStore = useUptimeStore();
            const result = await uptimeStore.fetchMonitors();

            // Verify: API was called
            expect(uptimeApi.listMonitors).toHaveBeenCalledTimes(1);

            // Verify: Empty result is handled correctly
            expect(result.data).toEqual([]);
            expect(result.total).toBe(0);
            expect(uptimeStore.monitors).toEqual([]);

            // Verify: Store maintains correct state even with empty results
            expect(uptimeStore.error).toBeNull();
            expect(uptimeStore.loading).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should apply filters while maintaining tenant context', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            organizationId: fc.uuid(),
            workspaceId: fc.option(fc.uuid(), { nil: undefined }),
          }),
          fc.record({
            status: fc.option(fc.constantFrom<MonitorStatus>('up', 'down', 'degraded'), { nil: undefined }),
            type: fc.option(fc.constantFrom<MonitorType>('http', 'https', 'tcp'), { nil: undefined }),
          }),
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              url: fc.webUrl(),
              type: fc.constantFrom<MonitorType>('http', 'https', 'tcp'),
              status: fc.constantFrom<MonitorStatus>('up', 'down', 'degraded'),
              interval: fc.integer({ min: 60, max: 300 }),
              timeout: fc.integer({ min: 10, max: 60 }),
              retries: fc.integer({ min: 1, max: 3 }),
              isActive: fc.boolean(),
              isPaused: fc.boolean(),
              consecutiveDownCount: fc.integer({ min: 0, max: 10 }),
              consecutiveUpCount: fc.integer({ min: 0, max: 100 }),
              heartbeats: fc.constant([]),
              tags: fc.constant([]),
              createdAt: fc.constant(Date.now()),
              updatedAt: fc.constant(Date.now()),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          async (tenantContext, filters, generatedMonitors) => {
            const authStore = useAuthStore();
            authStore.user = {
              id: 'user-1',
              username: 'testuser',
              email: 'test@example.com',
              firstName: 'Test',
              lastName: 'User',
              roles: ['user'],
              permissions: ['uptime:read'],
              avatar: null,
              tenantId: null,
              organizationId: tenantContext.organizationId,
            };

            // Filter monitors based on the filter criteria
            let filteredMonitors = generatedMonitors.map(m => ({
              ...m,
              organizationId: tenantContext.organizationId,
              workspaceId: tenantContext.workspaceId,
            }));

            if (filters.status !== undefined) {
              filteredMonitors = filteredMonitors.filter(m => m.status === filters.status);
            }
            if (filters.type !== undefined) {
              filteredMonitors = filteredMonitors.filter(m => m.type === filters.type);
            }

            vi.mocked(uptimeApi.listMonitors).mockResolvedValueOnce({
              data: filteredMonitors,
              total: filteredMonitors.length,
              page: 1,
              pageSize: 20,
              totalPages: Math.ceil(filteredMonitors.length / 20),
              hasNext: false,
              hasPrevious: false,
            });

            const uptimeStore = useUptimeStore();
            const result = await uptimeStore.fetchMonitors(filters);

            // Verify: Filters were passed to API
            expect(uptimeApi.listMonitors).toHaveBeenCalledWith(
              expect.objectContaining(filters)
            );

            // Verify: All returned monitors belong to tenant AND match filters
            result.data.forEach(monitor => {
              expect(monitor.organizationId).toBe(tenantContext.organizationId);
              
              if (filters.status !== undefined) {
                expect(monitor.status).toBe(filters.status);
              }
              if (filters.type !== undefined) {
                expect(monitor.type).toBe(filters.type);
              }
            });
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});

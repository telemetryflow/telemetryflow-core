/**
 * Property-Based Tests for useMonitorPolling Composable
 * Feature: frontend-backend-monitoring-uptime-integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fc from "fast-check";
import { useMonitorPolling } from "../useMonitorPolling";
import type { Monitor, MonitorStatus } from "@/types/uptime";

// Helper to create mock monitors
function createMockMonitor(
  id: string,
  status: MonitorStatus,
  lastCheckAt?: number,
): Monitor {
  return {
    id,
    name: `Monitor ${id}`,
    url: `https://example.com/${id}`,
    type: "http",
    status,
    interval: 60,
    timeout: 30,
    retries: 3,
    isActive: true,
    isPaused: false,
    consecutiveDownCount: 0,
    consecutiveUpCount: 0,
    heartbeats: [],
    tags: [],
    organizationId: "org-1",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastCheckAt,
  };
}

describe("useMonitorPolling - Property-Based Tests", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  /**
   * **Validates: Requirements 5.1**
   *
   * Property 15: Real-Time Status Updates
   *
   * For any monitor status change detected during polling, the Frontend should
   * update the displayed status without requiring manual refresh.
   */
  describe("Property 15: Real-Time Status Updates", () => {
    it("should detect and emit status changes for any monitor", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              initialStatus: fc.constantFrom<MonitorStatus>(
                "up",
                "down",
                "degraded",
                "paused",
                "pending",
              ),
              newStatus: fc.constantFrom<MonitorStatus>(
                "up",
                "down",
                "degraded",
                "paused",
                "pending",
              ),
            }),
            { minLength: 1, maxLength: 10 },
          ),
          async (monitorConfigs) => {
            const statusChanges: any[] = [];
            let callCount = 0;

            const fetchFn = vi.fn(async () => {
              callCount++;
              return monitorConfigs.map((config) =>
                createMockMonitor(
                  config.id,
                  callCount === 1 ? config.initialStatus : config.newStatus,
                ),
              );
            });

            const onStatusChange = vi.fn((changes) => {
              statusChanges.push(...changes);
            });

            const { startPolling, stopPolling } = useMonitorPolling({
              fetchFn,
              pollingInterval: 30000,
              onStatusChange,
            });

            startPolling();

            // Wait for initial poll
            await vi.runOnlyPendingTimersAsync();

            // Wait for second poll (status change)
            await vi.advanceTimersByTimeAsync(30000);

            stopPolling();

            // Verify status changes were detected
            const monitorsWithChanges = monitorConfigs.filter(
              (config) => config.initialStatus !== config.newStatus,
            );

            if (monitorsWithChanges.length > 0) {
              expect(onStatusChange).toHaveBeenCalled();
              expect(statusChanges.length).toBe(monitorsWithChanges.length);
            } else {
              // No changes, so callback should not be called
              expect(onStatusChange).not.toHaveBeenCalled();
            }

            // Verify each status change is correct
            statusChanges.forEach((change) => {
              const config = monitorConfigs.find((c) => c.id === change.monitorId);
              expect(config).toBeDefined();
              expect(change.previousStatus).toBe(config!.initialStatus);
              expect(change.currentStatus).toBe(config!.newStatus);
              expect(change.timestamp).toBeGreaterThan(0);
            });
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should not emit status changes when status remains the same", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              status: fc.constantFrom<MonitorStatus>(
                "up",
                "down",
                "degraded",
                "paused",
                "pending",
              ),
            }),
            { minLength: 1, maxLength: 10 },
          ),
          async (monitorConfigs) => {
            const onStatusChange = vi.fn();

            const fetchFn = vi.fn(async () =>
              monitorConfigs.map((config) =>
                createMockMonitor(config.id, config.status),
              ),
            );

            const { startPolling, stopPolling } = useMonitorPolling({
              fetchFn,
              pollingInterval: 30000,
              onStatusChange,
            });

            startPolling();

            // Wait for initial poll
            await vi.runOnlyPendingTimersAsync();

            // Wait for second poll (no status change)
            await vi.advanceTimersByTimeAsync(30000);

            stopPolling();

            // Verify no status changes were emitted
            expect(onStatusChange).not.toHaveBeenCalled();
          },
        ),
        { numRuns: 50 },
      );
    });
  });

  /**
   * **Validates: Requirements 5.3**
   *
   * Property 16: Polling Interval Constraint
   *
   * For any polling implementation, the Frontend should request updated monitor
   * data at intervals not exceeding once per 30 seconds.
   */
  describe("Property 16: Polling Interval Constraint", () => {
    it("should respect the configured polling interval", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 10000, max: 60000 }), // 10-60 seconds
          fc.integer({ min: 2, max: 5 }), // Number of polls to test
          async (interval, pollCount) => {
            const fetchFn = vi.fn(async () => [
              createMockMonitor("monitor-1", "up"),
            ]);

            const { startPolling, stopPolling } = useMonitorPolling({
              fetchFn,
              pollingInterval: interval,
            });

            startPolling();

            // Wait for initial poll
            await vi.runOnlyPendingTimersAsync();
            const initialCalls = fetchFn.mock.calls.length;

            // Advance time for multiple intervals
            for (let i = 0; i < pollCount; i++) {
              await vi.advanceTimersByTimeAsync(interval);
            }

            stopPolling();

            // Verify fetch was called the expected number of times
            // Initial poll + pollCount interval polls
            expect(fetchFn).toHaveBeenCalledTimes(initialCalls + pollCount);
          },
        ),
        { numRuns: 30 },
      );
    });

    it("should not poll more frequently than the configured interval", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 20000, max: 40000 }),
          async (interval) => {
            const fetchFn = vi.fn(async () => [
              createMockMonitor("monitor-1", "up"),
            ]);

            const { startPolling, stopPolling } = useMonitorPolling({
              fetchFn,
              pollingInterval: interval,
            });

            startPolling();

            // Wait for initial poll
            await vi.runOnlyPendingTimersAsync();
            const callsAfterStart = fetchFn.mock.calls.length;

            // Advance time to just before next interval
            await vi.advanceTimersByTimeAsync(interval - 1000);

            // Should not have polled yet
            expect(fetchFn).toHaveBeenCalledTimes(callsAfterStart);

            // Advance to complete the interval
            await vi.advanceTimersByTimeAsync(1000);

            // Now should have polled
            expect(fetchFn).toHaveBeenCalledTimes(callsAfterStart + 1);

            stopPolling();
          },
        ),
        { numRuns: 30 },
      );
    });

    it("should use 30-second default interval when not specified", async () => {
      const fetchFn = vi.fn(async () => [createMockMonitor("monitor-1", "up")]);

      const { startPolling, stopPolling } = useMonitorPolling({
        fetchFn,
        // No pollingInterval specified, should default to 30000
      });

      startPolling();

      // Wait for initial poll
      await vi.runOnlyPendingTimersAsync();
      const initialCalls = fetchFn.mock.calls.length;

      // Advance 30 seconds
      await vi.advanceTimersByTimeAsync(30000);

      // Should have polled again
      expect(fetchFn).toHaveBeenCalledTimes(initialCalls + 1);

      stopPolling();
    });
  });

  /**
   * **Validates: Requirements 5.4, 5.5**
   *
   * Property 17: Status Change Visualization
   *
   * For any monitor transitioning between status values (up ↔ down, up ↔ degraded, etc.),
   * the Frontend should provide a visual indication of the status change.
   */
  describe("Property 17: Status Change Visualization", () => {
    it("should emit status change events for all status transitions", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom<MonitorStatus>(
            "up",
            "down",
            "degraded",
            "paused",
            "pending",
          ),
          fc.constantFrom<MonitorStatus>(
            "up",
            "down",
            "degraded",
            "paused",
            "pending",
          ),
          async (fromStatus, toStatus) => {
            // Skip if no transition
            if (fromStatus === toStatus) {
              return;
            }

            const statusChanges: any[] = [];
            let callCount = 0;

            const fetchFn = vi.fn(async () => {
              callCount++;
              return [
                createMockMonitor(
                  "monitor-1",
                  callCount === 1 ? fromStatus : toStatus,
                ),
              ];
            });

            const onStatusChange = vi.fn((changes) => {
              statusChanges.push(...changes);
            });

            const { startPolling, stopPolling } = useMonitorPolling({
              fetchFn,
              pollingInterval: 30000,
              onStatusChange,
            });

            startPolling();

            // Wait for initial poll
            await vi.runOnlyPendingTimersAsync();

            // Wait for second poll (status change)
            await vi.advanceTimersByTimeAsync(30000);

            stopPolling();

            // Verify status change was detected
            expect(onStatusChange).toHaveBeenCalledTimes(1);
            expect(statusChanges).toHaveLength(1);

            const change = statusChanges[0];
            expect(change.monitorId).toBe("monitor-1");
            expect(change.previousStatus).toBe(fromStatus);
            expect(change.currentStatus).toBe(toStatus);
            expect(change.timestamp).toBeGreaterThan(0);
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should detect multiple simultaneous status changes", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.tuple(
              fc.uuid(),
              fc.constantFrom<MonitorStatus>("up", "down", "degraded"),
              fc.constantFrom<MonitorStatus>("up", "down", "degraded"),
            ),
            { minLength: 2, maxLength: 10 },
          ),
          async (transitions) => {
            // Filter out non-transitions
            const actualTransitions = transitions.filter(
              ([, from, to]) => from !== to,
            );

            if (actualTransitions.length === 0) {
              return; // Skip if no actual transitions
            }

            const statusChanges: any[] = [];
            let callCount = 0;

            const fetchFn = vi.fn(async () => {
              callCount++;
              return transitions.map(([id, from, to]) =>
                createMockMonitor(id, callCount === 1 ? from : to),
              );
            });

            const onStatusChange = vi.fn((changes) => {
              statusChanges.push(...changes);
            });

            const { startPolling, stopPolling } = useMonitorPolling({
              fetchFn,
              pollingInterval: 30000,
              onStatusChange,
            });

            startPolling();

            // Wait for initial poll
            await vi.runOnlyPendingTimersAsync();

            // Wait for second poll (status changes)
            await vi.advanceTimersByTimeAsync(30000);

            stopPolling();

            // Verify all status changes were detected
            expect(statusChanges).toHaveLength(actualTransitions.length);

            // Verify each transition was captured correctly
            actualTransitions.forEach(([id, from, to]) => {
              const change = statusChanges.find((c) => c.monitorId === id);
              expect(change).toBeDefined();
              expect(change.previousStatus).toBe(from);
              expect(change.currentStatus).toBe(to);
            });
          },
        ),
        { numRuns: 30 },
      );
    });
  });

  /**
   * **Validates: Requirements 5.6**
   *
   * Property 18: Automatic Check History Refresh
   *
   * For any monitor detail view with active polling, the Frontend should
   * automatically update check history when new checks become available.
   */
  describe("Property 18: Automatic Check History Refresh", () => {
    it("should detect and emit new check events when lastCheckAt changes", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              initialCheckTime: fc.integer({ min: 1000000, max: 2000000 }),
              newCheckTime: fc.integer({ min: 2000001, max: 3000000 }),
            }),
            { minLength: 1, maxLength: 10 },
          ),
          async (monitorConfigs) => {
            const newCheckEvents: string[][] = [];
            let callCount = 0;

            const fetchFn = vi.fn(async () => {
              callCount++;
              return monitorConfigs.map((config) =>
                createMockMonitor(
                  config.id,
                  "up",
                  callCount === 1 ? config.initialCheckTime : config.newCheckTime,
                ),
              );
            });

            const onNewChecks = vi.fn((monitorIds) => {
              newCheckEvents.push(monitorIds);
            });

            const { startPolling, stopPolling } = useMonitorPolling({
              fetchFn,
              pollingInterval: 30000,
              onNewChecks,
            });

            startPolling();

            // Wait for initial poll
            await vi.runOnlyPendingTimersAsync();

            // Wait for second poll (new checks)
            await vi.advanceTimersByTimeAsync(30000);

            stopPolling();

            // Verify new check events were emitted
            expect(onNewChecks).toHaveBeenCalled();

            const allMonitorIds = newCheckEvents.flat();
            expect(allMonitorIds).toHaveLength(monitorConfigs.length);

            // Verify all monitors with new checks were detected
            monitorConfigs.forEach((config) => {
              expect(allMonitorIds).toContain(config.id);
            });
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should not emit new check events when lastCheckAt remains the same", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              checkTime: fc.integer({ min: 1000000, max: 3000000 }),
            }),
            { minLength: 1, maxLength: 10 },
          ),
          async (monitorConfigs) => {
            const onNewChecks = vi.fn();

            const fetchFn = vi.fn(async () =>
              monitorConfigs.map((config) =>
                createMockMonitor(config.id, "up", config.checkTime),
              ),
            );

            const { startPolling, stopPolling } = useMonitorPolling({
              fetchFn,
              pollingInterval: 30000,
              onNewChecks,
            });

            startPolling();

            // Wait for initial poll
            await vi.runOnlyPendingTimersAsync();

            // Wait for second poll (no new checks)
            await vi.advanceTimersByTimeAsync(30000);

            stopPolling();

            // Verify no new check events were emitted
            expect(onNewChecks).not.toHaveBeenCalled();
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should only detect new checks when lastCheckAt increases", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1000000, max: 2000000 }),
          fc.integer({ min: -100000, max: 100000 }),
          async (initialTime, timeDelta) => {
            const newTime = initialTime + timeDelta;
            const onNewChecks = vi.fn();
            let callCount = 0;

            const fetchFn = vi.fn(async () => {
              callCount++;
              return [
                createMockMonitor(
                  "monitor-1",
                  "up",
                  callCount === 1 ? initialTime : newTime,
                ),
              ];
            });

            const { startPolling, stopPolling } = useMonitorPolling({
              fetchFn,
              pollingInterval: 30000,
              onNewChecks,
            });

            startPolling();

            // Wait for initial poll
            await vi.runOnlyPendingTimersAsync();

            // Wait for second poll
            await vi.advanceTimersByTimeAsync(30000);

            stopPolling();

            // Should only emit if newTime > initialTime
            if (newTime > initialTime) {
              expect(onNewChecks).toHaveBeenCalledWith(["monitor-1"]);
            } else {
              expect(onNewChecks).not.toHaveBeenCalled();
            }
          },
        ),
        { numRuns: 50 },
      );
    });
  });

  /**
   * Additional property: Polling lifecycle management
   *
   * Verify that polling can be started and stopped correctly
   */
  describe("Polling Lifecycle Management", () => {
    it("should start and stop polling correctly for any configuration", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 10000, max: 60000 }),
          async (interval) => {
            const fetchFn = vi.fn(async () => [
              createMockMonitor("monitor-1", "up"),
            ]);

            const { startPolling, stopPolling, isPolling } = useMonitorPolling({
              fetchFn,
              pollingInterval: interval,
            });

            // Initially not polling
            expect(isPolling.value).toBe(false);

            // Start polling
            startPolling();
            expect(isPolling.value).toBe(true);

            // Wait for initial poll
            await vi.runOnlyPendingTimersAsync();

            // Stop polling
            stopPolling();
            expect(isPolling.value).toBe(false);

            const callsAfterStop = fetchFn.mock.calls.length;

            // Advance time - should not poll anymore
            await vi.advanceTimersByTimeAsync(interval * 2);

            expect(fetchFn).toHaveBeenCalledTimes(callsAfterStop);
          },
        ),
        { numRuns: 30 },
      );
    });

    it("should handle multiple start/stop cycles", async () => {
      const fetchFn = vi.fn(async () => [createMockMonitor("monitor-1", "up")]);

      const { startPolling, stopPolling, isPolling } = useMonitorPolling({
        fetchFn,
        pollingInterval: 30000,
      });

      // First cycle
      startPolling();
      expect(isPolling.value).toBe(true);
      await vi.runOnlyPendingTimersAsync();
      stopPolling();
      expect(isPolling.value).toBe(false);

      const callsAfterFirstCycle = fetchFn.mock.calls.length;

      // Second cycle
      startPolling();
      expect(isPolling.value).toBe(true);
      await vi.runOnlyPendingTimersAsync();
      stopPolling();
      expect(isPolling.value).toBe(false);

      // Should have polled again
      expect(fetchFn.mock.calls.length).toBeGreaterThan(callsAfterFirstCycle);
    });
  });
});

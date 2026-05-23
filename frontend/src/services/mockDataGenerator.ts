/**
 * Mock Data Generator for TelemetryFlow-Viz
 * This file re-exports from the modular mock data files in src/mocks/
 *
 * For feature-specific mock data, import directly from:
 * - @/mocks/metrics - Metrics mock data
 * - @/mocks/logs - Logs mock data
 * - @/mocks/traces - Traces mock data
 * - @/mocks/exemplars - Exemplars mock data
 * - @/mocks/correlations - Correlations mock data
 * - @/mocks/home - Home dashboard mock data
 * - @/mocks/alerts - Alerts mock data
 * - @/mocks/shared - Shared utilities and constants
 */

// Re-export everything from the mocks module
export * from '@/mocks';

// Re-export the default mockDataGenerator for backward compatibility
export { mockDataGenerator, mockDataGenerator as default } from '@/mocks';

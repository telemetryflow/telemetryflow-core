/**
 * Alert Rules Library
 * Pre-configured alert rule templates based on awesome-prometheus-alerts
 * @see https://samber.github.io/awesome-prometheus-alerts/
 */

// Types & Interfaces
export * from './types';

// Rule Categories
export * from './categories/host-hardware';
export * from './categories/containers';
export * from './categories/kubernetes';
export * from './categories/databases';
export * from './categories/message-queues';
export * from './categories/web-servers';
export * from './categories/network-security';
export * from './categories/storage';
export * from './categories/observability';

// TelemetryFlow Platform
export * from './categories/tfo-agent';
export * from './categories/tfo-collector';

// Utilities
export * from './utils/rule-builder';
export * from './utils/condition-builder';

// Registry
export { AlertRulesRegistry, getRulesByCategory, getAllRules, getRuleById } from './registry';

import { TimeRange, TenantContext, SignalType } from '../../../domain/value-objects';
import { UnifiedSearchOptions } from '../../../domain/types';

/**
 * Unified Search CQRS Query
 * Search across multiple signal types
 */
export class UnifiedSearchQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly timeRange: TimeRange,
    public readonly query: string,
    public readonly signalTypes?: SignalType[],
    public readonly options?: UnifiedSearchOptions,
  ) {}
}

/**
 * Cross-Signal Correlation CQRS Query
 * Find related signals across different types
 */
export class CrossSignalCorrelationQuery {
  constructor(
    public readonly tenantContext: TenantContext,
    public readonly timeRange: TimeRange,
    public readonly anchor: {
      type: SignalType;
      id: string;
    },
    public readonly correlateWith?: SignalType[],
    public readonly options?: {
      maxResults?: number;
      includeTimeline?: boolean;
    },
  ) {}
}

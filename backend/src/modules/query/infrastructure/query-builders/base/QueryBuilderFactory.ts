import { Injectable } from "@nestjs/common";
import { ClickHouseService } from "@/shared/clickhouse/clickhouse.service";
import { MetricsQueryBuilder } from "../clickhouse/MetricsQueryBuilder";
import { LogsQueryBuilder } from "../clickhouse/LogsQueryBuilder";
import { TracesQueryBuilder } from "../clickhouse/TracesQueryBuilder";
import { SignalType } from "../../../domain/value-objects";

/**
 * Query Builder Factory
 * Creates appropriate query builders based on signal type
 */
@Injectable()
export class QueryBuilderFactory {
  constructor(private readonly clickhouseService: ClickHouseService) {}

  /**
   * Create query builder for a signal type
   */
  createForSignal(
    type: SignalType,
  ): MetricsQueryBuilder | LogsQueryBuilder | TracesQueryBuilder {
    switch (type) {
      case SignalType.METRICS:
        return this.createMetricsBuilder();
      case SignalType.LOGS:
        return this.createLogsBuilder();
      case SignalType.TRACES:
        return this.createTracesBuilder();
      case SignalType.EXEMPLARS:
        // For now, reuse metrics builder with exemplars table
        return this.createMetricsBuilder();
      case SignalType.CORRELATIONS:
        // For now, reuse traces builder
        return this.createTracesBuilder();
      default:
        throw new Error(`Unknown signal type: ${type}`);
    }
  }

  /**
   * Create metrics query builder
   */
  createMetricsBuilder(): MetricsQueryBuilder {
    return new MetricsQueryBuilder(this.clickhouseService);
  }

  /**
   * Create logs query builder
   */
  createLogsBuilder(): LogsQueryBuilder {
    return new LogsQueryBuilder(this.clickhouseService);
  }

  /**
   * Create traces query builder
   */
  createTracesBuilder(): TracesQueryBuilder {
    return new TracesQueryBuilder(this.clickhouseService);
  }
}

import { Injectable } from "@nestjs/common";
import { ClickHouseService } from "@/shared/clickhouse/clickhouse.service";
import { QueryBuilderFactory } from "../../infrastructure/query-builders/base/QueryBuilderFactory";
import { MetricsQueryBuilder } from "../../infrastructure/query-builders/clickhouse/MetricsQueryBuilder";
import { LogsQueryBuilder } from "../../infrastructure/query-builders/clickhouse/LogsQueryBuilder";
import { TracesQueryBuilder } from "../../infrastructure/query-builders/clickhouse/TracesQueryBuilder";
import { SignalType } from "../../domain/value-objects";

/**
 * Query Builder Service
 * Factory service for creating query builders
 */
@Injectable()
export class QueryBuilderService {
  private readonly factory: QueryBuilderFactory;

  constructor(private readonly clickhouseService: ClickHouseService) {
    this.factory = new QueryBuilderFactory(clickhouseService);
  }

  /**
   * Create query builder for a signal type
   */
  forSignal(
    type: SignalType,
  ): MetricsQueryBuilder | LogsQueryBuilder | TracesQueryBuilder {
    return this.factory.createForSignal(type);
  }

  /**
   * Create metrics query builder
   */
  metrics(): MetricsQueryBuilder {
    return this.factory.createMetricsBuilder();
  }

  /**
   * Create logs query builder
   */
  logs(): LogsQueryBuilder {
    return this.factory.createLogsBuilder();
  }

  /**
   * Create traces query builder
   */
  traces(): TracesQueryBuilder {
    return this.factory.createTracesBuilder();
  }
}

import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { ClickHouseModule } from "@/shared/clickhouse/clickhouse.module";

import { AllQueryHandlers } from "./application/handlers";
import {
  QueryBuilderService,
  StatsAggregationService,
} from "./application/services";
import { QueryBuilderFactory } from "./infrastructure/query-builders/base/QueryBuilderFactory";
import { ResponseNormalizer } from "./infrastructure/adapters/ResponseNormalizer";
import { SignalsQueryController } from "./presentation/controllers";

@Module({
  imports: [CqrsModule, ClickHouseModule],
  controllers: [SignalsQueryController],
  providers: [
    ...AllQueryHandlers,
    QueryBuilderService,
    StatsAggregationService,
    QueryBuilderFactory,
    ResponseNormalizer,
  ],
  exports: [QueryBuilderService, StatsAggregationService],
})
export class QueryModule {}

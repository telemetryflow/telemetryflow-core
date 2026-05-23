import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { ListAlertInstancesQuery } from "../queries";
import { AlertInstanceResponseDto } from "../dto";
import { CacheService } from "@/shared/cache/cache.service";
import {
  ALERT_INSTANCE_REPOSITORY,
  IAlertInstanceRepository,
} from "../../domain";

export interface PaginatedAlertInstancesResponse {
  items: AlertInstanceResponseDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@QueryHandler(ListAlertInstancesQuery)
export class ListAlertInstancesHandler implements IQueryHandler<ListAlertInstancesQuery> {
  constructor(
    @Inject(ALERT_INSTANCE_REPOSITORY)
    private readonly alertInstanceRepository: IAlertInstanceRepository,
    private readonly cacheService: CacheService,
  ) {}

  async execute(
    query: ListAlertInstancesQuery,
  ): Promise<PaginatedAlertInstancesResponse> {
    const cacheKey = `alerting:instances:${query.organizationId}:${query.page}:${query.pageSize}:${query.status ?? ""}:${query.severity ?? ""}`;
    return this.cacheService.getOrSet(cacheKey, () => this.fetchInstances(query), { ttl: 30 });
  }

  private async fetchInstances(
    query: ListAlertInstancesQuery,
  ): Promise<PaginatedAlertInstancesResponse> {
    const { items, total } =
      await this.alertInstanceRepository.findByOrganization(
        query.organizationId,
        {
          page: query.page,
          pageSize: query.pageSize,
          status: query.status,
          severity: query.severity,
          alertRuleId: query.alertRuleId,
          startDate: query.startDate,
          endDate: query.endDate,
        },
      );

    const totalPages = Math.ceil(total / query.pageSize);

    return {
      items: items.map((instance) =>
        AlertInstanceResponseDto.fromDomain(instance),
      ),
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages,
    };
  }
}

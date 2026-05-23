import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { ListAlertRulesQuery } from "../queries";
import { AlertRuleResponseDto } from "../dto";
import { CacheService } from "@/shared/cache/cache.service";
import { ALERT_RULE_REPOSITORY, IAlertRuleRepository } from "../../domain";

export interface PaginatedAlertRulesResponse {
  items: AlertRuleResponseDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@QueryHandler(ListAlertRulesQuery)
export class ListAlertRulesHandler implements IQueryHandler<ListAlertRulesQuery> {
  constructor(
    @Inject(ALERT_RULE_REPOSITORY)
    private readonly alertRuleRepository: IAlertRuleRepository,
    private readonly cacheService: CacheService,
  ) {}

  async execute(
    query: ListAlertRulesQuery,
  ): Promise<PaginatedAlertRulesResponse> {
    const cacheKey = `alerting:rules:${query.organizationId}:${query.page}:${query.pageSize}:${query.enabled ?? ""}:${query.severity ?? ""}:${query.state ?? ""}:${query.graphId ?? ""}`;
    return this.cacheService.getOrSet(cacheKey, () => this.fetchRules(query), { ttl: 60 });
  }

  private async fetchRules(
    query: ListAlertRulesQuery,
  ): Promise<PaginatedAlertRulesResponse> {
    const { items, total } = await this.alertRuleRepository.findByOrganization(
      query.organizationId,
      {
        page: query.page,
        pageSize: query.pageSize,
        enabled: query.enabled,
        severity: query.severity,
        state: query.state,
        search: query.search,
        graphId: query.graphId,
      },
    );

    const totalPages = Math.ceil(total / query.pageSize);

    return {
      items: items.map((rule) => AlertRuleResponseDto.fromDomain(rule)),
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages,
    };
  }
}

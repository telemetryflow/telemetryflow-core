import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { ListPoliciesQuery } from "../queries/ListPolicies.query";
import {
  IDataMaskingPolicyRepository,
  DATA_MASKING_POLICY_REPOSITORY,
} from "../../domain/repositories/IDataMaskingPolicyRepository";
import {
  ListPoliciesResponseDto,
  PolicyResponseDto,
} from "../dto/PolicyResponse.dto";

@QueryHandler(ListPoliciesQuery)
export class ListPoliciesHandler implements IQueryHandler<ListPoliciesQuery> {
  constructor(
    @Inject(DATA_MASKING_POLICY_REPOSITORY)
    private readonly repository: IDataMaskingPolicyRepository,
  ) {}

  async execute(query: ListPoliciesQuery): Promise<ListPoliciesResponseDto> {
    const result = await this.repository.list({
      organizationId: query.organizationId,
      workspaceId: query.workspaceId,
      enabled: query.enabled,
      page: query.page,
      pageSize: query.pageSize,
      search: query.search,
    });

    const dto = new ListPoliciesResponseDto();
    dto.data = result.data.map(PolicyResponseDto.fromDomain);
    dto.total = result.total;
    dto.page = result.page;
    dto.pageSize = result.pageSize;
    dto.totalPages = Math.ceil(result.total / result.pageSize);
    return dto;
  }
}

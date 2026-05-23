import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { Inject, NotFoundException } from "@nestjs/common";
import { GetPolicyQuery } from "../queries/GetPolicy.query";
import {
  IDataMaskingPolicyRepository,
  DATA_MASKING_POLICY_REPOSITORY,
} from "../../domain/repositories/IDataMaskingPolicyRepository";
import { PolicyResponseDto } from "../dto/PolicyResponse.dto";

@QueryHandler(GetPolicyQuery)
export class GetPolicyHandler implements IQueryHandler<GetPolicyQuery> {
  constructor(
    @Inject(DATA_MASKING_POLICY_REPOSITORY)
    private readonly repository: IDataMaskingPolicyRepository,
  ) {}

  async execute(query: GetPolicyQuery): Promise<PolicyResponseDto> {
    const policy = await this.repository.findById(query.id);
    if (!policy || policy.organizationId !== query.organizationId) {
      throw new NotFoundException(`Data masking policy ${query.id} not found`);
    }
    return PolicyResponseDto.fromDomain(policy);
  }
}

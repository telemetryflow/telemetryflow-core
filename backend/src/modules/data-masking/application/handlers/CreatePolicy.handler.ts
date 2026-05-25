import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { CreatePolicyCommand } from "../commands/CreatePolicy.command";
import { DataMaskingPolicy } from "../../domain/aggregates/DataMaskingPolicy";
import {
  IDataMaskingPolicyRepository,
  DATA_MASKING_POLICY_REPOSITORY,
} from "../../domain/repositories/IDataMaskingPolicyRepository";
import { PolicyResponseDto } from "../dto/PolicyResponse.dto";
import {
  ICacheService,
  CACHE_SERVICE,
} from "@/shared/cache/interfaces/cache.interface";

@CommandHandler(CreatePolicyCommand)
export class CreatePolicyHandler implements ICommandHandler<CreatePolicyCommand> {
  constructor(
    @Inject(DATA_MASKING_POLICY_REPOSITORY)
    private readonly repository: IDataMaskingPolicyRepository,
    @Inject(CACHE_SERVICE)
    private readonly cache: ICacheService,
  ) {}

  async execute(command: CreatePolicyCommand): Promise<PolicyResponseDto> {
    const now = new Date();
    const policy = new DataMaskingPolicy({
      id: uuidv4(),
      organizationId: command.organizationId,
      workspaceId: command.workspaceId,
      name: command.name,
      description: command.description,
      enabled: command.enabled,
      rules: command.rules,
      createdBy: command.createdBy,
      createdAt: now,
      updatedAt: now,
    });

    const saved = await this.repository.save(policy);

    // Invalidate org-level policy cache
    await this.cache.delete(`masking_policies:${command.organizationId}`);

    return PolicyResponseDto.fromDomain(saved);
  }
}

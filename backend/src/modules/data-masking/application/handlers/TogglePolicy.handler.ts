import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject, NotFoundException } from "@nestjs/common";
import { TogglePolicyCommand } from "../commands/TogglePolicy.command";
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

@CommandHandler(TogglePolicyCommand)
export class TogglePolicyHandler implements ICommandHandler<TogglePolicyCommand> {
  constructor(
    @Inject(DATA_MASKING_POLICY_REPOSITORY)
    private readonly repository: IDataMaskingPolicyRepository,
    @Inject(CACHE_SERVICE)
    private readonly cache: ICacheService,
  ) {}

  async execute(command: TogglePolicyCommand): Promise<PolicyResponseDto> {
    const existing = await this.repository.findById(command.id);
    if (!existing || existing.organizationId !== command.organizationId) {
      throw new NotFoundException(
        `Data masking policy ${command.id} not found`,
      );
    }

    const updated = new DataMaskingPolicy({
      id: existing.id,
      organizationId: existing.organizationId,
      workspaceId: existing.workspaceId,
      name: existing.name,
      description: existing.description,
      enabled: command.enabled,
      rules: existing.rules.map((r) => r.toJSON()),
      createdBy: existing.createdBy,
      updatedBy: command.updatedBy,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    });

    const saved = await this.repository.save(updated);
    await this.cache.delete(`masking_policies:${existing.organizationId}`);

    return PolicyResponseDto.fromDomain(saved);
  }
}

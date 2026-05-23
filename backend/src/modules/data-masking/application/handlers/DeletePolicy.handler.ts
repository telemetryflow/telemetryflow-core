import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject, NotFoundException } from "@nestjs/common";
import { DeletePolicyCommand } from "../commands/DeletePolicy.command";
import {
  IDataMaskingPolicyRepository,
  DATA_MASKING_POLICY_REPOSITORY,
} from "../../domain/repositories/IDataMaskingPolicyRepository";
import {
  ICacheService,
  CACHE_SERVICE,
} from "@/shared/cache/interfaces/cache.interface";

@CommandHandler(DeletePolicyCommand)
export class DeletePolicyHandler implements ICommandHandler<DeletePolicyCommand> {
  constructor(
    @Inject(DATA_MASKING_POLICY_REPOSITORY)
    private readonly repository: IDataMaskingPolicyRepository,
    @Inject(CACHE_SERVICE)
    private readonly cache: ICacheService,
  ) {}

  async execute(command: DeletePolicyCommand): Promise<void> {
    const existing = await this.repository.findById(command.id);
    if (!existing || existing.organizationId !== command.organizationId) {
      throw new NotFoundException(
        `Data masking policy ${command.id} not found`,
      );
    }

    await this.repository.delete(command.id);
    await this.cache.delete(`masking_policies:${existing.organizationId}`);
  }
}

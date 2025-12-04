import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, ConflictException } from '@nestjs/common';
import { CreateTenantCommand } from '../commands/CreateTenant.command';
import { ITenantRepository } from '../../domain/repositories/ITenantRepository';
import { Tenant } from '../../domain/aggregates/Tenant';
import { WorkspaceId } from '../../domain/value-objects/WorkspaceId';

@CommandHandler(CreateTenantCommand)
export class CreateTenantHandler implements ICommandHandler<CreateTenantCommand> {
  constructor(
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
  ) {}
  async execute(command: CreateTenantCommand): Promise<string> {
    const existing = await this.tenantRepository.findByCode(command.code);
    if (existing) {
      throw new ConflictException('Tenant code already exists');
    }
    const workspaceId = WorkspaceId.create(command.workspaceId);
    const tenant = Tenant.create(
      command.name,
      command.code,
      workspaceId,
      command.domain,
    );
    await this.tenantRepository.save(tenant);
    return tenant.id.getValue();
  }
}

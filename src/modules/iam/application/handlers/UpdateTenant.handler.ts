import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { UpdateTenantCommand } from '../commands/UpdateTenant.command';
import { ITenantRepository } from '../../domain/repositories/ITenantRepository';
import { TenantId } from '../../domain/value-objects/TenantId';

@CommandHandler(UpdateTenantCommand)
export class UpdateTenantHandler implements ICommandHandler<UpdateTenantCommand> {
  constructor(
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
  ) {}
  async execute(command: UpdateTenantCommand): Promise<void> {
    const id = TenantId.create(command.id);
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    tenant.update(command.name, command.domain);
    await this.tenantRepository.save(tenant);
  }
}

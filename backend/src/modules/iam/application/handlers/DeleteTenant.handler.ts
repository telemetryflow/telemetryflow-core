import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { DeleteTenantCommand } from '../commands/DeleteTenant.command';
import { ITenantRepository } from '../../domain/repositories/ITenantRepository';
import { TenantId } from '../../domain/value-objects/TenantId';

@CommandHandler(DeleteTenantCommand)
export class DeleteTenantHandler implements ICommandHandler<DeleteTenantCommand> {
  constructor(
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
  ) {}
  async execute(command: DeleteTenantCommand): Promise<void> {
    const id = TenantId.create(command.id);
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    tenant.delete();
    await this.tenantRepository.delete(id);
  }
}

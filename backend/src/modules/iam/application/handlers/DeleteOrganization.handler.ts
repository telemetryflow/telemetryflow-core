import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { DeleteOrganizationCommand } from '../commands/DeleteOrganization.command';
import { IOrganizationRepository } from '../../domain/repositories/IOrganizationRepository';
import { OrganizationId } from '../../domain/value-objects/OrganizationId';

@CommandHandler(DeleteOrganizationCommand)
export class DeleteOrganizationHandler implements ICommandHandler<DeleteOrganizationCommand> {
  constructor(
    @Inject('IOrganizationRepository')
    private readonly organizationRepository: IOrganizationRepository,
  ) {}
  async execute(command: DeleteOrganizationCommand): Promise<void> {
    const id = OrganizationId.create(command.id);
    const organization = await this.organizationRepository.findById(id);
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }
    organization.delete();
    await this.organizationRepository.delete(id);
  }
}

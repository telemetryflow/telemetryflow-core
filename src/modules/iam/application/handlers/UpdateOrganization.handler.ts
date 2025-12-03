import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { UpdateOrganizationCommand } from '../commands/UpdateOrganization.command';
import { IOrganizationRepository } from '../../domain/repositories/IOrganizationRepository';
import { OrganizationId } from '../../domain/value-objects/OrganizationId';

@CommandHandler(UpdateOrganizationCommand)
export class UpdateOrganizationHandler implements ICommandHandler<UpdateOrganizationCommand> {
  constructor(
    @Inject('IOrganizationRepository')
    private readonly organizationRepository: IOrganizationRepository,
  ) {}
  async execute(command: UpdateOrganizationCommand): Promise<void> {
    const id = OrganizationId.create(command.id);
    const organization = await this.organizationRepository.findById(id);
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }
    organization.update(command.name, command.description, command.domain);
    await this.organizationRepository.save(organization);
  }
}

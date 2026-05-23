import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateOrganizationCommand } from '../commands/CreateOrganization.command';
import { IOrganizationRepository } from '../../domain/repositories/IOrganizationRepository';
import { Organization } from '../../domain/aggregates/Organization';
import { RegionId } from '../../domain/value-objects/RegionId';

@CommandHandler(CreateOrganizationCommand)
export class CreateOrganizationHandler implements ICommandHandler<CreateOrganizationCommand> {
  constructor(
    @Inject('IOrganizationRepository')
    private readonly organizationRepository: IOrganizationRepository,
  ) {}
  async execute(command: CreateOrganizationCommand): Promise<string> {
    const regionId = RegionId.create(command.regionId);
    const organization = Organization.create(
      command.name,
      command.code,
      regionId,
      command.description,
      command.domain,
    );
    await this.organizationRepository.save(organization);
    return organization.id.getValue();
  }
}

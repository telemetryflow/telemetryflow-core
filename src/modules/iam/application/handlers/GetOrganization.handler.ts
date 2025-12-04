import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { GetOrganizationQuery } from '../queries/GetOrganization.query';
import { IOrganizationRepository } from '../../domain/repositories/IOrganizationRepository';
import { OrganizationId } from '../../domain/value-objects/OrganizationId';
import { OrganizationResponseDto } from '../dto/OrganizationResponse.dto';

@QueryHandler(GetOrganizationQuery)
export class GetOrganizationHandler implements IQueryHandler<GetOrganizationQuery> {
  constructor(
    @Inject('IOrganizationRepository')
    private readonly organizationRepository: IOrganizationRepository,
  ) {}
  async execute(query: GetOrganizationQuery): Promise<OrganizationResponseDto> {
    const id = OrganizationId.create(query.id);
    const organization = await this.organizationRepository.findById(id);
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }
    return {
      id: organization.id.getValue(),
      name: organization.name,
      code: organization.code,
      description: organization.description,
      domain: organization.domain,
      isActive: organization.isActive,
      regionId: organization.regionId.getValue(),
    };
  }
}

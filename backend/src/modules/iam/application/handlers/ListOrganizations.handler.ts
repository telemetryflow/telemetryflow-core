import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListOrganizationsQuery } from '../queries/ListOrganizations.query';
import { IOrganizationRepository } from '../../domain/repositories/IOrganizationRepository';
import { CacheService } from '@/shared/cache/cache.service';
import { RegionId } from '../../domain/value-objects/RegionId';
import { IamOrganizationResponseDto } from '../dto/OrganizationResponse.dto';

@QueryHandler(ListOrganizationsQuery)
export class ListOrganizationsHandler implements IQueryHandler<ListOrganizationsQuery> {
  constructor(
    @Inject('IOrganizationRepository')
    private readonly organizationRepository: IOrganizationRepository,
    private readonly cacheService: CacheService,
  ) {}
  async execute(query: ListOrganizationsQuery): Promise<IamOrganizationResponseDto[]> {
    const cacheKey = `iam:orgs:list:${query.regionId || 'all'}`;
    return this.cacheService.getOrSet(cacheKey, () => this.fetchOrgs(query), { ttl: 300 });
  }
  private async fetchOrgs(query: ListOrganizationsQuery): Promise<IamOrganizationResponseDto[]> {
    const organizations = query.regionId
      ? await this.organizationRepository.findByRegion(RegionId.create(query.regionId))
      : await this.organizationRepository.findAll();
    return organizations.map(org => ({
      id: org.id.getValue(),
      name: org.name,
      code: org.code,
      description: org.description,
      domain: org.domain,
      isActive: org.isActive,
      regionId: org.regionId.getValue(),
    }));
  }
}

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListRegionsQuery } from '../queries/ListRegions.query';
import { IRegionRepository } from '../../domain/repositories/IRegionRepository';
import { RegionResponseDto } from '../dto/RegionResponse.dto';

@QueryHandler(ListRegionsQuery)
export class ListRegionsHandler implements IQueryHandler<ListRegionsQuery> {
  constructor(
    @Inject('IRegionRepository')
    private readonly regionRepository: IRegionRepository,
  ) {}
  async execute(query: ListRegionsQuery): Promise<RegionResponseDto[]> {
    const regions = await this.regionRepository.findAll();
    return regions
      .filter(r => !query.activeOnly || r.getIsActive())
      .map(region => ({
        id: region.getId().getValue(),
        name: region.getName(),
        code: region.getCode(),
        description: region.getDescription(),
        isActive: region.getIsActive(),
        createdAt: region.getCreatedAt(),
        updatedAt: region.getUpdatedAt(),
      }));
  }
}

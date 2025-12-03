import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { GetRegionQuery } from '../queries/GetRegion.query';
import { IRegionRepository } from '../../domain/repositories/IRegionRepository';
import { RegionId } from '../../domain/value-objects/RegionId';
import { RegionResponseDto } from '../dto/RegionResponse.dto';

@QueryHandler(GetRegionQuery)
export class GetRegionHandler implements IQueryHandler<GetRegionQuery> {
  constructor(
    @Inject('IRegionRepository')
    private readonly regionRepository: IRegionRepository,
  ) {}
  async execute(query: GetRegionQuery): Promise<RegionResponseDto> {
    const regionId = RegionId.create(query.id);
    const region = await this.regionRepository.findById(regionId);
    if (!region) {
      throw new NotFoundException('Region not found');
    }
    return {
      id: region.getId().getValue(),
      name: region.getName(),
      code: region.getCode(),
      description: region.getDescription(),
      isActive: region.getIsActive(),
      createdAt: region.getCreatedAt(),
      updatedAt: region.getUpdatedAt(),
    };
  }
}

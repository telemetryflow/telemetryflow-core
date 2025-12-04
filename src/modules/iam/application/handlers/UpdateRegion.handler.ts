import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { UpdateRegionCommand } from '../commands/UpdateRegion.command';
import { IRegionRepository } from '../../domain/repositories/IRegionRepository';
import { RegionId } from '../../domain/value-objects/RegionId';
import { RegionResponseDto } from '../dto/RegionResponse.dto';

@CommandHandler(UpdateRegionCommand)
export class UpdateRegionHandler implements ICommandHandler<UpdateRegionCommand> {
  constructor(
    @Inject('IRegionRepository')
    private readonly regionRepository: IRegionRepository,
  ) {}
  async execute(command: UpdateRegionCommand): Promise<RegionResponseDto> {
    const regionId = RegionId.create(command.id);
    const region = await this.regionRepository.findById(regionId);
    if (!region) {
      throw new NotFoundException('Region not found');
    }
    region.update(command.name, command.description);
    await this.regionRepository.save(region);
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

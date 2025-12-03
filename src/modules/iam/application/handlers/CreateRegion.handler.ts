import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, ConflictException } from '@nestjs/common';
import { CreateRegionCommand } from '../commands/CreateRegion.command';
import { IRegionRepository } from '../../domain/repositories/IRegionRepository';
import { Region } from '../../domain/aggregates/Region';
import { RegionResponseDto } from '../dto/RegionResponse.dto';

@CommandHandler(CreateRegionCommand)
export class CreateRegionHandler implements ICommandHandler<CreateRegionCommand> {
  constructor(
    @Inject('IRegionRepository')
    private readonly regionRepository: IRegionRepository,
  ) {}
  async execute(command: CreateRegionCommand): Promise<RegionResponseDto> {
    const existing = await this.regionRepository.findByCode(command.code);
    if (existing) {
      throw new ConflictException('Region code already exists');
    }
    const region = Region.create(command.name, command.code, command.description);
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

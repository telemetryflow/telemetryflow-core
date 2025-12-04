import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { DeleteRegionCommand } from '../commands/DeleteRegion.command';
import { IRegionRepository } from '../../domain/repositories/IRegionRepository';
import { RegionId } from '../../domain/value-objects/RegionId';

@CommandHandler(DeleteRegionCommand)
export class DeleteRegionHandler implements ICommandHandler<DeleteRegionCommand> {
  constructor(
    @Inject('IRegionRepository')
    private readonly regionRepository: IRegionRepository,
  ) {}
  async execute(command: DeleteRegionCommand): Promise<void> {
    const regionId = RegionId.create(command.id);
    const region = await this.regionRepository.findById(regionId);
    if (!region) {
      throw new NotFoundException('Region not found');
    }
    region.delete();
    await this.regionRepository.save(region);
  }
}

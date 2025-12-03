import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, ConflictException } from '@nestjs/common';
import { CreateWorkspaceCommand } from '../commands/CreateWorkspace.command';
import { IWorkspaceRepository } from '../../domain/repositories/IWorkspaceRepository';
import { Workspace } from '../../domain/aggregates/Workspace';
import { OrganizationId } from '../../domain/value-objects/OrganizationId';

@CommandHandler(CreateWorkspaceCommand)
export class CreateWorkspaceHandler implements ICommandHandler<CreateWorkspaceCommand> {
  constructor(
    @Inject('IWorkspaceRepository')
    private readonly workspaceRepository: IWorkspaceRepository,
  ) {}
  async execute(command: CreateWorkspaceCommand): Promise<string> {
    const existing = await this.workspaceRepository.findByCode(command.code);
    if (existing) {
      throw new ConflictException('Workspace code already exists');
    }
    const organizationId = OrganizationId.create(command.organizationId);
    const workspace = Workspace.create(
      command.name,
      command.code,
      organizationId,
      command.description,
      command.datasourceConfig,
    );
    await this.workspaceRepository.save(workspace);
    return workspace.id.getValue();
  }
}

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { UpdateWorkspaceCommand } from '../commands/UpdateWorkspace.command';
import { IWorkspaceRepository } from '../../domain/repositories/IWorkspaceRepository';
import { WorkspaceId } from '../../domain/value-objects/WorkspaceId';

@CommandHandler(UpdateWorkspaceCommand)
export class UpdateWorkspaceHandler implements ICommandHandler<UpdateWorkspaceCommand> {
  constructor(
    @Inject('IWorkspaceRepository')
    private readonly workspaceRepository: IWorkspaceRepository,
  ) {}
  async execute(command: UpdateWorkspaceCommand): Promise<void> {
    const id = WorkspaceId.create(command.id);
    const workspace = await this.workspaceRepository.findById(id);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }
    workspace.update(command.name, command.description, command.datasourceConfig);
    await this.workspaceRepository.save(workspace);
  }
}

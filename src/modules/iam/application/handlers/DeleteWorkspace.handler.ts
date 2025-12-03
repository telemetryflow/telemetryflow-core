import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { DeleteWorkspaceCommand } from '../commands/DeleteWorkspace.command';
import { IWorkspaceRepository } from '../../domain/repositories/IWorkspaceRepository';
import { WorkspaceId } from '../../domain/value-objects/WorkspaceId';

@CommandHandler(DeleteWorkspaceCommand)
export class DeleteWorkspaceHandler implements ICommandHandler<DeleteWorkspaceCommand> {
  constructor(
    @Inject('IWorkspaceRepository')
    private readonly workspaceRepository: IWorkspaceRepository,
  ) {}
  async execute(command: DeleteWorkspaceCommand): Promise<void> {
    const id = WorkspaceId.create(command.id);
    const workspace = await this.workspaceRepository.findById(id);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }
    workspace.delete();
    await this.workspaceRepository.delete(id);
  }
}

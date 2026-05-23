import { CommandHandler, ICommandHandler, EventBus } from "@nestjs/cqrs";
import {
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { DeleteApiKeyCommand } from "../commands";
import { API_KEY_REPOSITORY, IApiKeyRepository } from "../../domain";
import { ApiKeyDeletedEvent } from "../../domain/events";

@CommandHandler(DeleteApiKeyCommand)
export class DeleteApiKeyHandler implements ICommandHandler<DeleteApiKeyCommand> {
  constructor(
    @Inject(API_KEY_REPOSITORY)
    private readonly apiKeyRepository: IApiKeyRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: DeleteApiKeyCommand): Promise<void> {
    const apiKey = await this.apiKeyRepository.findById(command.id);

    if (!apiKey) {
      throw new NotFoundException(`API key not found`);
    }

    if (apiKey.getOrganizationId() !== command.organizationId) {
      throw new ForbiddenException("Access denied");
    }

    if (apiKey.getIsSystem()) {
      throw new BadRequestException("System API keys cannot be deleted");
    }

    await this.apiKeyRepository.delete(command.id);

    this.eventBus.publish(
      new ApiKeyDeletedEvent({
        apiKeyId: apiKey.getApiKeyId() ?? apiKey.getId().toString(),
        name: apiKey.getName(),
        organizationId: apiKey.getOrganizationId(),
        deletedBy: command.deletedBy,
      }),
    );
  }
}

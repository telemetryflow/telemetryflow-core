import { CommandHandler, ICommandHandler, EventBus } from "@nestjs/cqrs";
import { Inject, NotFoundException, ForbiddenException } from "@nestjs/common";
import { AcknowledgeAlertCommand } from "../commands";
import { AlertInstanceResponseDto } from "../dto";
import {
  ALERT_INSTANCE_REPOSITORY,
  IAlertInstanceRepository,
} from "../../domain";

@CommandHandler(AcknowledgeAlertCommand)
export class AcknowledgeAlertHandler implements ICommandHandler<AcknowledgeAlertCommand> {
  constructor(
    @Inject(ALERT_INSTANCE_REPOSITORY)
    private readonly alertInstanceRepository: IAlertInstanceRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    command: AcknowledgeAlertCommand,
  ): Promise<AlertInstanceResponseDto> {
    const alertInstance = await this.alertInstanceRepository.findById(
      command.alertInstanceId,
    );

    if (!alertInstance) {
      throw new NotFoundException("Alert instance not found");
    }

    if (alertInstance.getOrganizationId() !== command.organizationId) {
      throw new ForbiddenException("Access denied");
    }

    alertInstance.acknowledge(command.userId, command.comment);
    await this.alertInstanceRepository.save(alertInstance);

    // Publish domain events
    for (const event of alertInstance.domainEvents) {
      this.eventBus.publish(event);
    }
    alertInstance.clearEvents();

    return AlertInstanceResponseDto.fromDomain(alertInstance);
  }
}

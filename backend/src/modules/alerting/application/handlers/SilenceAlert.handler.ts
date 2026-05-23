import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject, NotFoundException, ForbiddenException } from "@nestjs/common";
import { SilenceAlertCommand } from "../commands";
import { AlertInstanceResponseDto } from "../dto";
import {
  ALERT_INSTANCE_REPOSITORY,
  IAlertInstanceRepository,
} from "../../domain";

@CommandHandler(SilenceAlertCommand)
export class SilenceAlertHandler implements ICommandHandler<SilenceAlertCommand> {
  constructor(
    @Inject(ALERT_INSTANCE_REPOSITORY)
    private readonly alertInstanceRepository: IAlertInstanceRepository,
  ) {}

  async execute(
    command: SilenceAlertCommand,
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

    alertInstance.silence(command.silenceUntil);
    await this.alertInstanceRepository.save(alertInstance);

    return AlertInstanceResponseDto.fromDomain(alertInstance);
  }
}

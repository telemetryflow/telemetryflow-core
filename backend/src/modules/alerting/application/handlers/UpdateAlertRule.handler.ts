import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import {
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { UpdateAlertRuleCommand } from "../commands";
import { AlertRuleResponseDto } from "../dto";
import { ALERT_RULE_REPOSITORY, IAlertRuleRepository } from "../../domain";

@CommandHandler(UpdateAlertRuleCommand)
export class UpdateAlertRuleHandler implements ICommandHandler<UpdateAlertRuleCommand> {
  constructor(
    @Inject(ALERT_RULE_REPOSITORY)
    private readonly alertRuleRepository: IAlertRuleRepository,
  ) {}

  async execute(
    command: UpdateAlertRuleCommand,
  ): Promise<AlertRuleResponseDto> {
    const alertRule = await this.alertRuleRepository.findById(command.id);

    if (!alertRule) {
      throw new NotFoundException("Alert rule not found");
    }

    if (alertRule.getOrganizationId() !== command.organizationId) {
      throw new ForbiddenException("Access denied");
    }

    // Check for duplicate name if name is being changed
    if (command.name && command.name !== alertRule.getName()) {
      const exists = await this.alertRuleRepository.existsByName(
        command.organizationId,
        command.name,
        command.id,
      );

      if (exists) {
        throw new BadRequestException(
          `Alert rule with name '${command.name}' already exists`,
        );
      }
    }

    alertRule.update({
      name: command.name,
      description: command.description,
      severity: command.severity,
      conditions: command.conditions,
      notificationChannels: command.notificationChannels,
      labels: command.labels,
      annotations: command.annotations,
      evaluationInterval: command.evaluationInterval,
      forDuration: command.forDuration,
      muteTimings: command.muteTimings,
    });

    await this.alertRuleRepository.save(alertRule);

    return AlertRuleResponseDto.fromDomain(alertRule);
  }
}

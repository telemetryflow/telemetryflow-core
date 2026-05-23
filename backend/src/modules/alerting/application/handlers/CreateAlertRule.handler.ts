import { CommandHandler, ICommandHandler, EventBus } from "@nestjs/cqrs";
import { Inject, BadRequestException } from "@nestjs/common";
import { CreateAlertRuleCommand } from "../commands";
import { AlertRuleResponseDto } from "../dto";
import {
  AlertRule,
  ALERT_RULE_REPOSITORY,
  IAlertRuleRepository,
} from "../../domain";

@CommandHandler(CreateAlertRuleCommand)
export class CreateAlertRuleHandler implements ICommandHandler<CreateAlertRuleCommand> {
  constructor(
    @Inject(ALERT_RULE_REPOSITORY)
    private readonly alertRuleRepository: IAlertRuleRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    command: CreateAlertRuleCommand,
  ): Promise<AlertRuleResponseDto> {
    // Check for duplicate name
    const exists = await this.alertRuleRepository.existsByName(
      command.organizationId,
      command.name,
    );

    if (exists) {
      throw new BadRequestException(
        `Alert rule with name '${command.name}' already exists`,
      );
    }

    // Validate conditions
    if (!command.conditions || command.conditions.length === 0) {
      throw new BadRequestException("At least one condition is required");
    }

    // Create alert rule
    const alertRule = AlertRule.create({
      organizationId: command.organizationId,
      name: command.name,
      createdBy: command.createdBy,
      description: command.description,
      severity: command.severity,
      conditions: command.conditions,
      notificationChannels: command.notificationChannels,
      labels: command.labels,
      annotations: command.annotations,
      evaluationInterval: command.evaluationInterval,
      forDuration: command.forDuration,
      workspaceId: command.workspaceId,
      muteTimings: command.muteTimings,
      queryLanguage: command.queryLanguage,
      queryString: command.queryString,
      queryTarget: command.queryTarget,
      sourceType: command.sourceType,
    });

    await this.alertRuleRepository.save(alertRule);

    // Publish domain events
    for (const event of alertRule.domainEvents) {
      this.eventBus.publish(event);
    }
    alertRule.clearEvents();

    return AlertRuleResponseDto.fromDomain(alertRule);
  }
}

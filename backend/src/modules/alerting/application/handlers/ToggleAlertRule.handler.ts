import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject, NotFoundException, ForbiddenException } from "@nestjs/common";
import { EnableAlertRuleCommand, DisableAlertRuleCommand } from "../commands";
import { AlertRuleResponseDto } from "../dto";
import {
  ALERT_RULE_REPOSITORY,
  IAlertRuleRepository,
  ALERT_INSTANCE_REPOSITORY,
  IAlertInstanceRepository,
} from "../../domain";

@CommandHandler(EnableAlertRuleCommand)
export class EnableAlertRuleHandler implements ICommandHandler<EnableAlertRuleCommand> {
  constructor(
    @Inject(ALERT_RULE_REPOSITORY)
    private readonly alertRuleRepository: IAlertRuleRepository,
  ) {}

  async execute(
    command: EnableAlertRuleCommand,
  ): Promise<AlertRuleResponseDto> {
    const alertRule = await this.alertRuleRepository.findById(command.id);

    if (!alertRule) {
      throw new NotFoundException("Alert rule not found");
    }

    if (alertRule.getOrganizationId() !== command.organizationId) {
      throw new ForbiddenException("Access denied");
    }

    alertRule.enable();
    await this.alertRuleRepository.save(alertRule);

    return AlertRuleResponseDto.fromDomain(alertRule);
  }
}

@CommandHandler(DisableAlertRuleCommand)
export class DisableAlertRuleHandler implements ICommandHandler<DisableAlertRuleCommand> {
  constructor(
    @Inject(ALERT_RULE_REPOSITORY)
    private readonly alertRuleRepository: IAlertRuleRepository,
    @Inject(ALERT_INSTANCE_REPOSITORY)
    private readonly alertInstanceRepository: IAlertInstanceRepository,
  ) {}

  async execute(
    command: DisableAlertRuleCommand,
  ): Promise<AlertRuleResponseDto> {
    const alertRule = await this.alertRuleRepository.findById(command.id);

    if (!alertRule) {
      throw new NotFoundException("Alert rule not found");
    }

    if (alertRule.getOrganizationId() !== command.organizationId) {
      throw new ForbiddenException("Access denied");
    }

    alertRule.disable();
    await this.alertRuleRepository.save(alertRule);

    // Auto-resolve active alerts for this rule
    const activeAlerts =
      await this.alertInstanceRepository.findActiveByAlertRule(command.id);
    for (const alert of activeAlerts) {
      alert.resolve("auto", undefined, "Alert rule disabled");
      await this.alertInstanceRepository.save(alert);
    }

    return AlertRuleResponseDto.fromDomain(alertRule);
  }
}

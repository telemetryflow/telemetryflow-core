import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject, NotFoundException, ForbiddenException } from "@nestjs/common";
import { DeleteAlertRuleCommand } from "../commands";
import {
  ALERT_RULE_REPOSITORY,
  IAlertRuleRepository,
  ALERT_INSTANCE_REPOSITORY,
  IAlertInstanceRepository,
} from "../../domain";

@CommandHandler(DeleteAlertRuleCommand)
export class DeleteAlertRuleHandler implements ICommandHandler<DeleteAlertRuleCommand> {
  constructor(
    @Inject(ALERT_RULE_REPOSITORY)
    private readonly alertRuleRepository: IAlertRuleRepository,
    @Inject(ALERT_INSTANCE_REPOSITORY)
    private readonly alertInstanceRepository: IAlertInstanceRepository,
  ) {}

  async execute(command: DeleteAlertRuleCommand): Promise<void> {
    const alertRule = await this.alertRuleRepository.findById(command.id);

    if (!alertRule) {
      throw new NotFoundException("Alert rule not found");
    }

    if (alertRule.getOrganizationId() !== command.organizationId) {
      throw new ForbiddenException("Access denied");
    }

    // Resolve all active alerts for this rule
    const activeAlerts =
      await this.alertInstanceRepository.findActiveByAlertRule(command.id);
    for (const alert of activeAlerts) {
      alert.resolve("auto", undefined, "Alert rule deleted");
      await this.alertInstanceRepository.save(alert);
    }

    await this.alertRuleRepository.delete(command.id);
  }
}

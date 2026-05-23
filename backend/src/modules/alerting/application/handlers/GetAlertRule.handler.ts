import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Inject, NotFoundException, ForbiddenException } from "@nestjs/common";
import { GetAlertRuleQuery } from "../queries";
import { AlertRuleResponseDto } from "../dto";
import { ALERT_RULE_REPOSITORY, IAlertRuleRepository } from "../../domain";

@QueryHandler(GetAlertRuleQuery)
export class GetAlertRuleHandler implements IQueryHandler<GetAlertRuleQuery> {
  constructor(
    @Inject(ALERT_RULE_REPOSITORY)
    private readonly alertRuleRepository: IAlertRuleRepository,
  ) {}

  async execute(query: GetAlertRuleQuery): Promise<AlertRuleResponseDto> {
    const alertRule = await this.alertRuleRepository.findById(query.id);

    if (!alertRule) {
      throw new NotFoundException("Alert rule not found");
    }

    if (alertRule.getOrganizationId() !== query.organizationId) {
      throw new ForbiddenException("Access denied");
    }

    return AlertRuleResponseDto.fromDomain(alertRule);
  }
}

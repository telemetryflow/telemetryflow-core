import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { GetAlertStatsQuery } from "../queries";
import { AlertStatsResponseDto } from "../dto";
import {
  ALERT_INSTANCE_REPOSITORY,
  IAlertInstanceRepository,
  AlertInstanceStatus,
} from "../../domain";

@QueryHandler(GetAlertStatsQuery)
export class GetAlertStatsHandler implements IQueryHandler<GetAlertStatsQuery> {
  constructor(
    @Inject(ALERT_INSTANCE_REPOSITORY)
    private readonly alertInstanceRepository: IAlertInstanceRepository,
  ) {}

  async execute(query: GetAlertStatsQuery): Promise<AlertStatsResponseDto> {
    // Get counts by status
    const statusCounts = await this.alertInstanceRepository.countByStatus(
      query.organizationId,
    );

    // Calculate totals
    const firing = statusCounts[AlertInstanceStatus.FIRING] || 0;
    const acknowledged = statusCounts[AlertInstanceStatus.ACKNOWLEDGED] || 0;
    const resolved = statusCounts[AlertInstanceStatus.RESOLVED] || 0;
    const silenced = statusCounts[AlertInstanceStatus.SILENCED] || 0;
    const total = firing + acknowledged + resolved + silenced;

    // Get active alerts to count by severity
    const activeAlerts =
      await this.alertInstanceRepository.findActiveByOrganization(
        query.organizationId,
      );

    const severityCounts = {
      critical: 0,
      warning: 0,
      info: 0,
    };

    for (const alert of activeAlerts) {
      const severity = alert.getSeverity();
      if (severity === "critical") {
        severityCounts.critical++;
      } else if (severity === "warning") {
        severityCounts.warning++;
      } else {
        severityCounts.info++;
      }
    }

    const response = new AlertStatsResponseDto();
    response.total = total;
    response.firing = firing;
    response.acknowledged = acknowledged;
    response.resolved = resolved;
    response.silenced = silenced;
    response.bySeverity = severityCounts;

    return response;
  }
}

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { AlertInstanceEntity } from "../entities/AlertInstance.entity";
import {
  AlertInstance,
  AlertInstanceStatus,
  AlertSeverity,
  IAlertInstanceRepository,
  FindAlertInstancesOptions,
} from "../../domain";

@Injectable()
export class AlertInstanceRepository implements IAlertInstanceRepository {
  constructor(
    @InjectRepository(AlertInstanceEntity)
    private readonly repository: Repository<AlertInstanceEntity>,
  ) {}

  async findById(id: string): Promise<AlertInstance | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByFingerprint(fingerprint: string): Promise<AlertInstance | null> {
    const entity = await this.repository.findOne({
      where: { fingerprint, status: In(["firing", "acknowledged"]) },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findActiveByAlertRule(alertRuleId: string): Promise<AlertInstance[]> {
    const entities = await this.repository.find({
      where: {
        alertRuleId,
        status: In(["firing", "acknowledged"]),
      },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findByOrganization(
    organizationId: string,
    options: FindAlertInstancesOptions = {},
  ): Promise<{ items: AlertInstance[]; total: number }> {
    const {
      page = 1,
      pageSize = 20,
      status,
      severity,
      alertRuleId,
      startDate,
      endDate,
    } = options;

    const queryBuilder = this.repository
      .createQueryBuilder("instance")
      .where("instance.organization_id = :organizationId", { organizationId });

    if (status) {
      if (Array.isArray(status)) {
        queryBuilder.andWhere("instance.status IN (:...statuses)", {
          statuses: status,
        });
      } else {
        queryBuilder.andWhere("instance.status = :status", { status });
      }
    }

    if (severity) {
      queryBuilder.andWhere("instance.severity = :severity", { severity });
    }

    if (alertRuleId) {
      queryBuilder.andWhere("instance.alert_rule_id = :alertRuleId", {
        alertRuleId,
      });
    }

    if (startDate) {
      queryBuilder.andWhere("instance.starts_at >= :startDate", { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere("instance.starts_at <= :endDate", { endDate });
    }

    const [entities, total] = await queryBuilder
      .orderBy("instance.starts_at", "DESC")
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: entities.map((entity) => this.toDomain(entity)),
      total,
    };
  }

  async findActiveByOrganization(
    organizationId: string,
  ): Promise<AlertInstance[]> {
    const entities = await this.repository.find({
      where: {
        organizationId,
        status: In(["firing", "acknowledged"]),
      },
      order: { startsAt: "DESC" },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findByOrganizationAndDateRange(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AlertInstance[]> {
    const entities = await this.repository
      .createQueryBuilder("instance")
      .where("instance.organization_id = :organizationId", { organizationId })
      .andWhere("instance.starts_at >= :startDate", { startDate })
      .andWhere("instance.starts_at <= :endDate", { endDate })
      .orderBy("instance.starts_at", "DESC")
      .getMany();

    return entities.map((entity) => this.toDomain(entity));
  }

  async save(alertInstance: AlertInstance): Promise<void> {
    const entity = this.toEntity(alertInstance);
    await this.repository.save(entity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async countByStatus(
    organizationId: string,
  ): Promise<Record<AlertInstanceStatus, number>> {
    const result = await this.repository
      .createQueryBuilder("instance")
      .select("instance.status", "status")
      .addSelect("COUNT(*)", "count")
      .where("instance.organization_id = :organizationId", { organizationId })
      .groupBy("instance.status")
      .getRawMany();

    const counts: Record<AlertInstanceStatus, number> = {
      [AlertInstanceStatus.FIRING]: 0,
      [AlertInstanceStatus.ACKNOWLEDGED]: 0,
      [AlertInstanceStatus.RESOLVED]: 0,
      [AlertInstanceStatus.SILENCED]: 0,
    };

    for (const row of result) {
      counts[row.status as AlertInstanceStatus] = parseInt(row.count, 10);
    }

    return counts;
  }

  private toDomain(entity: AlertInstanceEntity): AlertInstance {
    return AlertInstance.reconstitute({
      id: entity.id,
      alertRuleId: entity.alertRuleId,
      organizationId: entity.organizationId,
      workspaceId: entity.workspaceId ?? undefined,
      status: entity.status as AlertInstanceStatus,
      severity: entity.severity as AlertSeverity,
      title: entity.title,
      description: entity.description,
      currentValue: entity.currentValue,
      threshold: entity.threshold,
      labels: entity.labels,
      annotations: entity.annotations,
      startsAt: entity.startsAt,
      endsAt: entity.endsAt ?? undefined,
      acknowledgedAt: entity.acknowledgedAt ?? undefined,
      acknowledgedBy: entity.acknowledgedBy ?? undefined,
      acknowledgeComment: entity.acknowledgeComment ?? undefined,
      resolvedAt: entity.resolvedAt ?? undefined,
      resolvedBy: entity.resolvedBy ?? undefined,
      resolution: entity.resolution ?? undefined,
      notificationsSent: entity.notificationsSent,
      fingerprint: entity.fingerprint,
      silencedUntil: entity.silencedUntil ?? undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private toEntity(instance: AlertInstance): AlertInstanceEntity {
    const entity = new AlertInstanceEntity();
    entity.id = instance.getId();
    entity.alertRuleId = instance.getAlertRuleId();
    entity.organizationId = instance.getOrganizationId();
    entity.workspaceId = instance.getWorkspaceId() ?? null;
    entity.status = instance.getStatus();
    entity.severity = instance.getSeverity();
    entity.title = instance.getTitle();
    entity.description = instance.getDescription();
    entity.currentValue = instance.getCurrentValue();
    entity.threshold = instance.getThreshold();
    entity.labels = instance.getLabels();
    entity.annotations = instance.getAnnotations();
    entity.startsAt = instance.getStartsAt();
    entity.endsAt = instance.getEndsAt() ?? null;
    entity.acknowledgedAt = instance.getAcknowledgedAt() ?? null;
    entity.acknowledgedBy = instance.getAcknowledgedBy() ?? null;
    entity.acknowledgeComment = instance.getAcknowledgeComment() ?? null;
    entity.resolvedAt = instance.getResolvedAt() ?? null;
    entity.resolvedBy = instance.getResolvedBy() ?? null;
    entity.resolution = instance.getResolution() ?? null;
    entity.notificationsSent = instance.getNotificationsSent();
    entity.fingerprint = instance.getFingerprint();
    entity.silencedUntil = instance.getSilencedUntil() ?? null;
    entity.createdAt = instance.getCreatedAt();
    entity.updatedAt = instance.getUpdatedAt();
    return entity;
  }
}

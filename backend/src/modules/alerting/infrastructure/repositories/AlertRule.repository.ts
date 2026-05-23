import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AlertRuleEntity } from "../entities/AlertRule.entity";
import {
  AlertRule,
  AlertRuleState,
  AlertRuleId,
  AlertSeverity,
  AlertConditionProps,
  NotificationChannelRef,
  IAlertRuleRepository,
  FindAlertRulesOptions,
} from "../../domain";

@Injectable()
export class AlertRuleRepository implements IAlertRuleRepository {
  constructor(
    @InjectRepository(AlertRuleEntity)
    private readonly repository: Repository<AlertRuleEntity>,
  ) {}

  async findById(id: string): Promise<AlertRule | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByOrganization(
    organizationId: string,
    options: FindAlertRulesOptions = {},
  ): Promise<{ items: AlertRule[]; total: number }> {
    const {
      page = 1,
      pageSize = 20,
      enabled,
      severity,
      state,
      search,
      graphId,
    } = options;

    const queryBuilder = this.repository
      .createQueryBuilder("rule")
      .where("rule.organization_id = :organizationId", { organizationId });

    if (enabled !== undefined) {
      queryBuilder.andWhere("rule.enabled = :enabled", { enabled });
    }

    if (severity) {
      queryBuilder.andWhere("rule.severity = :severity", { severity });
    }

    if (state) {
      queryBuilder.andWhere("rule.state = :state", { state });
    }

    if (search) {
      queryBuilder.andWhere(
        "(rule.name ILIKE :search OR rule.description ILIKE :search)",
        { search: `%${search}%` },
      );
    }

    if (graphId) {
      queryBuilder.andWhere("rule.labels->>'graphId' = :graphId", { graphId });
    }

    const [entities, total] = await queryBuilder
      .orderBy("rule.created_at", "DESC")
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: entities.map((entity) => this.toDomain(entity)),
      total,
    };
  }

  async findEnabledByOrganization(
    organizationId: string,
  ): Promise<AlertRule[]> {
    const entities = await this.repository.find({
      where: { organizationId, enabled: true },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findByWorkspace(workspaceId: string): Promise<AlertRule[]> {
    const entities = await this.repository.find({
      where: { workspaceId },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async save(alertRule: AlertRule): Promise<void> {
    const entity = this.toEntity(alertRule);
    await this.repository.save(entity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findOrganizationsWithEnabledRules(): Promise<string[]> {
    const result = await this.repository
      .createQueryBuilder("rule")
      .select("DISTINCT rule.organization_id", "organizationId")
      .where("rule.enabled = :enabled", { enabled: true })
      .getRawMany();

    return result.map((row) => row.organizationId);
  }

  async existsByName(
    organizationId: string,
    name: string,
    excludeId?: string,
  ): Promise<boolean> {
    const queryBuilder = this.repository
      .createQueryBuilder("rule")
      .where("rule.organization_id = :organizationId", { organizationId })
      .andWhere("rule.name = :name", { name });

    if (excludeId) {
      queryBuilder.andWhere("rule.id != :excludeId", { excludeId });
    }

    const count = await queryBuilder.getCount();
    return count > 0;
  }

  private toDomain(entity: AlertRuleEntity): AlertRule {
    return AlertRule.reconstitute({
      id: AlertRuleId.fromString(entity.id),
      organizationId: entity.organizationId,
      workspaceId: entity.workspaceId ?? undefined,
      name: entity.name,
      description: entity.description ?? undefined,
      severity: entity.severity as AlertSeverity,
      conditions: entity.conditions as AlertConditionProps[],
      notificationChannels:
        entity.notificationChannels as NotificationChannelRef[],
      labels: entity.labels,
      annotations: entity.annotations,
      enabled: entity.enabled,
      state: entity.state as AlertRuleState,
      evaluationInterval: entity.evaluationInterval,
      forDuration: entity.forDuration,
      muteTimings: entity.muteTimings ?? undefined,
      lastEvaluatedAt: entity.lastEvaluatedAt ?? undefined,
      lastTriggeredAt: entity.lastTriggeredAt ?? undefined,
      createdBy: entity.createdBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      queryLanguage: entity.queryLanguage ?? undefined,
      queryString: entity.queryString ?? undefined,
      queryTarget: entity.queryTarget ?? undefined,
      sourceType: entity.sourceType ?? undefined,
    });
  }

  private toEntity(alertRule: AlertRule): AlertRuleEntity {
    const entity = new AlertRuleEntity();
    entity.id = alertRule.getId();
    entity.organizationId = alertRule.getOrganizationId();
    entity.workspaceId = alertRule.getWorkspaceId() ?? null;
    entity.name = alertRule.getName();
    entity.description = alertRule.getDescription() ?? null;
    entity.severity = alertRule.getSeverity();
    entity.conditions = alertRule.getConditions();
    entity.notificationChannels = alertRule.getNotificationChannels();
    entity.labels = alertRule.getLabels();
    entity.annotations = alertRule.getAnnotations();
    entity.enabled = alertRule.isEnabled();
    entity.state = alertRule.getState();
    entity.evaluationInterval = alertRule.getEvaluationInterval();
    entity.forDuration = alertRule.getForDuration();
    entity.muteTimings = alertRule.getMuteTimings() ?? null;
    entity.lastEvaluatedAt = alertRule.getLastEvaluatedAt() ?? null;
    entity.lastTriggeredAt = alertRule.getLastTriggeredAt() ?? null;
    entity.createdBy = alertRule.getCreatedBy();
    entity.createdAt = alertRule.getCreatedAt();
    entity.updatedAt = alertRule.getUpdatedAt();
    entity.queryLanguage = alertRule.getQueryLanguage() ?? "condition";
    entity.queryString = alertRule.getQueryString() ?? null;
    entity.queryTarget = alertRule.getQueryTarget() ?? null;
    entity.sourceType = alertRule.getSourceType() ?? "prometheus";
    return entity;
  }
}

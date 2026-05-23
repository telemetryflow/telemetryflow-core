import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotificationChannelEntity } from "../../infrastructure/entities";
import { UrlValidator } from "@/shared/security";
import {
  INotificationSender,
  NOTIFICATION_SENDER,
  AlertNotification,
  ReportNotification,
} from "../../infrastructure/services";

export interface CreateNotificationChannelParams {
  organizationId: string;
  name: string;
  type: string;
  config: Record<string, unknown>;
  description?: string;
  sendResolved?: boolean;
  sendReminder?: boolean;
  reminderInterval?: string;
}

export interface UpdateNotificationChannelParams {
  name?: string;
  description?: string;
  config?: Record<string, unknown>;
  enabled?: boolean;
  sendResolved?: boolean;
  sendReminder?: boolean;
  reminderInterval?: string;
}

@Injectable()
export class NotificationChannelService {
  private readonly logger = new Logger(NotificationChannelService.name);

  constructor(
    @InjectRepository(NotificationChannelEntity)
    private readonly channelRepository: Repository<NotificationChannelEntity>,
    @Inject(NOTIFICATION_SENDER)
    private readonly notificationSender: INotificationSender,
  ) {}

  async create(
    params: CreateNotificationChannelParams,
  ): Promise<NotificationChannelEntity> {
    if (params.config?.webhookUrl) {
      await UrlValidator.validateWebhookUrl(params.config.webhookUrl as string);
    }

    // Check for duplicate name
    const existing = await this.channelRepository.findOne({
      where: {
        organizationId: params.organizationId,
        name: params.name,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Notification channel with name "${params.name}" already exists`,
      );
    }

    const channel = this.channelRepository.create({
      organizationId: params.organizationId,
      name: params.name,
      type: params.type,
      config: params.config,
      description: params.description,
      enabled: true,
      sendResolved: params.sendResolved ?? true,
      sendReminder: params.sendReminder ?? false,
      reminderInterval: params.reminderInterval,
    });

    return this.channelRepository.save(channel);
  }

  async findById(
    id: string,
    organizationId: string,
  ): Promise<NotificationChannelEntity> {
    const channel = await this.channelRepository.findOne({
      where: { id, organizationId },
    });

    if (!channel) {
      throw new NotFoundException(`Notification channel not found: ${id}`);
    }

    return this.maskChannel(channel);
  }

  private maskSensitiveFields(config: Record<string, unknown>): Record<string, unknown> {
    const masked = { ...config };
    const SENSITIVE_KEYS = ["smtpPassword", "authToken", "apiKey", "secret"];
    for (const key of SENSITIVE_KEYS) {
      const val = masked[key];
      if (typeof val === "string" && val.length > 3) {
        masked[key] = val[0] + "*****" + val.slice(-2);
      } else if (typeof val === "string" && val.length > 0) {
        masked[key] = "*****";
      }
    }
    if (typeof masked.webhookUrl === "string") {
      try {
        const url = new URL(masked.webhookUrl as string);
        const pathParts = url.pathname.split("/");
        if (pathParts.length > 1) {
          const lastSegment = pathParts[pathParts.length - 1];
          if (lastSegment.length > 3) {
            pathParts[pathParts.length - 1] = lastSegment[0] + "*****" + lastSegment.slice(-2);
          } else if (lastSegment.length > 0) {
            pathParts[pathParts.length - 1] = "*****";
          }
          url.pathname = pathParts.join("/");
          masked.webhookUrl = url.toString();
        }
      } catch {
        // If URL parsing fails, mask the whole value
        masked.webhookUrl = "*****";
      }
    }
    return masked;
  }

  private maskChannel(channel: NotificationChannelEntity): NotificationChannelEntity {
    if (channel.config && typeof channel.config === "object") {
      channel.config = this.maskSensitiveFields(channel.config as Record<string, unknown>);
    }
    return channel;
  }

  async findByOrganization(
    organizationId: string,
    options?: { enabled?: boolean; type?: string },
  ): Promise<NotificationChannelEntity[]> {
    const query = this.channelRepository
      .createQueryBuilder("channel")
      .where("channel.organization_id = :organizationId", { organizationId });

    if (options?.enabled !== undefined) {
      query.andWhere("channel.enabled = :enabled", {
        enabled: options.enabled,
      });
    }

    if (options?.type) {
      query.andWhere("channel.type = :type", { type: options.type });
    }

    const channels = await query.orderBy("channel.name", "ASC").getMany();
    return channels.map((ch) => this.maskChannel(ch));
  }

  async update(
    id: string,
    organizationId: string,
    params: UpdateNotificationChannelParams,
  ): Promise<NotificationChannelEntity> {
    const channel = await this.findById(id, organizationId);

    if (params.config?.webhookUrl) {
      await UrlValidator.validateWebhookUrl(params.config.webhookUrl as string);
    }

    if (params.name && params.name !== channel.name) {
      const existing = await this.channelRepository.findOne({
        where: {
          organizationId,
          name: params.name,
        },
      });

      if (existing) {
        throw new ConflictException(
          `Notification channel with name "${params.name}" already exists`,
        );
      }
    }

    Object.assign(channel, {
      ...params,
      updatedAt: new Date(),
    });

    return this.channelRepository.save(channel);
  }

  async delete(id: string, organizationId: string): Promise<void> {
    const channel = await this.findById(id, organizationId);
    await this.channelRepository.remove(channel);
  }

  async enable(
    id: string,
    organizationId: string,
  ): Promise<NotificationChannelEntity> {
    return this.update(id, organizationId, { enabled: true });
  }

  async disable(
    id: string,
    organizationId: string,
  ): Promise<NotificationChannelEntity> {
    return this.update(id, organizationId, { enabled: false });
  }

  async testChannel(
    id: string,
    organizationId: string,
  ): Promise<{ success: boolean; error?: string }> {
    const channel = await this.findById(id, organizationId);

    const testNotification: AlertNotification = {
      alertInstanceId: "test-alert-id",
      alertRuleId: "test-rule-id",
      alertRuleName: "Test Alert Rule",
      severity: "info",
      status: "firing",
      title: "Test Alert - Notification Channel Test",
      description:
        "This is a test notification to verify your notification channel configuration.",
      currentValue: 100,
      threshold: 80,
      labels: { test: "true" },
      annotations: { message: "This is a test notification" },
      startsAt: new Date(),
      organizationId,
      fingerprint: "test-fingerprint",
    };

    const result = await this.notificationSender.send(
      channel.type,
      { [channel.type]: channel.config },
      testNotification,
    );

    // Update last used and error info
    await this.channelRepository.update(id, {
      lastUsedAt: new Date(),
      lastError: result.success ? null : result.error,
      errorCount: result.success ? 0 : (channel.errorCount || 0) + 1,
    });

    return {
      success: result.success,
      error: result.error,
    };
  }

  async getDefaults(organizationId: string): Promise<NotificationChannelEntity[]> {
    const channels = await this.channelRepository.find({
      where: { organizationId, isDefault: true },
      order: { name: "ASC" },
    });
    return channels.map((ch) => this.maskChannel(ch));
  }

  async setDefaults(organizationId: string, channelIds: string[]): Promise<void> {
    // Clear all existing defaults for this org
    await this.channelRepository.update(
      { organizationId },
      { isDefault: false },
    );

    // Set the new defaults
    if (channelIds.length > 0) {
      await this.channelRepository
        .createQueryBuilder()
        .update()
        .set({ isDefault: true })
        .where("organization_id = :organizationId", { organizationId })
        .andWhere("id IN (:...ids)", { ids: channelIds })
        .execute();
    }
  }

  async getChannelsByGroup(groupId: string): Promise<NotificationChannelEntity[]> {
    // Legacy method: In the current design, groupId is actually a channel ID
    // Return the channel if it exists and is enabled
    try {
      const channel = await this.channelRepository.findOne({
        where: { id: groupId, enabled: true },
      });
      return channel ? [channel] : [];
    } catch (error) {
      this.logger.warn(`Failed to fetch channel ${groupId}: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  async sendAlertNotification(
    notification: AlertNotification,
    channelIds: string[],
  ): Promise<Array<{ channelId: string; success: boolean; error?: string }>> {
    if (channelIds.length === 0) {
      return [];
    }

    const channels = await this.channelRepository
      .createQueryBuilder("channel")
      .where("channel.id IN (:...ids)", { ids: channelIds })
      .andWhere("channel.enabled = :enabled", { enabled: true })
      .getMany();

    if (channels.length === 0) {
      this.logger.warn(
        `No enabled notification channels found for IDs: ${channelIds.join(", ")}`,
      );
      return [];
    }

    const channelsToSend = channels.map((ch) => ({
      type: ch.type,
      config: { [ch.type]: ch.config },
      id: ch.id,
    }));

    const results = await this.notificationSender.sendToMultipleChannels(
      channelsToSend,
      notification,
    );

    // Update channel stats
    for (const result of results) {
      const channel = channels.find((c) => c.id === result.channelId);
      if (channel) {
        await this.channelRepository.update(channel.id, {
          lastUsedAt: new Date(),
          lastError: result.success ? null : result.error,
          errorCount: result.success ? 0 : (channel.errorCount || 0) + 1,
        });
      }
    }

    return results.map((r) => ({
      channelId: r.channelId,
      success: r.success,
      error: r.error,
    }));
  }

  async sendReportNotification(
    report: ReportNotification,
    channelIds: string[],
  ): Promise<Array<{ channelId: string; success: boolean; error?: string }>> {
    if (channelIds.length === 0) {
      return [];
    }

    const channels = await this.channelRepository
      .createQueryBuilder("channel")
      .where("channel.id IN (:...ids)", { ids: channelIds })
      .andWhere("channel.enabled = :enabled", { enabled: true })
      .getMany();

    if (channels.length === 0) {
      this.logger.warn(
        `No enabled notification channels found for report IDs: ${channelIds.join(", ")}`,
      );
      return [];
    }

    const channelsToSend = channels.map((ch) => ({
      type: ch.type,
      config: { [ch.type]: ch.config },
      id: ch.id,
    }));

    const results = await this.notificationSender.sendReportToMultipleChannels(
      channelsToSend,
      report,
    );

    for (const result of results) {
      const channel = channels.find((c) => c.id === result.channelId);
      if (channel) {
        await this.channelRepository.update(channel.id, {
          lastUsedAt: new Date(),
          lastError: result.success ? null : result.error,
          errorCount: result.success ? 0 : (channel.errorCount || 0) + 1,
        });
      }
    }

    return results.map((r) => ({
      channelId: r.channelId,
      success: r.success,
      error: r.error,
    }));
  }
}

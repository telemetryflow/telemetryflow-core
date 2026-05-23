import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  IsBoolean,
  MaxLength,
  IsArray,
  IsNumber,
  IsIn,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export enum NotificationChannelType {
  EMAIL = "email",
  SLACK = "slack",
  DISCORD = "discord",
  MSTEAMS = "msteams",
  ZOOM = "zoom",
  TELEGRAM = "telegram",
  WEBHOOK = "webhook",
  PAGERDUTY = "pagerduty",
  OPSGENIE = "opsgenie",
}

// Type-specific config DTOs for documentation
export class EmailChannelConfigDto {
  @ApiProperty({ description: "List of email recipients", example: ["alerts@telemetryflow.id"] })
  @IsArray()
  @IsString({ each: true })
  recipients: string[];

  @ApiPropertyOptional({ description: "CC recipients", example: ["cc@telemetryflow.id"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cc?: string[];

  @ApiPropertyOptional({ description: "BCC recipients", example: ["bcc@telemetryflow.id"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  bcc?: string[];

  @ApiPropertyOptional({
    description: "Email subject with optional placeholders: {alertName}, {severity}, {status}, {service}, {value}",
    example: "🚨 [{severity}] {alertName} is {status}",
  })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ description: "SMTP host server", example: "smtp.gmail.com" })
  @IsOptional()
  @IsString()
  smtpHost?: string;

  @ApiPropertyOptional({ description: "SMTP port (587 for STARTTLS, 465 for SSL)", example: 587 })
  @IsOptional()
  @IsNumber()
  smtpPort?: number;
}

export class SlackChannelConfigDto {
  @ApiProperty({ description: "Slack Webhook URL", example: "https://hooks.slack.com/services/..." })
  @IsString()
  webhookUrl: string;

  @ApiPropertyOptional({ description: "Slack channel", example: "#alerts" })
  @IsOptional()
  @IsString()
  channel?: string;
}

export class MSTeamsChannelConfigDto {
  @ApiProperty({ description: "MS Teams Webhook URL", example: "https://outlook.office.com/webhook/..." })
  @IsString()
  webhookUrl: string;

  @ApiPropertyOptional({ description: "Card title", example: "TelemetryFlow Alert" })
  @IsOptional()
  @IsString()
  title?: string;
}

export class ZoomChannelConfigDto {
  @ApiProperty({ description: "Zoom Webhook URL", example: "https://zoom.us/webhook/..." })
  @IsString()
  webhookUrl: string;

  @ApiPropertyOptional({ description: "Bot JID", example: "bot@xmpp.zoom.us" })
  @IsOptional()
  @IsString()
  botJid?: string;
}

export class TelegramChannelConfigDto {
  @ApiProperty({ description: "Telegram Bot Token", example: "123456789:ABCdefGHIjklMNOpqrsTUVwxyz" })
  @IsString()
  botToken: string;

  @ApiProperty({ description: "Telegram Chat ID", example: "-1001234567890" })
  @IsString()
  chatId: string;
}

export class WebhookChannelConfigDto {
  @ApiProperty({ description: "Webhook URL", example: "https://api.telemetryflow.id/webhook" })
  @IsString()
  url: string;

  @ApiPropertyOptional({ description: "HTTP method", enum: ["POST", "PUT"], default: "POST" })
  @IsOptional()
  @IsIn(["POST", "PUT"])
  method?: "POST" | "PUT";

  @ApiPropertyOptional({ description: "Auth type", enum: ["none", "basic", "bearer"], default: "none" })
  @IsOptional()
  @IsIn(["none", "basic", "bearer"])
  authType?: "none" | "basic" | "bearer";

  @ApiPropertyOptional({ description: "Bearer token" })
  @IsOptional()
  @IsString()
  authToken?: string;

  @ApiPropertyOptional({ description: "Custom headers as JSON", type: "object", additionalProperties: true })
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @ApiPropertyOptional({
    description: "Body template with placeholders: {{alertName}}, {{severity}}, {{message}}, {{status}}",
    example: '{"alert": "{{alertName}}", "severity": "{{severity}}", "message": "{{message}}"}',
  })
  @IsOptional()
  @IsString()
  bodyTemplate?: string;
}

export class CreateNotificationChannelRequestDto {
  @ApiProperty({
    description: "Name of the notification channel",
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: "Description of the notification channel",
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: "Type of notification channel",
    enum: NotificationChannelType,
    example: NotificationChannelType.SLACK,
  })
  @IsEnum(NotificationChannelType)
  type: NotificationChannelType;

  @ApiProperty({
    description: "Channel-specific configuration. Structure depends on channel type.",
    type: "object",
    additionalProperties: true,
    examples: {
      email: {
        value: { recipients: ["alerts@telemetryflow.id"], smtpHost: "smtp.gmail.com", smtpPort: 587 },
      },
      slack: {
        value: { webhookUrl: "https://hooks.slack.com/services/...", channel: "#alerts" },
      },
      msteams: {
        value: { webhookUrl: "https://outlook.office.com/webhook/...", title: "TelemetryFlow Alert" },
      },
      zoom: {
        value: { webhookUrl: "https://zoom.us/webhook/...", botJid: "bot@xmpp.zoom.us" },
      },
      telegram: {
        value: { botToken: "123456789:ABCdefGHIjklMNOpqrsTUVwxyz", chatId: "-1001234567890" },
      },
      webhook: {
        value: {
          url: "https://api.telemetryflow.id/webhook",
          method: "POST",
          authType: "bearer",
          authToken: "my-secret-token",
          headers: { "X-Custom-Header": "value" },
          bodyTemplate: '{"alert": "{{alertName}}", "severity": "{{severity}}"}',
        },
      },
    },
  })
  @IsObject()
  config: Record<string, unknown>;

  @ApiPropertyOptional({
    description: "Send notification when alert is resolved",
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  sendResolved?: boolean;

  @ApiPropertyOptional({
    description: "Send reminder notifications for unresolved alerts",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  sendReminder?: boolean;

  @ApiPropertyOptional({
    description: 'Interval for reminder notifications (e.g., "1h", "30m")',
  })
  @IsOptional()
  @IsString()
  reminderInterval?: string;
}

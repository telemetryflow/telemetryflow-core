import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsObject,
  IsBoolean,
  IsUUID,
  MaxLength,
  ValidateNested,
  IsNumber,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  AlertSeverity,
  ConditionOperator,
  ConditionAggregation,
} from "../../domain/value-objects";

export class AlertConditionDto {
  @ApiProperty({ description: "Metric name to monitor", example: "cpu_usage" })
  @IsString()
  metric: string;

  @ApiPropertyOptional({
    description: "Aggregation function",
    enum: ConditionAggregation,
    default: ConditionAggregation.AVG,
  })
  @IsOptional()
  @IsEnum(ConditionAggregation)
  aggregation?: ConditionAggregation;

  @ApiPropertyOptional({
    description: "Comparison operator",
    enum: ConditionOperator,
    default: ConditionOperator.GREATER_THAN,
  })
  @IsOptional()
  @IsEnum(ConditionOperator)
  operator?: ConditionOperator;

  @ApiProperty({ description: "Threshold value", example: 80 })
  @IsNumber()
  threshold: number;

  @ApiProperty({ description: "Duration to evaluate over", example: "5m" })
  @IsString()
  duration: string;

  @ApiPropertyOptional({
    description: "Additional label filters",
    type: "object",
    additionalProperties: { type: "string" },
  })
  @IsOptional()
  @IsObject()
  labels?: Record<string, string>;
}

export class NotificationChannelRefDto {
  @ApiProperty({ description: "Notification channel ID" })
  @IsUUID()
  channelId: string;

  @ApiPropertyOptional({
    description: "Send notification when alert is resolved",
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  sendOnResolve?: boolean;
}

export class CreateAlertRuleRequestDto {
  @ApiProperty({ description: "Name of the alert rule", maxLength: 255 })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: "Description of the alert rule" })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: "Alert severity",
    enum: AlertSeverity,
    default: AlertSeverity.WARNING,
  })
  @IsOptional()
  @IsEnum(AlertSeverity)
  severity?: AlertSeverity;

  @ApiPropertyOptional({ description: "Workspace ID for scoped alert" })
  @IsOptional()
  @IsUUID()
  workspaceId?: string;

  @ApiPropertyOptional({
    description: "Alert conditions",
    type: [AlertConditionDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AlertConditionDto)
  conditions?: AlertConditionDto[];

  @ApiPropertyOptional({
    description: "Notification channels to alert",
    type: [NotificationChannelRefDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotificationChannelRefDto)
  notificationChannels?: NotificationChannelRefDto[];

  @ApiPropertyOptional({
    description: "Labels for categorization",
    type: "object",
    additionalProperties: { type: "string" },
  })
  @IsOptional()
  @IsObject()
  labels?: Record<string, string>;

  @ApiPropertyOptional({
    description: "Annotations with additional info",
    type: "object",
    additionalProperties: { type: "string" },
  })
  @IsOptional()
  @IsObject()
  annotations?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Evaluation interval (e.g., "1m", "5m")',
    default: "1m",
  })
  @IsOptional()
  @IsString()
  evaluationInterval?: string;

  @ApiPropertyOptional({
    description: 'Duration condition must be true before alerting (e.g., "5m")',
    default: "5m",
  })
  @IsOptional()
  @IsString()
  forDuration?: string;

  @ApiPropertyOptional({
    description: "Mute timing names",
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  muteTimings?: string[];

  @ApiPropertyOptional({
    description: "Query language (condition, tfql, promql, elasticsearch, sql)",
    default: "condition",
  })
  @IsOptional()
  @IsString()
  queryLanguage?: string;

  @ApiPropertyOptional({
    description: "Raw query string for TFQL/PromQL",
  })
  @IsOptional()
  @IsString()
  queryString?: string;

  @ApiPropertyOptional({
    description: "Query target (metrics, logs, traces, etc.)",
  })
  @IsOptional()
  @IsString()
  queryTarget?: string;

  @ApiPropertyOptional({
    description: "Alert source type (prometheus, tfo-agent, tfo-collector, custom)",
    default: "prometheus",
  })
  @IsOptional()
  @IsString()
  sourceType?: string;
}

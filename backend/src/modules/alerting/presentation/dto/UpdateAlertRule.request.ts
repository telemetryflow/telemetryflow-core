import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsObject,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { AlertSeverity } from "../../domain/value-objects";
import {
  AlertConditionDto,
  NotificationChannelRefDto,
} from "./CreateAlertRule.request";

export class UpdateAlertRuleRequestDto {
  @ApiPropertyOptional({
    description: "Name of the alert rule",
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: "Description of the alert rule" })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: "Alert severity",
    enum: AlertSeverity,
  })
  @IsOptional()
  @IsEnum(AlertSeverity)
  severity?: AlertSeverity;

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
  })
  @IsOptional()
  @IsString()
  evaluationInterval?: string;

  @ApiPropertyOptional({
    description: 'Duration condition must be true before alerting (e.g., "5m")',
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
}

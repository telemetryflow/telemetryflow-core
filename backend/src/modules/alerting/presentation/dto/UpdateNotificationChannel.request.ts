import {
  IsString,
  IsOptional,
  IsObject,
  IsBoolean,
  MaxLength,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateNotificationChannelRequestDto {
  @ApiPropertyOptional({
    description: "Name of the notification channel",
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: "Description of the notification channel",
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: "Channel-specific configuration",
    type: "object",
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: "Enable or disable the channel",
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    description: "Send notification when alert is resolved",
  })
  @IsOptional()
  @IsBoolean()
  sendResolved?: boolean;

  @ApiPropertyOptional({
    description: "Send reminder notifications for unresolved alerts",
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

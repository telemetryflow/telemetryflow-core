import { IsString, IsOptional, IsDateString, MaxLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class SilenceAlertRequestDto {
  @ApiProperty({
    description: "Silence until this datetime (ISO 8601)",
    example: "2025-03-01T12:00:00Z",
  })
  @IsDateString()
  until: string;

  @ApiPropertyOptional({
    description: "Reason for silencing the alert",
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}

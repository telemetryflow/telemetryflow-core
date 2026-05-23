import {
  IsString,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsBoolean,
  IsObject,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRetentionPolicyDto {
  @ApiPropertyOptional({ description: 'Policy name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Policy description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Number of days to retain data', minimum: 1, maximum: 3650 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  retentionDays?: number;

  @ApiPropertyOptional({ description: 'Enable archiving before deletion' })
  @IsOptional()
  @IsBoolean()
  archiveEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Archive destination (S3 bucket, GCS bucket, etc.)',
    example: 's3://my-bucket/archives',
  })
  @IsOptional()
  @IsString()
  archiveDestination?: string;

  @ApiPropertyOptional({
    description: 'Filters to apply when selecting data for retention',
  })
  @IsOptional()
  @IsObject()
  filters?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Whether the policy is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

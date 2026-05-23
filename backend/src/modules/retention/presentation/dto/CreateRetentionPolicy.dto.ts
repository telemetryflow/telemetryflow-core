import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsBoolean,
  IsObject,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRetentionPolicyDto {
  @ApiProperty({ description: 'Policy name', example: 'Production Logs 30 Days' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Policy description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Type of data this policy applies to',
    enum: ['logs', 'metrics', 'traces', 'alerts', 'exemplars'],
    example: 'logs',
  })
  @IsEnum(['logs', 'metrics', 'traces', 'alerts', 'exemplars'])
  dataType: 'logs' | 'metrics' | 'traces' | 'alerts' | 'exemplars';

  @ApiProperty({ description: 'Number of days to retain data', minimum: 1, maximum: 3650 })
  @IsInt()
  @Min(1)
  @Max(3650)
  retentionDays: number;

  @ApiPropertyOptional({ description: 'Enable archiving before deletion', default: false })
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
    example: { service_name: 'api-gateway', env: 'production' },
  })
  @IsOptional()
  @IsObject()
  filters?: Record<string, string>;
}

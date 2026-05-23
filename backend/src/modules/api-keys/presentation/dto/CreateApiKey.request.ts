import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsInt,
  IsDateString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApiKeyRequestDto {
  @ApiProperty({ description: 'Name of the API key', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Description of the API key' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Type of the API key',
    enum: ['standard', 'service'],
    default: 'standard',
  })
  @IsOptional()
  @IsEnum(['standard', 'service'])
  keyType?: 'standard' | 'service';

  @ApiPropertyOptional({ description: 'Workspace ID for scoped access' })
  @IsOptional()
  @IsUUID()
  workspaceId?: string;

  @ApiPropertyOptional({
    description: 'Permissions granted to the API key',
    type: [String],
    example: ['read:telemetry', 'write:telemetry'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @ApiPropertyOptional({
    description: 'Scopes for fine-grained access control',
    type: [String],
    example: ['traces', 'metrics', 'logs'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopes?: string[];

  @ApiPropertyOptional({
    description: 'Rate limit per minute',
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  rateLimit?: number;

  @ApiPropertyOptional({
    description: 'Expiration date (ISO 8601)',
    example: '2025-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

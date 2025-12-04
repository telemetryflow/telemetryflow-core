import { IsString, IsNotEmpty, IsOptional, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({ description: 'Tenant name', example: 'Default Tenant', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Unique tenant code', example: 'default', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiProperty({ description: 'Workspace ID', example: '11111111-1111-1111-1111-111111111111' })
  @IsUUID()
  @IsNotEmpty()
  workspaceId: string;

  @ApiPropertyOptional({ description: 'Tenant domain', example: 'default.telemetryflow.id', maxLength: 255 })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  domain?: string;
}

export class UpdateTenantDto {
  @ApiPropertyOptional({ description: 'Tenant name', example: 'Updated Tenant', maxLength: 255 })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Tenant domain', example: 'updated.telemetryflow.id', maxLength: 255 })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  domain?: string;
}

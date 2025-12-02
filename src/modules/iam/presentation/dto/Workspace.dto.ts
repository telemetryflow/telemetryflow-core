import { IsString, IsNotEmpty, IsOptional, IsUUID, IsObject, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWorkspaceDto {
  @ApiProperty({ description: 'Workspace name', example: 'Development', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Unique workspace code', example: 'dev', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiProperty({ description: 'Organization ID', example: '00000001-0000-0000-0000-000000000001' })
  @IsUUID()
  @IsNotEmpty()
  organizationId: string;

  @ApiPropertyOptional({ description: 'Workspace description', example: 'Development environment workspace' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Datasource configuration', example: { environment: 'development' } })
  @IsObject()
  @IsOptional()
  datasourceConfig?: Record<string, any>;
}

export class UpdateWorkspaceDto {
  @ApiPropertyOptional({ description: 'Workspace name', example: 'Development', maxLength: 255 })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Workspace description', example: 'Updated description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Datasource configuration', example: { environment: 'development', region: 'us-east-1' } })
  @IsObject()
  @IsOptional()
  datasourceConfig?: Record<string, any>;
}

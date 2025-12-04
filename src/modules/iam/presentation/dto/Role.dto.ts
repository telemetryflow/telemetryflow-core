import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsBoolean, IsUUID } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'Admin' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Administrator role with full access' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ example: ['user:read', 'user:write'], type: [String] })
  @IsArray()
  @IsOptional()
  permissionIds?: string[];

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsUUID()
  @IsOptional()
  tenantId?: string;
}

export class UpdateRoleDto {
  @ApiPropertyOptional({ example: 'Admin' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class ListRolesDto {
  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsUUID()
  @IsOptional()
  tenantId?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  includeSystem?: boolean = true;
}

export class AssignPermissionDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174002' })
  @IsUUID()
  permissionId: string;
}

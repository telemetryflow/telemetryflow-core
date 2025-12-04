import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({ example: 'user:read' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Read user data' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'user' })
  @IsString()
  resource: string;

  @ApiProperty({ example: 'read' })
  @IsString()
  action: string;
}

export class UpdatePermissionDto {
  @ApiPropertyOptional({ example: 'user:read' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Read user data' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'user' })
  @IsString()
  @IsOptional()
  resource?: string;

  @ApiPropertyOptional({ example: 'read' })
  @IsString()
  @IsOptional()
  action?: string;
}

export class ListPermissionsDto {
  @ApiPropertyOptional({ example: 'user' })
  @IsString()
  @IsOptional()
  resource?: string;
}

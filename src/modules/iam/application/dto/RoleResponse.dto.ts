import { ApiProperty } from '@nestjs/swagger';

export class RoleResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Admin' })
  name: string;

  @ApiProperty({ example: 'Administrator role with full access' })
  description: string;

  @ApiProperty({ example: ['user:read', 'user:write'], type: [String] })
  permissions: string[];

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001', required: false })
  tenantId?: string;

  @ApiProperty({ example: false })
  isSystem: boolean;

  @ApiProperty({ example: '2024-01-15T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:00:00Z' })
  updatedAt: Date;
}

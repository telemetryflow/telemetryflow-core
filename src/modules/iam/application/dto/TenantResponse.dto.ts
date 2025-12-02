import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TenantResponseDto {
  @ApiProperty({ example: '11111111-1111-1111-1111-111111111111' })
  id: string;

  @ApiProperty({ example: 'Default Tenant' })
  name: string;

  @ApiProperty({ example: 'default' })
  code: string;

  @ApiPropertyOptional({ example: 'default.telemetryflow.id' })
  domain?: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '11111111-1111-1111-1111-111111111111' })
  workspaceId: string;
}

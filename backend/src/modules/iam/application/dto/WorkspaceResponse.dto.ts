import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WorkspaceResponseDto {
  @ApiProperty({ example: '11111111-1111-1111-1111-111111111111' })
  id: string;

  @ApiProperty({ example: 'Development' })
  name: string;

  @ApiProperty({ example: 'dev' })
  code: string;

  @ApiPropertyOptional({ example: 'Development environment workspace' })
  description?: string;

  @ApiPropertyOptional({ example: { environment: 'development' } })
  datasourceConfig?: Record<string, any>;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '00000001-0000-0000-0000-000000000001' })
  organizationId: string;
}

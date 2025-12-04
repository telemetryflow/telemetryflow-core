import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrganizationResponseDto {
  @ApiProperty({ example: '00000001-0000-0000-0000-000000000001' })
  id: string;

  @ApiProperty({ example: 'DevOpsCorner' })
  name: string;

  @ApiProperty({ example: 'devopscorner' })
  code: string;

  @ApiPropertyOptional({ example: 'DevOpsCorner Indonesia organization' })
  description: string | null;

  @ApiPropertyOptional({ example: 'devopscorner.id' })
  domain: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '00000001-0000-0000-0000-000000000001' })
  regionId: string;
}

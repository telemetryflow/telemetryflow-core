import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateRegionDto {
  @ApiProperty({ example: 'US East (N. Virginia)' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'us-east-1' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'US East region' })
  @IsString()
  description: string;
}

export class UpdateRegionDto {
  @ApiPropertyOptional({ example: 'US East (N. Virginia)' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsString()
  @IsOptional()
  description?: string;
}

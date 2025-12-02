import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({ example: 'Engineering Team' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Engineering department group' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsUUID()
  @IsOptional()
  organizationId?: string;
}

export class UpdateGroupDto {
  @ApiPropertyOptional({ example: 'Engineering Team' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class AddUserDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174002' })
  @IsUUID()
  userId: string;
}

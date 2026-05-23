import { IsString, IsOptional, IsArray, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QueryTarget } from '../../../query/domain/types/ast-nodes.types';

/**
 * Request DTO for validating TFQL queries
 */
export class ValidateTfqlQueryRequestDto {
  @ApiProperty({
    description: 'TFQL query string to validate',
    example: 'FETCH metrics WHERE name = "cpu_usage" TIMERANGE last 1h',
    maxLength: 4000,
  })
  @IsString()
  @MaxLength(4000)
  query: string;

  @ApiPropertyOptional({
    description: 'Restrict validation to specific targets',
    example: ['metrics', 'logs'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedTargets?: QueryTarget[];

  @ApiPropertyOptional({
    description: 'Enable strict validation mode',
    default: false,
  })
  @IsOptional()
  strictMode?: boolean;
}

/**
 * Response DTO for TFQL validation results
 */
export class TfqlValidationResultDto {
  @ApiProperty({
    description: 'Whether the query is valid',
    example: true,
  })
  valid: boolean;

  @ApiPropertyOptional({
    description: 'Error message if validation failed',
    example: 'Parse error at line 1, column 15: Expected FETCH or CORRELATE',
  })
  error?: string;

  @ApiPropertyOptional({
    description: 'Error details with position information',
  })
  errorDetails?: {
    line: number;
    column: number;
    position: number;
    message: string;
  };

  @ApiPropertyOptional({
    description: 'Parsed query structure (only if valid)',
  })
  parsedQuery?: {
    type: string;
    target?: string;
    hasFilter?: boolean;
    hasTimeRange?: boolean;
    hasAggregation?: boolean;
    hasGroupBy?: boolean;
  };

  @ApiPropertyOptional({
    description: 'Query suggestions or warnings',
    type: [String],
  })
  suggestions?: string[];
}

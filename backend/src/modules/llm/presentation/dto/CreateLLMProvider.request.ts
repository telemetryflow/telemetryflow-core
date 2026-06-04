/**
 * Create LLM Provider Request DTO
 */

import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  MaxLength,
  Min,
  Max,
  IsUrl,
  IsIn,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ProviderTypeEnum } from "../../domain/value-objects/ProviderType";

const SAMPLING_MODES = ["temperature", "top_p", "auto"] as const;

export class CreateLLMProviderRequestDto {
  @ApiProperty({
    description: "Display name for the LLM provider",
    maxLength: 255,
    example: "My Claude Provider",
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: "Type of LLM provider",
    enum: Object.values(ProviderTypeEnum),
    example: ProviderTypeEnum.CLAUDE,
  })
  @IsEnum(ProviderTypeEnum)
  providerType: ProviderTypeEnum;

  @ApiProperty({
    description: "API key for the provider (will be encrypted)",
    example: "sk-ant-api03-...",
  })
  @IsString()
  apiKey: string;

  @ApiProperty({
    description: "Model ID to use",
    example: "claude-sonnet-4-20250514",
  })
  @IsString()
  @MaxLength(100)
  modelId: string;

  @ApiPropertyOptional({
    description: "Custom base URL (required for custom provider type)",
    example: "https://api.custom-llm.com/v1",
  })
  @IsOptional()
  @IsUrl({ require_tld: false })
  baseUrl?: string;

  @ApiPropertyOptional({
    description: "Temperature (0.0 - 2.0)",
    minimum: 0,
    maximum: 2,
    default: 0.7,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiPropertyOptional({
    description: "Maximum tokens in response",
    minimum: 1,
    maximum: 128000,
    default: 4096,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(128000)
  maxTokens?: number;

  @ApiPropertyOptional({
    description: "Top P (nucleus sampling)",
    minimum: 0,
    maximum: 1,
    default: 1.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  topP?: number;

  @ApiPropertyOptional({
    description:
      "Sampling mode: 'temperature' uses temperature only, 'top_p' uses top_p only, 'auto' prefers temperature over top_p (default: auto)",
    enum: SAMPLING_MODES,
    default: "auto",
  })
  @IsOptional()
  @IsIn(SAMPLING_MODES)
  samplingMode?: string;

  @ApiPropertyOptional({
    description: "Set as default provider for the organization",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

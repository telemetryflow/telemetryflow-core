/**
 * Update LLM Provider Request DTO
 */

import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  MaxLength,
  Min,
  Max,
  IsUrl,
  IsIn,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

const SAMPLING_MODES = ["temperature", "top_p", "auto"] as const;

export class UpdateLLMProviderRequestDto {
  @ApiPropertyOptional({
    description: "Display name for the LLM provider",
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: "New API key (will be encrypted)",
  })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({
    description: "Model ID to use",
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  modelId?: string;

  @ApiPropertyOptional({
    description: "Custom base URL",
  })
  @IsOptional()
  @IsUrl({ require_tld: false })
  baseUrl?: string;

  @ApiPropertyOptional({
    description: "Temperature (0.0 - 2.0)",
    minimum: 0,
    maximum: 2,
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
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  topP?: number;

  @ApiPropertyOptional({
    description:
      "Sampling mode: 'temperature' uses temperature only, 'top_p' uses top_p only, 'auto' prefers temperature over top_p",
    enum: SAMPLING_MODES,
  })
  @IsOptional()
  @IsIn(SAMPLING_MODES)
  samplingMode?: string;

  @ApiPropertyOptional({
    description: "Activate or deactivate the provider",
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * Test LLM Provider Key Request DTO
 * Validates a raw API key against a provider type without needing a saved provider record
 */

import { IsString, IsOptional, IsEnum, IsUrl } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ProviderTypeEnum } from "../../domain/value-objects/ProviderType";

export class TestLLMProviderKeyDto {
  @ApiProperty({
    description: "Type of LLM provider to test against",
    enum: Object.values(ProviderTypeEnum),
    example: ProviderTypeEnum.ANTHROPIC,
  })
  @IsEnum(ProviderTypeEnum)
  providerType: ProviderTypeEnum;

  @ApiProperty({
    description: "API key to validate",
    example: "sk-ant-api03-...",
  })
  @IsString()
  apiKey: string;

  @ApiPropertyOptional({
    description: "Base URL (required for custom/ollama provider types)",
    example: "https://api.custom-llm.com/v1",
  })
  @IsOptional()
  @IsUrl({ require_tld: false })
  baseUrl?: string;
}

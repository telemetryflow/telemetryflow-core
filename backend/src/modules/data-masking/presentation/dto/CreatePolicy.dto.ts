import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
  IsEnum,
  IsInt,
  IsUUID,
  MinLength,
  MaxLength,
  ValidateNested,
  Min,
  Max,
} from "class-validator";
import { Type } from "class-transformer";
import {
  TargetField,
  BuiltinPattern,
  MaskType,
  MatchType,
} from "../../domain/value-objects/MaskingRule";

export class MaskingRuleDto {
  @ApiPropertyOptional({ description: "Rule UUID — auto-generated if omitted" })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({
    description: "Human-readable rule name",
    example: "Mask email addresses",
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: "Optional description for this rule" })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ description: "Whether this rule is active", default: true })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({
    description: "Execution priority — lower numbers run first",
    minimum: 0,
    maximum: 1000,
    default: 100,
  })
  @IsInt()
  @Min(0)
  @Max(1000)
  priority: number;

  @ApiProperty({
    enum: TargetField,
    description: "Which log field(s) to target",
    example: TargetField.BODY,
  })
  @IsEnum(TargetField)
  targetField: TargetField;

  @ApiPropertyOptional({
    description:
      "Required when targetField is RESOURCE_ATTRIBUTE_KEY or LOG_ATTRIBUTE_KEY — specifies the attribute key",
    example: "user.email",
  })
  @IsOptional()
  @IsString()
  fieldKey?: string;

  @ApiProperty({
    enum: MatchType,
    description: "How to match the pattern",
    example: MatchType.BUILTIN,
  })
  @IsEnum(MatchType)
  matchType: MatchType;

  @ApiPropertyOptional({
    enum: BuiltinPattern,
    description: "Required when matchType is BUILTIN",
    example: BuiltinPattern.EMAIL,
  })
  @IsOptional()
  @IsEnum(BuiltinPattern)
  builtinPattern?: BuiltinPattern;

  @ApiPropertyOptional({
    description:
      "Custom regex string (matchType=REGEX) or exact string (matchType=EXACT)",
    example: "\\b\\d{4}-\\d{4}-\\d{4}-\\d{4}\\b",
  })
  @IsOptional()
  @IsString()
  customPattern?: string;

  @ApiProperty({
    enum: MaskType,
    description: "How to mask the matched value",
    example: MaskType.REDACT,
  })
  @IsEnum(MaskType)
  maskType: MaskType;

  @ApiPropertyOptional({
    description:
      "Replacement string for REDACT or REPLACE mask types (default: [REDACTED])",
    example: "[EMAIL]",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  replacement?: string;

  @ApiPropertyOptional({
    description:
      "Number of characters to keep for TRUNCATE mask type (default: 4)",
    minimum: 1,
    maximum: 256,
    example: 4,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(256)
  truncateLength?: number;
}

export class CreatePolicyDto {
  @ApiProperty({
    description: "Policy name",
    example: "Production PII Masking",
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: "Policy description",
    example: "Masks emails, SSNs, and credit card numbers from all log fields",
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: "Whether the policy is active immediately",
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    description: "Restrict policy to a specific workspace (omit for org-wide)",
    format: "uuid",
  })
  @IsOptional()
  @IsUUID()
  workspaceId?: string;

  @ApiProperty({
    type: [MaskingRuleDto],
    description:
      "Ordered list of masking rules (sorted by priority at runtime)",
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaskingRuleDto)
  rules: MaskingRuleDto[];
}

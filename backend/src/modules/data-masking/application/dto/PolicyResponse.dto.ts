import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { DataMaskingPolicy } from "../../domain/aggregates/DataMaskingPolicy";
import { MaskingRuleProps } from "../../domain/value-objects/MaskingRule";

export class PolicyResponseDto {
  @ApiProperty({ description: "Policy UUID", format: "uuid" })
  id: string;

  @ApiProperty({ description: "Owning organization UUID", format: "uuid" })
  organizationId: string;

  @ApiPropertyOptional({
    description: "Workspace-scoped policy UUID (null = org-wide)",
    format: "uuid",
    nullable: true,
  })
  workspaceId: string | null;

  @ApiProperty({
    description: "Human-readable policy name",
    example: "Production PII Masking",
  })
  name: string;

  @ApiPropertyOptional({ description: "Policy description", nullable: true })
  description: string | null;

  @ApiProperty({
    description: "Whether the policy actively masks logs at ingestion",
    example: true,
  })
  enabled: boolean;

  @ApiProperty({
    description: "Ordered list of masking rules (sorted by priority ascending)",
    isArray: true,
    type: () => Object,
  })
  rules: MaskingRuleProps[];

  @ApiProperty({
    description: "Total number of rules (enabled + disabled)",
    example: 3,
  })
  ruleCount: number;

  @ApiProperty({ description: "Number of currently enabled rules", example: 2 })
  activeRuleCount: number;

  @ApiProperty({
    description: "UUID of the user who created this policy",
    format: "uuid",
  })
  createdBy: string;

  @ApiPropertyOptional({
    description: "UUID of the user who last updated this policy",
    nullable: true,
    format: "uuid",
  })
  updatedBy: string | null;

  @ApiProperty({
    description: "ISO-8601 creation timestamp",
    format: "date-time",
  })
  createdAt: string;

  @ApiProperty({
    description: "ISO-8601 last-updated timestamp",
    format: "date-time",
  })
  updatedAt: string;

  static fromDomain(policy: DataMaskingPolicy): PolicyResponseDto {
    const dto = new PolicyResponseDto();
    dto.id = policy.id;
    dto.organizationId = policy.organizationId;
    dto.workspaceId = policy.workspaceId ?? null;
    dto.name = policy.name;
    dto.description = policy.description ?? null;
    dto.enabled = policy.enabled;
    dto.rules = policy.rules.map((r) => r.toJSON());
    dto.ruleCount = policy.rules.length;
    dto.activeRuleCount = policy.activeRules.length;
    dto.createdBy = policy.createdBy;
    dto.updatedBy = policy.updatedBy ?? null;
    dto.createdAt = policy.createdAt.toISOString();
    dto.updatedAt = policy.updatedAt.toISOString();
    return dto;
  }
}

export class ListPoliciesResponseDto {
  @ApiProperty({
    type: [PolicyResponseDto],
    description: "Page of masking policies",
  })
  data: PolicyResponseDto[];

  @ApiProperty({ description: "Total number of matching policies", example: 5 })
  total: number;

  @ApiProperty({ description: "Current page number (1-indexed)", example: 1 })
  page: number;

  @ApiProperty({ description: "Results per page", example: 20 })
  pageSize: number;

  @ApiProperty({ description: "Total number of pages", example: 1 })
  totalPages: number;
}

export class TestRuleResponseDto {
  @ApiProperty({ description: "The original sample input string" })
  original: string;

  @ApiProperty({ description: "The input after the masking rule was applied" })
  masked: string;

  @ApiProperty({
    description: "Whether any PII was detected and transformed",
    example: true,
  })
  changed: boolean;

  @ApiProperty({
    description: "Number of matches found and replaced",
    example: 1,
  })
  matchCount: number;
}

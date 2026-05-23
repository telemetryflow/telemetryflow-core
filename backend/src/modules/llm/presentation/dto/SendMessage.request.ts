/**
 * Send Message Request DTO
 */

import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsObject,
  IsArray,
  IsDateString,
  ValidateNested,
  MaxLength,
  IsMimeType,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { ContextType } from "../../domain/aggregates/Conversation";

export class AttachmentDto {
  @ApiProperty({ description: "MIME type of the attachment, e.g. image/jpeg" })
  @IsString()
  @IsMimeType()
  mediaType: string;

  @ApiProperty({ description: "Base64-encoded file data (no data-URL prefix)" })
  @IsString()
  data: string;

  @ApiProperty({ description: "Original file name" })
  @IsString()
  name: string;
}

const ContextTypes = [
  // Core telemetry
  "metrics", "logs", "traces", "exemplars", "correlations",
  // Alerting & monitoring
  "alerts", "alert-rules", "agents", "uptime", "status-page",
  // Infrastructure
  "infra-overview", "infra-cpu", "infra-memory", "infra-storage", "infra-network",
  // Kubernetes
  "kubernetes-overview", "kubernetes-clusters", "kubernetes-namespaces",
  "kubernetes-nodes", "kubernetes-pods", "kubernetes-deployments", "kubernetes-pv",
  "kubernetes-api-server", "kubernetes-coredns",
  // Topology
  "service-map", "network-map",
  // Dashboard & reports
  "dashboard", "reports",
  // Platform management
  "iam", "iam-users", "iam-roles", "iam-permissions", "iam-matrix", "iam-assignments",
  "tenancy", "tenancy-regions", "tenancy-organizations", "tenancy-workspaces", "tenancy-tenants",
  "audit", "retention", "subscription", "api-keys", "notifications", "data-masking",
  // System settings
  "system-setup", "system-channels", "ai-assistant",
  // Account
  "account-profile", "account-security", "account-sessions",
  "account-notifications", "account-preferences", "account-organization",
  // AI Intelligence
  "anomaly-detection", "corrective-maintenance", "cost-optimization", "predictive-maintenance",
  // DB Monitoring
  "db-monitoring-inventory", "db-monitoring-clickhouse",
] as const;

export class SendMessageRequestDto {
  @ApiProperty({
    description: "The message content",
    maxLength: 32000,
    example: "Analyze recent error logs and identify patterns",
  })
  @IsString()
  @MaxLength(32000)
  message: string;

  @ApiPropertyOptional({
    description: "Conversation ID for continuing existing conversation",
  })
  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @ApiPropertyOptional({
    description: "LLM Provider ID to use (defaults to organization default)",
  })
  @IsOptional()
  @IsUUID()
  providerId?: string;

  @ApiProperty({
    description: "Context type for the chat",
    enum: ContextTypes,
    example: "logs",
  })
  @IsEnum(ContextTypes)
  contextType: ContextType;

  @ApiPropertyOptional({
    description: "Specific context ID (e.g., alert ID, trace ID)",
  })
  @IsOptional()
  @IsString()
  contextId?: string;

  @ApiPropertyOptional({
    description: "Start of time range for context queries (ISO 8601). Defaults to 1 hour ago.",
    example: "2024-01-01T00:00:00Z",
  })
  @IsOptional()
  @IsDateString()
  timeFrom?: string;

  @ApiPropertyOptional({
    description: "End of time range for context queries (ISO 8601). Defaults to now.",
    example: "2024-01-02T00:00:00Z",
  })
  @IsOptional()
  @IsDateString()
  timeTo?: string;

  @ApiPropertyOptional({
    description: "Additional metadata for the message",
    type: "object",
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: "File attachments (images sent as content blocks to the model)",
    type: [AttachmentDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];
}

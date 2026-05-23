/**
 * Generate Insight Request DTO
 */

import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  IsObject,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { ContextType } from "../../domain/aggregates/Conversation";

const ContextTypes = [
  // Core telemetry
  "metrics", "logs", "traces", "exemplars", "correlations",
  // Alerting & monitoring
  "alerts", "alert-rules", "agents", "uptime", "status-page",
  // Kubernetes
  "kubernetes-overview", "kubernetes-clusters", "kubernetes-namespaces",
  "kubernetes-nodes", "kubernetes-pods", "kubernetes-deployments", "kubernetes-pv",
  "kubernetes-api-server", "kubernetes-coredns",
  // Infrastructure
  "infra-overview", "infra-cpu", "infra-memory", "infra-storage", "infra-network",
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

const InsightTypes = [
  "chronology",
  "prediction",
  "recommendation",
  "root-cause",
  "pattern",
] as const;

export class GenerateInsightRequestDto {
  @ApiProperty({
    description: "Type of insight to generate",
    enum: InsightTypes,
    example: "root-cause",
  })
  @IsEnum(InsightTypes)
  insightType: "chronology" | "prediction" | "recommendation" | "root-cause" | "pattern";

  @ApiProperty({
    description: "Context type for the insight",
    enum: ContextTypes,
    example: "alerts",
  })
  @IsEnum(ContextTypes)
  contextType: ContextType;

  @ApiPropertyOptional({
    description: "Specific context ID (e.g., alert ID, incident ID)",
  })
  @IsOptional()
  @IsString()
  contextId?: string;

  @ApiPropertyOptional({
    description: "LLM Provider ID to use",
  })
  @IsOptional()
  @IsUUID()
  providerId?: string;

  @ApiPropertyOptional({
    description: "Start of time range (ISO 8601)",
    example: "2024-01-01T00:00:00Z",
  })
  @IsOptional()
  @IsDateString()
  timeFrom?: string;

  @ApiPropertyOptional({
    description: "End of time range (ISO 8601)",
    example: "2024-01-02T00:00:00Z",
  })
  @IsOptional()
  @IsDateString()
  timeTo?: string;

  @ApiPropertyOptional({
    description: "Additional context data",
    type: "object",
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  additionalContext?: Record<string, unknown>;
}

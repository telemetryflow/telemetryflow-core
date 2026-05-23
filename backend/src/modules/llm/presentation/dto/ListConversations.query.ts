/**
 * List Conversations Query DTO
 */

import {
  IsOptional,
  IsInt,
  IsBoolean,
  IsEnum,
  IsString,
  Min,
  Max,
  MaxLength,
} from "class-validator";
import { Transform } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";
import type { ContextType } from "../../domain/aggregates/Conversation";
import { TELEMETRYFLOW_HARD_LIMIT } from "../../../../shared/constants/telemetry-limits";

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

export class ListConversationsQueryDto {
  @ApiPropertyOptional({
    description: "Page number",
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Items per page",
    default: 20,
    minimum: 1,
    maximum: TELEMETRYFLOW_HARD_LIMIT,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(TELEMETRYFLOW_HARD_LIMIT)
  @Transform(({ value }) => parseInt(value, 10))
  pageSize?: number = 20;

  @ApiPropertyOptional({
    description: "Filter by context type",
    enum: ContextTypes,
  })
  @IsOptional()
  @IsEnum(ContextTypes)
  contextType?: ContextType;

  @ApiPropertyOptional({
    description: "Filter by archived status",
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true" || value === true)
  isArchived?: boolean;

  @ApiPropertyOptional({
    description: "Search by title",
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;
}

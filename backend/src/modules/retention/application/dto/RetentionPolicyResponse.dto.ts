import { DataType } from '../../domain/aggregates/RetentionPolicy';

export interface RetentionPolicyResponseDto {
  id: string;
  name: string;
  description?: string;
  dataType: DataType;
  retentionDays: number;
  archiveEnabled: boolean;
  archiveDestination?: string;
  filters?: Record<string, string>;
  isDefault: boolean;
  isActive: boolean;
  organizationId?: string;
  lastEnforcedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RetentionStatisticsDto {
  dataType: DataType;
  totalRecords: number;
  oldestRecord?: Date;
  newestRecord?: Date;
  estimatedSize: string;
  retentionPolicy?: {
    name: string;
    retentionDays: number;
    cutoffDate: Date;
  };
  recordsToDelete?: number;
  estimatedSizeToDelete?: string;
}

export interface EnforceRetentionResultDto {
  dataType: DataType;
  recordsDeleted: number;
  spaceReclaimed: string;
  duration: number;
  dryRun: boolean;
  errors?: string[];
}

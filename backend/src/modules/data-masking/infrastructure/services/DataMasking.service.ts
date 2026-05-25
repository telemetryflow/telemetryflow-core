/**
 * DataMaskingService
 *
 * Core runtime service responsible for loading active PII masking policies
 * for an organization and applying them to log records before ClickHouse insertion.
 *
 * Policies are cached in the dual-layer cache (L1 in-memory 60s, L2 Redis 1800s)
 * under the key: `masking_policies:{organizationId}`
 *
 * Masking is applied in-place per rule priority (ascending). Rules targeting:
 *  - BODY → applied directly to the log body string
 *  - RESOURCE_ATTRIBUTES → applied to every attribute value
 *  - LOG_ATTRIBUTES → applied to every log attribute value
 *  - RESOURCE_ATTRIBUTE_KEY → applied to one specific attribute key
 *  - LOG_ATTRIBUTE_KEY → applied to one specific log attribute key
 *  - ALL → applied to body + all attribute values
 */

import { Injectable, Inject, Logger } from "@nestjs/common";
import { LogRecord } from "@/shared/clickhouse/clickhouse.service";
import {
  IDataMaskingPolicyRepository,
  DATA_MASKING_POLICY_REPOSITORY,
} from "../../domain/repositories/IDataMaskingPolicyRepository";
import { DataMaskingPolicy } from "../../domain/aggregates/DataMaskingPolicy";
import {
  MaskingRule,
  TargetField,
} from "../../domain/value-objects/MaskingRule";
import {
  ICacheService,
  CACHE_SERVICE,
} from "@/shared/cache/interfaces/cache.interface";

const CACHE_TTL_SECONDS = 300; // 5 minutes — balances freshness with performance
const CACHE_KEY_PREFIX = "masking_policies:";

@Injectable()
export class DataMaskingService {
  private readonly logger = new Logger(DataMaskingService.name);

  constructor(
    @Inject(DATA_MASKING_POLICY_REPOSITORY)
    private readonly repository: IDataMaskingPolicyRepository,
    @Inject(CACHE_SERVICE)
    private readonly cache: ICacheService,
  ) {}

  /**
   * Apply all active masking policies for the given organization to a batch
   * of LogRecord objects. Returns a new array of masked records (original array
   * is NOT mutated).
   *
   * @param records  - Raw log records from OTLP ingestion
   * @param organizationId - The org whose masking policies should apply
   */
  async applyToLogs(
    records: LogRecord[],
    organizationId: string,
  ): Promise<LogRecord[]> {
    if (!records.length) return records;

    const policies = await this.loadActivePolicies(organizationId);
    if (!policies.length) return records;

    const rules = this.collectActiveRules(policies);
    if (!rules.length) return records;

    return records.map((record) => this.maskRecord(record, rules));
  }

  /**
   * Invalidate the policy cache for an organization.
   * Called by CQRS handlers on create/update/delete.
   */
  async invalidateCache(organizationId: string): Promise<void> {
    await this.cache.delete(`${CACHE_KEY_PREFIX}${organizationId}`);
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private async loadActivePolicies(
    organizationId: string,
  ): Promise<DataMaskingPolicy[]> {
    const cacheKey = `${CACHE_KEY_PREFIX}${organizationId}`;

    const cached = await this.cache.get<DataMaskingPolicy[]>(cacheKey);
    if (cached) return cached;

    try {
      const policies = await this.repository.findByOrganization(
        organizationId,
        true, // enabled only
      );
      await this.cache.set(cacheKey, policies, { ttl: CACHE_TTL_SECONDS });
      return policies;
    } catch (err) {
      this.logger.error(
        `Failed to load masking policies for org ${organizationId}: ${err.message}`,
      );
      return [];
    }
  }

  private collectActiveRules(policies: DataMaskingPolicy[]): MaskingRule[] {
    const rules: MaskingRule[] = [];
    for (const policy of policies) {
      if (policy.enabled) {
        // activeRules getter is lost when policy is a plain object deserialized from cache;
        // fall back to filtering policy.rules directly
        const activeRules: MaskingRule[] =
          policy.activeRules ??
          ((policy as any).rules ?? []).filter((r: any) => r.enabled);
        rules.push(...activeRules);
      }
    }
    // Sort all rules across all policies by priority ascending
    return rules.sort((a, b) => a.priority - b.priority);
  }

  private maskRecord(record: LogRecord, rules: MaskingRule[]): LogRecord {
    // Shallow-clone the record so we don't mutate the original
    const masked: LogRecord = { ...record };

    // Clone attribute maps
    masked.resource_attributes = { ...record.resource_attributes };
    masked.log_attributes = { ...record.log_attributes };

    for (const rule of rules) {
      this.applyRule(masked, rule);
    }

    return masked;
  }

  private applyRule(record: LogRecord, rule: MaskingRule): void {
    switch (rule.targetField) {
      case TargetField.BODY:
        record.body = rule.apply(record.body);
        break;

      case TargetField.RESOURCE_ATTRIBUTES:
        for (const key of Object.keys(record.resource_attributes)) {
          record.resource_attributes[key] = rule.apply(
            record.resource_attributes[key],
          );
        }
        break;

      case TargetField.LOG_ATTRIBUTES:
        for (const key of Object.keys(record.log_attributes)) {
          record.log_attributes[key] = rule.apply(record.log_attributes[key]);
        }
        break;

      case TargetField.RESOURCE_ATTRIBUTE_KEY:
        if (rule.fieldKey && rule.fieldKey in record.resource_attributes) {
          record.resource_attributes[rule.fieldKey] = rule.apply(
            record.resource_attributes[rule.fieldKey],
          );
        }
        break;

      case TargetField.LOG_ATTRIBUTE_KEY:
        if (rule.fieldKey && rule.fieldKey in record.log_attributes) {
          record.log_attributes[rule.fieldKey] = rule.apply(
            record.log_attributes[rule.fieldKey],
          );
        }
        break;

      case TargetField.ALL:
        record.body = rule.apply(record.body);
        for (const key of Object.keys(record.resource_attributes)) {
          record.resource_attributes[key] = rule.apply(
            record.resource_attributes[key],
          );
        }
        for (const key of Object.keys(record.log_attributes)) {
          record.log_attributes[key] = rule.apply(record.log_attributes[key]);
        }
        break;
    }
  }
}

export const DATA_MASKING_SERVICE = Symbol("DATA_MASKING_SERVICE");

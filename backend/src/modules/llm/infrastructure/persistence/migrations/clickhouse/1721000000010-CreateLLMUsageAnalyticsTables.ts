/**
 * LLM Migration (ClickHouse): Create LLM Usage Analytics Tables
 * Timestamp: 1721000000010 (LLM module range)
 *
 * Creates analytics tables for LLM usage tracking:
 * - llm_usage_raw: Raw usage events (tokens, latency, model, cost per message)
 * - llm_usage_hourly_mv: Hourly rollup materialized view
 * - llm_usage_daily_mv: Daily rollup materialized view
 * - llm_context_analytics_mv: Context type distribution materialized view
 */

import { ClickHouseClient } from "@clickhouse/client";
import { BaseClickHouseMigration } from "../../../../../../database/shared/BaseClickHouseMigration";

export class CreateLLMUsageAnalyticsTables1721000000010 extends BaseClickHouseMigration {
  name = "CreateLLMUsageAnalyticsTables1721000000010";
  moduleName = "llm";

  async up(client: ClickHouseClient, database: string): Promise<void> {
    this.log("Creating LLM usage analytics tables and views...");

    // Ensure database exists
    await this.createDatabaseIfNotExists(client, database);

    // =========================================================================
    // Base Table: llm_usage_raw
    // =========================================================================
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${database}.llm_usage_raw (
        -- Primary fields
        id UUID DEFAULT generateUUIDv4(),
        timestamp DateTime64(3) DEFAULT now64(3),

        -- Message reference
        message_id String,
        conversation_id String,

        -- Provider & model info
        provider_id String,
        provider_type LowCardinality(String),
        model_id LowCardinality(String),

        -- Token usage
        prompt_tokens UInt32 DEFAULT 0,
        completion_tokens UInt32 DEFAULT 0,
        total_tokens UInt32 DEFAULT 0,

        -- Performance
        latency_ms UInt32 DEFAULT 0,
        time_to_first_token_ms UInt32 DEFAULT 0,

        -- Cost tracking (in microdollars for precision)
        prompt_cost_micros UInt64 DEFAULT 0,
        completion_cost_micros UInt64 DEFAULT 0,
        total_cost_micros UInt64 DEFAULT 0,

        -- Request metadata
        role LowCardinality(String),
        context_type LowCardinality(String),
        context_id String,
        is_streaming UInt8 DEFAULT 0,

        -- Status
        status LowCardinality(String) DEFAULT 'success',
        error_type LowCardinality(String) DEFAULT '',
        error_message String DEFAULT '',

        -- Multi-tenancy
        organization_id String,
        workspace_id String,
        user_id String,
        tenant_id String,

        -- Timestamps
        created_at DateTime64(3) DEFAULT now64(3)
      )
      ENGINE = MergeTree()
      PARTITION BY toYYYYMM(timestamp)
      ORDER BY (organization_id, provider_type, model_id, timestamp)
      TTL toDateTime(timestamp) + INTERVAL 90 DAY
      SETTINGS index_granularity = 8192
    `;

    await this.createTableIfNotExists(
      client,
      database,
      "llm_usage_raw",
      createTableQuery,
    );

    // Create indexes
    const indexes = [
      { name: "idx_llm_user_id", column: "user_id", type: "bloom_filter" },
      {
        name: "idx_llm_provider_id",
        column: "provider_id",
        type: "bloom_filter",
      },
      {
        name: "idx_llm_conversation_id",
        column: "conversation_id",
        type: "bloom_filter",
      },
      { name: "idx_llm_context_type", column: "context_type", type: "set(0)" },
      { name: "idx_llm_status", column: "status", type: "set(0)" },
      {
        name: "idx_llm_provider_type",
        column: "provider_type",
        type: "set(0)",
      },
      { name: "idx_llm_tenant_id", column: "tenant_id", type: "bloom_filter" },
      {
        name: "idx_llm_organization_id",
        column: "organization_id",
        type: "bloom_filter",
      },
    ];

    for (const idx of indexes) {
      try {
        await client.command({
          query: `ALTER TABLE ${database}.llm_usage_raw ADD INDEX IF NOT EXISTS ${idx.name} ${idx.column} TYPE ${idx.type} GRANULARITY 1`,
        });
        this.log(`Created index: ${idx.name}`);
      } catch (_error) {
        this.log(`Index ${idx.name} may already exist, skipping`);
      }
    }

    // =========================================================================
    // Materialized View: llm_usage_hourly_mv (Hourly rollup)
    // =========================================================================
    const hourlyViewExists = await this.viewExists(
      client,
      database,
      "llm_usage_hourly_mv",
    );
    if (!hourlyViewExists) {
      await client.command({
        query: `
          CREATE MATERIALIZED VIEW ${database}.llm_usage_hourly_mv
          ENGINE = AggregatingMergeTree()
          PARTITION BY toYYYYMM(hour)
          ORDER BY (organization_id, provider_type, model_id, hour)
          TTL hour + INTERVAL 180 DAY
          AS SELECT
            toStartOfHour(timestamp) AS hour,
            organization_id,
            provider_type,
            model_id,
            user_id,
            context_type,
            status,

            -- Token aggregations
            sumState(prompt_tokens) AS prompt_tokens_sum,
            sumState(completion_tokens) AS completion_tokens_sum,
            sumState(total_tokens) AS total_tokens_sum,

            -- Cost aggregations
            sumState(total_cost_micros) AS total_cost_micros_sum,

            -- Performance aggregations
            avgState(latency_ms) AS latency_ms_avg,
            maxState(latency_ms) AS latency_ms_max,
            minState(latency_ms) AS latency_ms_min,
            quantileState(0.95)(latency_ms) AS latency_ms_p95,

            -- Request counts
            countState() AS request_count,
            countIfState(status = 'error') AS error_count,
            countIfState(is_streaming = 1) AS streaming_count
          FROM ${database}.llm_usage_raw
          GROUP BY hour, organization_id, provider_type, model_id, user_id, context_type, status
        `,
      });
      this.log("Created materialized view: llm_usage_hourly_mv");
    }

    // =========================================================================
    // Materialized View: llm_usage_daily_mv (Daily rollup)
    // =========================================================================
    const dailyViewExists = await this.viewExists(
      client,
      database,
      "llm_usage_daily_mv",
    );
    if (!dailyViewExists) {
      await client.command({
        query: `
          CREATE MATERIALIZED VIEW ${database}.llm_usage_daily_mv
          ENGINE = SummingMergeTree()
          PARTITION BY toYYYYMM(date)
          ORDER BY (organization_id, provider_type, model_id, date)
          TTL date + INTERVAL 365 DAY
          AS SELECT
            toDate(timestamp) AS date,
            organization_id,
            provider_type,
            model_id,
            context_type,
            status,

            -- Summed metrics
            sum(prompt_tokens) AS prompt_tokens,
            sum(completion_tokens) AS completion_tokens,
            sum(total_tokens) AS total_tokens,
            sum(total_cost_micros) AS total_cost_micros,
            count() AS request_count,
            countIf(status = 'error') AS error_count,
            countIf(is_streaming = 1) AS streaming_count,

            -- Unique users (approximate)
            uniq(user_id) AS unique_users,
            uniq(conversation_id) AS unique_conversations
          FROM ${database}.llm_usage_raw
          GROUP BY date, organization_id, provider_type, model_id, context_type, status
        `,
      });
      this.log("Created materialized view: llm_usage_daily_mv");
    }

    // =========================================================================
    // Materialized View: llm_context_analytics_mv (Context type distribution)
    // =========================================================================
    const contextViewExists = await this.viewExists(
      client,
      database,
      "llm_context_analytics_mv",
    );
    if (!contextViewExists) {
      await client.command({
        query: `
          CREATE MATERIALIZED VIEW ${database}.llm_context_analytics_mv
          ENGINE = SummingMergeTree()
          PARTITION BY toYYYYMM(date)
          ORDER BY (organization_id, context_type, date)
          TTL date + INTERVAL 365 DAY
          AS SELECT
            toDate(timestamp) AS date,
            organization_id,
            context_type,
            provider_type,
            model_id,

            -- Usage per context type
            count() AS request_count,
            sum(total_tokens) AS total_tokens,
            sum(total_cost_micros) AS total_cost_micros,
            sum(latency_ms) AS total_latency_ms,
            uniq(user_id) AS unique_users,
            uniq(conversation_id) AS unique_conversations
          FROM ${database}.llm_usage_raw
          GROUP BY date, organization_id, context_type, provider_type, model_id
        `,
      });
      this.log("Created materialized view: llm_context_analytics_mv");
    }

    this.log("LLM usage analytics tables and views created successfully");
  }

  async down(client: ClickHouseClient, database: string): Promise<void> {
    this.log("Dropping LLM usage analytics tables and views...");

    await this.dropViewIfExists(client, database, "llm_context_analytics_mv");
    await this.dropViewIfExists(client, database, "llm_usage_daily_mv");
    await this.dropViewIfExists(client, database, "llm_usage_hourly_mv");
    await this.dropTableIfExists(client, database, "llm_usage_raw");

    this.log("LLM usage analytics tables and views dropped");
  }
}

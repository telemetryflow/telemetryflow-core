import { ClickHouseClient } from "@clickhouse/client";
import { BaseClickHouseMigration } from "../../../../../../database/shared/BaseClickHouseMigration";

/**
 * LLM Usage Interval Views
 *
 * Adds 5m, 15m, and 6h materialized views to fill interval gaps
 * between existing hourly and daily views.
 */
export class AddLLMUsageIntervalViews1721000000011 extends BaseClickHouseMigration {
  name = "AddLLMUsageIntervalViews1721000000011";
  moduleName = "llm";

  async up(client: ClickHouseClient, database: string): Promise<void> {
    this.log("Creating llm_usage 5m, 15m, 6h interval views...");

    // 5-minute rollup
    const fiveMinViewExists = await this.viewExists(
      client,
      database,
      "llm_usage_5m_mv",
    );
    if (!fiveMinViewExists) {
      await client.command({
        query: `
          CREATE MATERIALIZED VIEW ${database}.llm_usage_5m_mv
          ENGINE = AggregatingMergeTree()
          PARTITION BY toYYYYMM(five_minutes)
          ORDER BY (organization_id, provider_type, model_id, five_minutes)
          TTL five_minutes + INTERVAL 90 DAY
          AS SELECT
            toStartOfFiveMinutes(timestamp) AS five_minutes,
            organization_id,
            provider_type,
            model_id,
            user_id,
            context_type,
            status,
            sumState(prompt_tokens) AS prompt_tokens_sum,
            sumState(completion_tokens) AS completion_tokens_sum,
            sumState(total_tokens) AS total_tokens_sum,
            sumState(total_cost_micros) AS total_cost_micros_sum,
            avgState(latency_ms) AS latency_ms_avg,
            maxState(latency_ms) AS latency_ms_max,
            minState(latency_ms) AS latency_ms_min,
            quantileState(0.95)(latency_ms) AS latency_ms_p95,
            countState() AS request_count,
            countIfState(status = 'error') AS error_count,
            countIfState(is_streaming = 1) AS streaming_count
          FROM ${database}.llm_usage_raw
          GROUP BY five_minutes, organization_id, provider_type, model_id, user_id, context_type, status
        `,
      });
      this.log("Created materialized view: llm_usage_5m_mv");
    }

    // 15-minute rollup
    const fifteenMinViewExists = await this.viewExists(
      client,
      database,
      "llm_usage_15m_mv",
    );
    if (!fifteenMinViewExists) {
      await client.command({
        query: `
          CREATE MATERIALIZED VIEW ${database}.llm_usage_15m_mv
          ENGINE = AggregatingMergeTree()
          PARTITION BY toYYYYMM(fifteen_minutes)
          ORDER BY (organization_id, provider_type, model_id, fifteen_minutes)
          TTL fifteen_minutes + INTERVAL 90 DAY
          AS SELECT
            toStartOfFifteenMinutes(timestamp) AS fifteen_minutes,
            organization_id,
            provider_type,
            model_id,
            user_id,
            context_type,
            status,
            sumState(prompt_tokens) AS prompt_tokens_sum,
            sumState(completion_tokens) AS completion_tokens_sum,
            sumState(total_tokens) AS total_tokens_sum,
            sumState(total_cost_micros) AS total_cost_micros_sum,
            avgState(latency_ms) AS latency_ms_avg,
            maxState(latency_ms) AS latency_ms_max,
            minState(latency_ms) AS latency_ms_min,
            quantileState(0.95)(latency_ms) AS latency_ms_p95,
            countState() AS request_count,
            countIfState(status = 'error') AS error_count,
            countIfState(is_streaming = 1) AS streaming_count
          FROM ${database}.llm_usage_raw
          GROUP BY fifteen_minutes, organization_id, provider_type, model_id, user_id, context_type, status
        `,
      });
      this.log("Created materialized view: llm_usage_15m_mv");
    }

    // 6-hour rollup
    const sixHourViewExists = await this.viewExists(
      client,
      database,
      "llm_usage_6h_mv",
    );
    if (!sixHourViewExists) {
      await client.command({
        query: `
          CREATE MATERIALIZED VIEW ${database}.llm_usage_6h_mv
          ENGINE = AggregatingMergeTree()
          PARTITION BY toYYYYMM(six_hours)
          ORDER BY (organization_id, provider_type, model_id, six_hours)
          TTL six_hours + INTERVAL 180 DAY
          AS SELECT
            toStartOfInterval(timestamp, INTERVAL 6 HOUR) AS six_hours,
            organization_id,
            provider_type,
            model_id,
            user_id,
            context_type,
            status,
            sumState(prompt_tokens) AS prompt_tokens_sum,
            sumState(completion_tokens) AS completion_tokens_sum,
            sumState(total_tokens) AS total_tokens_sum,
            sumState(total_cost_micros) AS total_cost_micros_sum,
            avgState(latency_ms) AS latency_ms_avg,
            maxState(latency_ms) AS latency_ms_max,
            minState(latency_ms) AS latency_ms_min,
            quantileState(0.95)(latency_ms) AS latency_ms_p95,
            countState() AS request_count,
            countIfState(status = 'error') AS error_count,
            countIfState(is_streaming = 1) AS streaming_count
          FROM ${database}.llm_usage_raw
          GROUP BY six_hours, organization_id, provider_type, model_id, user_id, context_type, status
        `,
      });
      this.log("Created materialized view: llm_usage_6h_mv");
    }

    this.log("LLM usage interval views created");
  }

  async down(client: ClickHouseClient, database: string): Promise<void> {
    this.log("Dropping llm_usage interval views...");
    await this.dropViewIfExists(client, database, "llm_usage_6h_mv");
    await this.dropViewIfExists(client, database, "llm_usage_15m_mv");
    await this.dropViewIfExists(client, database, "llm_usage_5m_mv");
    this.log("LLM usage interval views dropped");
  }
}

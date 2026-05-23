/**
 * LLM Seed (ClickHouse): Sample LLM Usage Analytics Data
 * Provides realistic sample data for development/testing
 */

import { ClickHouseClient } from "@clickhouse/client";
import { randomInt } from "crypto";
import { BaseClickHouseSeed } from "../../../../../../database/shared/BaseClickHouseSeed";

export class SeedLLMUsageAnalytics1721000000010 extends BaseClickHouseSeed {
  name = "SeedLLMUsageAnalytics1721000000010";
  moduleName = "llm";
  order = 1;
  dependencies: string[] = [];

  async run(client: ClickHouseClient, database: string): Promise<void> {
    this.log("Seeding LLM usage analytics data...");

    // Skip if data already exists
    const hasData = await this.hasRecords(client, database, "llm_usage_raw");
    if (hasData) {
      this.logSkip("LLM usage analytics data already exists, skipping");
      return;
    }

    // Resolve real IDs from PostgreSQL (synced with PG seeds)
    const pgIds = await this.resolvePostgresIds();
    const orgId = pgIds.organizationId;
    const workspaceId = pgIds.workspaceId;
    const tenantId = pgIds.tenantId;

    if (!orgId) {
      this.logError(
        "Cannot seed LLM data — default organization not found in PostgreSQL",
      );
      return;
    }

    // Resolve real user IDs from PostgreSQL
    const userIds = await this.resolveUserIds();

    const providerTypes = ["claude", "openai", "gemini", "deepseek", "qwen"];
    const models: Record<string, string[]> = {
      claude: ["claude-sonnet-4-5-20250514", "claude-haiku-3-5-20241022"],
      openai: ["gpt-4o", "gpt-4o-mini"],
      gemini: ["gemini-2.0-flash", "gemini-1.5-pro"],
      deepseek: ["deepseek-chat", "deepseek-reasoner"],
      qwen: ["qwen-plus", "qwen-turbo"],
    };

    const contextTypes = [
      "trace_analysis",
      "metric_anomaly",
      "log_investigation",
      "alert_triage",
      "incident_response",
      "dashboard_query",
      "general",
    ];

    const roles = ["user", "assistant"];
    const statuses = [
      "success",
      "success",
      "success",
      "success",
      "success",
      "success",
      "success",
      "success",
      "success",
      "error",
    ]; // 90% success

    // Cost per 1K tokens (in microdollars) by provider
    const costPer1KTokens: Record<
      string,
      { prompt: number; completion: number }
    > = {
      "claude-sonnet-4-5-20250514": { prompt: 3000, completion: 15000 },
      "claude-haiku-3-5-20241022": { prompt: 800, completion: 4000 },
      "gpt-4o": { prompt: 2500, completion: 10000 },
      "gpt-4o-mini": { prompt: 150, completion: 600 },
      "gemini-2.0-flash": { prompt: 100, completion: 400 },
      "gemini-1.5-pro": { prompt: 1250, completion: 5000 },
      "deepseek-chat": { prompt: 140, completion: 280 },
      "deepseek-reasoner": { prompt: 550, completion: 2190 },
      "qwen-plus": { prompt: 800, completion: 2000 },
      "qwen-turbo": { prompt: 300, completion: 600 },
    };

    const records: Record<string, unknown>[] = [];
    const now = new Date();

    // Generate 30 days of data
    for (let day = 0; day < 30; day++) {
      const date = new Date(now.getTime() - day * 24 * 60 * 60 * 1000);

      // 20-80 messages per day
      const messagesPerDay = 20 + randomInt(60);

      for (let msg = 0; msg < messagesPerDay; msg++) {
        const providerType = providerTypes[randomInt(providerTypes.length)];
        const modelList = models[providerType];
        const modelId = modelList[randomInt(modelList.length)];
        const userId = userIds[randomInt(userIds.length)];
        const contextType = contextTypes[randomInt(contextTypes.length)];
        const status = statuses[randomInt(statuses.length)];
        const role = roles[randomInt(roles.length)];
        const isStreaming = randomInt(10) > 2 ? 1 : 0;

        const promptTokens = 50 + randomInt(2000);
        const completionTokens = status === "error" ? 0 : 100 + randomInt(4000);
        const totalTokens = promptTokens + completionTokens;

        const costs = costPer1KTokens[modelId] || {
          prompt: 500,
          completion: 1500,
        };
        const promptCost = Math.floor((promptTokens / 1000) * costs.prompt);
        const completionCost = Math.floor(
          (completionTokens / 1000) * costs.completion,
        );

        const latency =
          status === "error" ? 100 + randomInt(500) : 200 + randomInt(5000);
        const ttft = Math.floor(latency * (0.1 + randomInt(3000) / 10000));

        // Randomize time within the day
        const timestamp = new Date(
          date.getTime() + randomInt(24 * 60 * 60 * 1000),
        );

        records.push({
          id: this.generateUUID(),
          timestamp: timestamp.toISOString().replace("T", " ").replace("Z", ""),
          message_id: this.generateUUID(),
          conversation_id: this.generateUUID(),
          provider_id: this.generateUUID(),
          provider_type: providerType,
          model_id: modelId,
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: totalTokens,
          latency_ms: latency,
          time_to_first_token_ms: ttft,
          prompt_cost_micros: promptCost,
          completion_cost_micros: completionCost,
          total_cost_micros: promptCost + completionCost,
          role,
          context_type: contextType,
          context_id: contextType !== "general" ? this.generateUUID() : "",
          is_streaming: isStreaming,
          status,
          error_type: status === "error" ? "rate_limit" : "",
          error_message:
            status === "error"
              ? "Rate limit exceeded. Please retry after 60 seconds."
              : "",
          organization_id: orgId,
          workspace_id: workspaceId,
          user_id: userId,
          tenant_id: tenantId,
          created_at: timestamp
            .toISOString()
            .replace("T", " ")
            .replace("Z", ""),
        });
      }
    }

    // Insert in batches of 500
    const batchSize = 500;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      await this.insertBatch(client, database, "llm_usage_raw", batch);
    }

    this.logSuccess(
      `Seeded ${records.length} LLM usage analytics records (30 days)`,
    );
  }

  private async resolveUserIds(): Promise<string[]> {
    const { DataSource } = await import("typeorm");
    const pgDataSource = new DataSource({
      type: "postgres",
      host: process.env.POSTGRES_HOST || "localhost",
      port: parseInt(process.env.POSTGRES_PORT || "5432"),
      username: process.env.POSTGRES_USERNAME || "postgres",
      password: process.env.POSTGRES_PASSWORD || "postgres",
      database: process.env.POSTGRES_DB || "telemetryflow_db",
    });

    try {
      await pgDataSource.initialize();
      const users = await pgDataSource.query(
        `SELECT user_id FROM users WHERE email LIKE '%@telemetryflow.id' ORDER BY email LIMIT 5`,
      );
      return users.map((u: any) => u.user_id);
    } catch {
      return [this.generateUUID()];
    } finally {
      if (pgDataSource.isInitialized) {
        await pgDataSource.destroy();
      }
    }
  }
}

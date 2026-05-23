/**
 * LLM Seed: Custom API Endpoint (1 model)
 */

import { DataSource } from "typeorm";
import { BaseSeed } from "../../../../../database/shared/BaseSeed";
import {
  type LLMProviderData,
  resolveAllLLMContexts,
  cleanupProviderType,
  insertProviders,
} from "./_shared/llm-seed-helpers";

const PROVIDER_TYPE = "custom";

const providers: LLMProviderData[] = [
  {
    name: "Custom API Endpoint",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "custom-CONFIGURE_ME",
    base_url: "http://localhost:8000/v1",
    model_id: "custom-model-v1",
    model_config: JSON.stringify({ maxTokens: 2048, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
];

export class CustomLLMSeed extends BaseSeed {
  name = "CustomLLMSeed";
  moduleName = "llm";
  order = 12;
  dependencies = ["DefaultUsersSeed", "OrganizationsSeed"];

  async run(dataSource: DataSource): Promise<void> {
    const contexts = await resolveAllLLMContexts(
      dataSource,
      this.findRecord.bind(this),
      this.logError.bind(this),
    );
    if (contexts.length === 0) return;

    let totalInserted = 0;
    for (const ctx of contexts) {
      await cleanupProviderType(dataSource, ctx.organizationId, PROVIDER_TYPE);
      totalInserted += await insertProviders(dataSource, ctx, providers);
    }
    this.logSuccess(`Custom API Endpoint: ${totalInserted} models seeded across ${contexts.length} organizations`);
  }
}

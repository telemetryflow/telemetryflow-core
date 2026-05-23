/**
 * LLM Seed: xAI Grok (10 models) — Latest: Grok 4.3
 * API: https://docs.x.ai — OpenAI-compatible at /v1
 */

import { DataSource } from "typeorm";
import { BaseSeed } from "../../../../../database/shared/BaseSeed";
import {
  type LLMProviderData,
  resolveAllLLMContexts,
  cleanupProviderType,
  insertProviders,
} from "./_shared/llm-seed-helpers";

const PROVIDER_TYPE = "grok";

const providers: LLMProviderData[] = [
  {
    name: "xAI Grok 4.3",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "xai-CONFIGURE_ME",
    base_url: "https://api.x.ai/v1",
    model_id: "grok-4.3",
    model_config: JSON.stringify({ maxTokens: 16384, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "xAI Grok 4.20 Multi-Agent",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "xai-CONFIGURE_ME",
    base_url: "https://api.x.ai/v1",
    model_id: "grok-4.20-multi-agent",
    model_config: JSON.stringify({ maxTokens: 16384, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "xAI Grok 4.20 Reasoning",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "xai-CONFIGURE_ME",
    base_url: "https://api.x.ai/v1",
    model_id: "grok-4.20-0309-reasoning",
    model_config: JSON.stringify({ maxTokens: 16384, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "xAI Grok 4.20 Non-Reasoning",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "xai-CONFIGURE_ME",
    base_url: "https://api.x.ai/v1",
    model_id: "grok-4.20-0309-non-reasoning",
    model_config: JSON.stringify({ maxTokens: 16384, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "xAI Grok 4.1 Fast Reasoning",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "xai-CONFIGURE_ME",
    base_url: "https://api.x.ai/v1",
    model_id: "grok-4-1-fast-reasoning",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "xAI Grok 4.1 Fast Non-Reasoning",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "xai-CONFIGURE_ME",
    base_url: "https://api.x.ai/v1",
    model_id: "grok-4-1-fast-non-reasoning",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "xAI Grok 3",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "xai-CONFIGURE_ME",
    base_url: "https://api.x.ai/v1",
    model_id: "grok-3",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "xAI Grok 3 Mini",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "xai-CONFIGURE_ME",
    base_url: "https://api.x.ai/v1",
    model_id: "grok-3-mini",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "xAI Grok 2",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "xai-CONFIGURE_ME",
    base_url: "https://api.x.ai/v1",
    model_id: "grok-2",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "xAI Grok 2 Mini",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "xai-CONFIGURE_ME",
    base_url: "https://api.x.ai/v1",
    model_id: "grok-2-mini",
    model_config: JSON.stringify({ maxTokens: 4096, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
];

export class GrokLLMSeed extends BaseSeed {
  name = "GrokLLMSeed";
  moduleName = "llm";
  order = 8;
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
    this.logSuccess(`xAI Grok: ${totalInserted} models seeded across ${contexts.length} organizations`);
  }
}

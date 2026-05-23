/**
 * LLM Seed: OpenAI ChatGPT (10 models) — Latest: GPT-5.5 Pro
 */

import { DataSource } from "typeorm";
import { BaseSeed } from "../../../../../database/shared/BaseSeed";
import {
  type LLMProviderData,
  resolveAllLLMContexts,
  cleanupProviderType,
  insertProviders,
} from "./_shared/llm-seed-helpers";

const PROVIDER_TYPE = "openai";

const providers: LLMProviderData[] = [
  {
    name: "OpenAI GPT-5.5 Pro",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-CONFIGURE_ME",
    base_url: "https://api.openai.com/v1",
    model_id: "gpt-5.5-pro",
    model_config: JSON.stringify({ maxTokens: 16384, temperature: 0.8 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "OpenAI GPT-5.5",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-CONFIGURE_ME",
    base_url: "https://api.openai.com/v1",
    model_id: "gpt-5.5",
    model_config: JSON.stringify({ maxTokens: 16384, temperature: 0.8 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "OpenAI GPT-5.4 Pro",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-CONFIGURE_ME",
    base_url: "https://api.openai.com/v1",
    model_id: "gpt-5.4-pro",
    model_config: JSON.stringify({ maxTokens: 16384, temperature: 0.8 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "OpenAI GPT-5.4",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-CONFIGURE_ME",
    base_url: "https://api.openai.com/v1",
    model_id: "gpt-5.4",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.8 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "OpenAI GPT-5.4 Mini",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-CONFIGURE_ME",
    base_url: "https://api.openai.com/v1",
    model_id: "gpt-5.4-mini",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.8 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "OpenAI GPT-5.4 Nano",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-CONFIGURE_ME",
    base_url: "https://api.openai.com/v1",
    model_id: "gpt-5.4-nano",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.8 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "OpenAI GPT-5.3 Chat",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-CONFIGURE_ME",
    base_url: "https://api.openai.com/v1",
    model_id: "gpt-5.3-chat",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.8 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "OpenAI GPT-5",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-CONFIGURE_ME",
    base_url: "https://api.openai.com/v1",
    model_id: "gpt-5",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.8 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "OpenAI GPT-4.1",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-CONFIGURE_ME",
    base_url: "https://api.openai.com/v1",
    model_id: "gpt-4.1",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.8 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "OpenAI o3",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-CONFIGURE_ME",
    base_url: "https://api.openai.com/v1",
    model_id: "o3",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.8 }),
    is_default: false,
    is_active: false,
  },
];

export class OpenAILLMSeed extends BaseSeed {
  name = "OpenAILLMSeed";
  moduleName = "llm";
  order = 3;
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
    this.logSuccess(`OpenAI ChatGPT: ${totalInserted} models seeded across ${contexts.length} organizations`);
  }
}

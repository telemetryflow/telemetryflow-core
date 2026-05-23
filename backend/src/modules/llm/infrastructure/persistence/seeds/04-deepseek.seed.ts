/**
 * LLM Seed: DeepSeek (10 models) — Latest: V4 Pro
 */

import { DataSource } from "typeorm";
import { BaseSeed } from "../../../../../database/shared/BaseSeed";
import {
  type LLMProviderData,
  resolveAllLLMContexts,
  cleanupProviderType,
  insertProviders,
} from "./_shared/llm-seed-helpers";

const PROVIDER_TYPE = "deepseek";

const providers: LLMProviderData[] = [
  {
    name: "DeepSeek V4 Pro",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-CONFIGURE_ME",
    base_url: "https://api.deepseek.com",
    model_id: "deepseek-v4-pro",
    model_config: JSON.stringify({ maxTokens: 16384, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "DeepSeek V4 Flash",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-CONFIGURE_ME",
    base_url: "https://api.deepseek.com",
    model_id: "deepseek-v4-flash",
    model_config: JSON.stringify({ maxTokens: 16384, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "DeepSeek V3.2 Speciale",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-CONFIGURE_ME",
    base_url: "https://api.deepseek.com",
    model_id: "deepseek-v3.2-speciale",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "DeepSeek Chat V3.2",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-CONFIGURE_ME",
    base_url: "https://api.deepseek.com",
    model_id: "deepseek-chat",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "DeepSeek V3.2",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-CONFIGURE_ME",
    base_url: "https://api.deepseek.com",
    model_id: "deepseek-v3.2",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "DeepSeek V3.2 Exp",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-CONFIGURE_ME",
    base_url: "https://api.deepseek.com",
    model_id: "deepseek-v3.2-exp",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "DeepSeek V3.1 Terminus",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-CONFIGURE_ME",
    base_url: "https://api.deepseek.com",
    model_id: "deepseek-v3.1-terminus",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "DeepSeek V3.1",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-CONFIGURE_ME",
    base_url: "https://api.deepseek.com",
    model_id: "deepseek-chat-v3.1",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "DeepSeek R1 0528",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-CONFIGURE_ME",
    base_url: "https://api.deepseek.com",
    model_id: "deepseek-r1-0528",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "DeepSeek R2 Reasoner",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-CONFIGURE_ME",
    base_url: "https://api.deepseek.com",
    model_id: "deepseek-reasoner",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
];

export class DeepSeekLLMSeed extends BaseSeed {
  name = "DeepSeekLLMSeed";
  moduleName = "llm";
  order = 4;
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
    this.logSuccess(`DeepSeek: ${totalInserted} models seeded across ${contexts.length} organizations`);
  }
}

/**
 * LLM Seed: Kimi / Moonshot AI (10 models) — Latest: K2.6
 * API: https://platform.kimi.ai — OpenAI-compatible at /v1
 */

import { DataSource } from "typeorm";
import { BaseSeed } from "../../../../../database/shared/BaseSeed";
import {
  type LLMProviderData,
  resolveAllLLMContexts,
  cleanupProviderType,
  insertProviders,
} from "./_shared/llm-seed-helpers";

const PROVIDER_TYPE = "kimi";

const providers: LLMProviderData[] = [
  {
    name: "Kimi K2.6",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-moonshot-CONFIGURE_ME",
    base_url: "https://api.moonshot.cn/v1",
    model_id: "kimi-k2.6",
    model_config: JSON.stringify({ maxTokens: 16384, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Kimi K2.5",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-moonshot-CONFIGURE_ME",
    base_url: "https://api.moonshot.cn/v1",
    model_id: "kimi-k2.5",
    model_config: JSON.stringify({ maxTokens: 16384, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Kimi K2 Thinking",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-moonshot-CONFIGURE_ME",
    base_url: "https://api.moonshot.cn/v1",
    model_id: "kimi-k2-thinking",
    model_config: JSON.stringify({ maxTokens: 16384, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Kimi K2 0905",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-moonshot-CONFIGURE_ME",
    base_url: "https://api.moonshot.cn/v1",
    model_id: "kimi-k2-0905",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Kimi K2 Turbo Preview",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-moonshot-CONFIGURE_ME",
    base_url: "https://api.moonshot.cn/v1",
    model_id: "kimi-k2-turbo-preview",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Kimi K2 0711",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-moonshot-CONFIGURE_ME",
    base_url: "https://api.moonshot.cn/v1",
    model_id: "kimi-k2",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Moonshot V1 128K",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-moonshot-CONFIGURE_ME",
    base_url: "https://api.moonshot.cn/v1",
    model_id: "moonshot-v1-128k",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Moonshot V1 32K",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-moonshot-CONFIGURE_ME",
    base_url: "https://api.moonshot.cn/v1",
    model_id: "moonshot-v1-32k",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Moonshot V1 8K",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-moonshot-CONFIGURE_ME",
    base_url: "https://api.moonshot.cn/v1",
    model_id: "moonshot-v1-8k",
    model_config: JSON.stringify({ maxTokens: 4096, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Moonshot V1 Auto",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-moonshot-CONFIGURE_ME",
    base_url: "https://api.moonshot.cn/v1",
    model_id: "moonshot-v1-auto",
    model_config: JSON.stringify({ maxTokens: 4096, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
];

export class KimiLLMSeed extends BaseSeed {
  name = "KimiLLMSeed";
  moduleName = "llm";
  order = 9;
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
    this.logSuccess(`Kimi / Moonshot: ${totalInserted} models seeded across ${contexts.length} organizations`);
  }
}

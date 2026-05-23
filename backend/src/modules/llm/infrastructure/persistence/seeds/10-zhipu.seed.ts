/**
 * LLM Seed: Zhipu GLM (10 models) — Latest: GLM-5.1
 * API: https://open.bigmodel.cn — OpenAI-compatible at /api/paas/v4
 */

import { DataSource } from "typeorm";
import { BaseSeed } from "../../../../../database/shared/BaseSeed";
import {
  type LLMProviderData,
  resolveAllLLMContexts,
  cleanupProviderType,
  insertProviders,
} from "./_shared/llm-seed-helpers";

const PROVIDER_TYPE = "zhipu";

const providers: LLMProviderData[] = [
  {
    name: "Zhipu GLM-5.1",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "zhipu-CONFIGURE_ME",
    base_url: "https://open.bigmodel.cn/api/paas/v4",
    model_id: "glm-5.1",
    model_config: JSON.stringify({ maxTokens: 16384, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Zhipu GLM-5 Turbo",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "zhipu-CONFIGURE_ME",
    base_url: "https://open.bigmodel.cn/api/paas/v4",
    model_id: "glm-5-turbo",
    model_config: JSON.stringify({ maxTokens: 16384, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Zhipu GLM-5",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "zhipu-CONFIGURE_ME",
    base_url: "https://open.bigmodel.cn/api/paas/v4",
    model_id: "glm-5",
    model_config: JSON.stringify({ maxTokens: 16384, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Zhipu GLM-4.7 Flash",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "zhipu-CONFIGURE_ME",
    base_url: "https://open.bigmodel.cn/api/paas/v4",
    model_id: "glm-4.7-flash",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Zhipu GLM-4.7",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "zhipu-CONFIGURE_ME",
    base_url: "https://open.bigmodel.cn/api/paas/v4",
    model_id: "glm-4.7",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Zhipu GLM-4.6",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "zhipu-CONFIGURE_ME",
    base_url: "https://open.bigmodel.cn/api/paas/v4",
    model_id: "glm-4.6",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Zhipu GLM-4.5",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "zhipu-CONFIGURE_ME",
    base_url: "https://open.bigmodel.cn/api/paas/v4",
    model_id: "glm-4.5",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Zhipu GLM-4.5 Air",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "zhipu-CONFIGURE_ME",
    base_url: "https://open.bigmodel.cn/api/paas/v4",
    model_id: "glm-4.5-air",
    model_config: JSON.stringify({ maxTokens: 4096, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Zhipu GLM-4 Flash",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "zhipu-CONFIGURE_ME",
    base_url: "https://open.bigmodel.cn/api/paas/v4",
    model_id: "glm-4-flash",
    model_config: JSON.stringify({ maxTokens: 4096, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Zhipu GLM-4",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "zhipu-CONFIGURE_ME",
    base_url: "https://open.bigmodel.cn/api/paas/v4",
    model_id: "glm-4",
    model_config: JSON.stringify({ maxTokens: 4096, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
];

export class ZhipuLLMSeed extends BaseSeed {
  name = "ZhipuLLMSeed";
  moduleName = "llm";
  order = 10;
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
    this.logSuccess(`Zhipu GLM: ${totalInserted} models seeded across ${contexts.length} organizations`);
  }
}

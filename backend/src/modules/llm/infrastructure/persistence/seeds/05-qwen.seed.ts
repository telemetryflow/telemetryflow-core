/**
 * LLM Seed: Alibaba Qwen (10 models) — Latest: Qwen3.6 Max Preview
 */

import { DataSource } from "typeorm";
import { BaseSeed } from "../../../../../database/shared/BaseSeed";
import {
  type LLMProviderData,
  resolveAllLLMContexts,
  cleanupProviderType,
  insertProviders,
} from "./_shared/llm-seed-helpers";

const PROVIDER_TYPE = "qwen";

const providers: LLMProviderData[] = [
  {
    name: "Alibaba Qwen3.6 Max Preview",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-CONFIGURE_ME",
    base_url: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model_id: "qwen3.6-max-preview",
    model_config: JSON.stringify({ maxTokens: 16384, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Alibaba Qwen3.6 Plus",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-CONFIGURE_ME",
    base_url: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model_id: "qwen3.6-plus",
    model_config: JSON.stringify({ maxTokens: 16384, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Alibaba Qwen3.6 Flash",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-CONFIGURE_ME",
    base_url: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model_id: "qwen3.6-flash",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Alibaba Qwen3.6 35B A3B",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-CONFIGURE_ME",
    base_url: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model_id: "qwen3.6-35b-a3b",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Alibaba Qwen3.6 27B",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-CONFIGURE_ME",
    base_url: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model_id: "qwen3.6-27b",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Alibaba Qwen3.5 Plus",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-CONFIGURE_ME",
    base_url: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model_id: "qwen3.5-plus",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Alibaba Qwen3.5 9B",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-CONFIGURE_ME",
    base_url: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model_id: "qwen3.5-9b",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Alibaba Qwen3.5 35B A3B",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-CONFIGURE_ME",
    base_url: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model_id: "qwen3.5-35b-a3b",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Alibaba Qwen3.5 27B",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-CONFIGURE_ME",
    base_url: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model_id: "qwen3.5-27b",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Alibaba Qwen3.5 122B A10B",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-CONFIGURE_ME",
    base_url: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model_id: "qwen3.5-122b-a10b",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
];

export class QwenLLMSeed extends BaseSeed {
  name = "QwenLLMSeed";
  moduleName = "llm";
  order = 5;
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
    this.logSuccess(`Alibaba Qwen: ${totalInserted} models seeded across ${contexts.length} organizations`);
  }
}

/**
 * LLM Seed: Xiaomi MiMo (10 models) — Latest: MiMo-V2.5 Pro
 * API: https://platform.xiaomimimo.com — OpenAI-compatible at /v1
 */

import { DataSource } from "typeorm";
import { BaseSeed } from "../../../../../database/shared/BaseSeed";
import {
  type LLMProviderData,
  resolveAllLLMContexts,
  cleanupProviderType,
  insertProviders,
} from "./_shared/llm-seed-helpers";

const PROVIDER_TYPE = "mimo";

const providers: LLMProviderData[] = [
  {
    name: "Xiaomi MiMo-V2.5 Pro",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "mimo-CONFIGURE_ME",
    base_url: "https://platform.xiaomimimo.com/v1",
    model_id: "mimo-v2.5-pro",
    model_config: JSON.stringify({ maxTokens: 16384, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Xiaomi MiMo-V2.5",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "mimo-CONFIGURE_ME",
    base_url: "https://platform.xiaomimimo.com/v1",
    model_id: "mimo-v2.5",
    model_config: JSON.stringify({ maxTokens: 16384, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Xiaomi MiMo-V2-Omni",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "mimo-CONFIGURE_ME",
    base_url: "https://platform.xiaomimimo.com/v1",
    model_id: "mimo-v2-omni",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Xiaomi MiMo-V2-Pro",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "mimo-CONFIGURE_ME",
    base_url: "https://platform.xiaomimimo.com/v1",
    model_id: "mimo-v2-pro",
    model_config: JSON.stringify({ maxTokens: 16384, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Xiaomi MiMo-V2-Flash",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "mimo-CONFIGURE_ME",
    base_url: "https://platform.xiaomimimo.com/v1",
    model_id: "mimo-v2-flash",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Xiaomi MiMo-V2-TTS",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "mimo-CONFIGURE_ME",
    base_url: "https://platform.xiaomimimo.com/v1",
    model_id: "mimo-v2-tts",
    model_config: JSON.stringify({ maxTokens: 4096, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Xiaomi MiMo-7B",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "mimo-CONFIGURE_ME",
    base_url: "https://platform.xiaomimimo.com/v1",
    model_id: "mimo-7b",
    model_config: JSON.stringify({ maxTokens: 4096, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Xiaomi MiMo-VL-7B",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "mimo-CONFIGURE_ME",
    base_url: "https://platform.xiaomimimo.com/v1",
    model_id: "mimo-vl-7b",
    model_config: JSON.stringify({ maxTokens: 4096, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Xiaomi MiMo-V2.5 Lite",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "mimo-CONFIGURE_ME",
    base_url: "https://platform.xiaomimimo.com/v1",
    model_id: "mimo-v2.5-lite",
    model_config: JSON.stringify({ maxTokens: 4096, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Xiaomi MiMo-7B-0321",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "mimo-CONFIGURE_ME",
    base_url: "https://platform.xiaomimimo.com/v1",
    model_id: "mimo-7b-0321",
    model_config: JSON.stringify({ maxTokens: 4096, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
];

export class MimoLLMSeed extends BaseSeed {
  name = "MimoLLMSeed";
  moduleName = "llm";
  order = 11;
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
    this.logSuccess(`Xiaomi MiMo: ${totalInserted} models seeded across ${contexts.length} organizations`);
  }
}

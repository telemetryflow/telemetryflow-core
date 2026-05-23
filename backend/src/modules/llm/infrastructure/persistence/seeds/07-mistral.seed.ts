/**
 * LLM Seed: Mistral AI (10 models) — Latest: Medium 3.5
 * API: https://docs.mistral.ai — OpenAI-compatible at /v1
 */

import { DataSource } from "typeorm";
import { BaseSeed } from "../../../../../database/shared/BaseSeed";
import {
  type LLMProviderData,
  resolveAllLLMContexts,
  cleanupProviderType,
  insertProviders,
} from "./_shared/llm-seed-helpers";

const PROVIDER_TYPE = "mistral";

const providers: LLMProviderData[] = [
  {
    name: "Mistral Medium 3.5",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-mistral-CONFIGURE_ME",
    base_url: "https://api.mistral.ai/v1",
    model_id: "mistral-medium-3-5",
    model_config: JSON.stringify({ maxTokens: 16384, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Mistral Small 4",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-mistral-CONFIGURE_ME",
    base_url: "https://api.mistral.ai/v1",
    model_id: "mistral-small-2603",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Mistral Large 3",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-mistral-CONFIGURE_ME",
    base_url: "https://api.mistral.ai/v1",
    model_id: "mistral-large-2512",
    model_config: JSON.stringify({ maxTokens: 16384, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Mistral Devstral 2",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-mistral-CONFIGURE_ME",
    base_url: "https://api.mistral.ai/v1",
    model_id: "devstral-2512",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Mistral Ministral 3 14B",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-mistral-CONFIGURE_ME",
    base_url: "https://api.mistral.ai/v1",
    model_id: "ministral-14b-2512",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Mistral Ministral 3 8B",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-mistral-CONFIGURE_ME",
    base_url: "https://api.mistral.ai/v1",
    model_id: "ministral-8b-2512",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Mistral Ministral 3 3B",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-mistral-CONFIGURE_ME",
    base_url: "https://api.mistral.ai/v1",
    model_id: "ministral-3b-2512",
    model_config: JSON.stringify({ maxTokens: 4096, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Mistral Medium 3.1",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-mistral-CONFIGURE_ME",
    base_url: "https://api.mistral.ai/v1",
    model_id: "mistral-medium-2508",
    model_config: JSON.stringify({ maxTokens: 16384, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Mistral Codestral 2508",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-mistral-CONFIGURE_ME",
    base_url: "https://api.mistral.ai/v1",
    model_id: "codestral-2508",
    model_config: JSON.stringify({ maxTokens: 16384, temperature: 0.5 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Mistral Large 2.1",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-mistral-CONFIGURE_ME",
    base_url: "https://api.mistral.ai/v1",
    model_id: "mistral-large-2411",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
];

export class MistralLLMSeed extends BaseSeed {
  name = "MistralLLMSeed";
  moduleName = "llm";
  order = 7;
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
    this.logSuccess(`Mistral AI: ${totalInserted} models seeded across ${contexts.length} organizations`);
  }
}

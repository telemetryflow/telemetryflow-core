/**
 * LLM Seed: Ollama (10 models) — Latest open-source for local deployment
 */

import { DataSource } from "typeorm";
import { BaseSeed } from "../../../../../database/shared/BaseSeed";
import {
  type LLMProviderData,
  resolveAllLLMContexts,
  cleanupProviderType,
  insertProviders,
} from "./_shared/llm-seed-helpers";

const PROVIDER_TYPE = "ollama";

const providers: LLMProviderData[] = [
  {
    name: "Ollama Qwen3.6 Flash",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "ollama-CONFIGURE_ME",
    base_url: "http://localhost:11434/v1",
    model_id: "qwen3.6:flash",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Ollama Qwen3.5 Plus",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "ollama-CONFIGURE_ME",
    base_url: "http://localhost:11434/v1",
    model_id: "qwen3.5:plus",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Ollama Llama 4 Maverick 17B",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "ollama-CONFIGURE_ME",
    base_url: "http://localhost:11434/v1",
    model_id: "llama4:maverick-17b",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Ollama Gemma 4 26B",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "ollama-CONFIGURE_ME",
    base_url: "http://localhost:11434/v1",
    model_id: "gemma4:26b",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Ollama Mistral Small 4",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "ollama-CONFIGURE_ME",
    base_url: "http://localhost:11434/v1",
    model_id: "mistral-small:2603",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Ollama Qwen3 32B",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "ollama-CONFIGURE_ME",
    base_url: "http://localhost:11434/v1",
    model_id: "qwen3:32b",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Ollama DeepSeek R1 70B",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "ollama-CONFIGURE_ME",
    base_url: "http://localhost:11434/v1",
    model_id: "deepseek-r1:70b",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Ollama Granite 4.1 8B",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "ollama-CONFIGURE_ME",
    base_url: "http://localhost:11434/v1",
    model_id: "granite:4.1-8b",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Ollama Llama 3.3 70B",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "ollama-CONFIGURE_ME",
    base_url: "http://localhost:11434/v1",
    model_id: "llama3.3:70b",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Ollama Phi-4 14B",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "ollama-CONFIGURE_ME",
    base_url: "http://localhost:11434/v1",
    model_id: "phi4:14b",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
];

export class OllamaLLMSeed extends BaseSeed {
  name = "OllamaLLMSeed";
  moduleName = "llm";
  order = 6;
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
    this.logSuccess(`Ollama: ${totalInserted} models seeded across ${contexts.length} organizations`);
  }
}

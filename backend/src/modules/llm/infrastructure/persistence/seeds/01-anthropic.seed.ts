/**
 * LLM Seed: Anthropic Claude (11 models) — Latest: Opus 4.7
 */

import { DataSource } from "typeorm";
import { BaseSeed } from "../../../../../database/shared/BaseSeed";
import {
  type LLMProviderData,
  resolveAllLLMContexts,
  cleanupProviderType,
  insertProviders,
} from "./_shared/llm-seed-helpers";

const PROVIDER_TYPE = "anthropic";

const providers: LLMProviderData[] = [
  {
    name: "Anthropic Claude Opus 4.7",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-ant-CONFIGURE_ME",
    base_url: "https://api.anthropic.com",
    model_id: "claude-opus-4-7",
    model_config: JSON.stringify({ maxTokens: 16384, topP: 0, samplingMode: "top_p" }),
    is_default: true,
    is_active: true,
  },
  {
    name: "Anthropic Claude Opus 4.7 Fast",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-ant-CONFIGURE_ME",
    base_url: "https://api.anthropic.com",
    model_id: "claude-opus-4-7-fast",
    model_config: JSON.stringify({ maxTokens: 16384, topP: 0, samplingMode: "top_p" }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Anthropic Claude Opus 4.6",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-ant-CONFIGURE_ME",
    base_url: "https://api.anthropic.com",
    model_id: "claude-opus-4-6",
    model_config: JSON.stringify({ maxTokens: 8192, topP: 0, samplingMode: "top_p" }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Anthropic Claude Opus 4.6 Fast",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-ant-CONFIGURE_ME",
    base_url: "https://api.anthropic.com",
    model_id: "claude-opus-4-6-fast",
    model_config: JSON.stringify({ maxTokens: 8192, topP: 0, samplingMode: "top_p" }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Anthropic Claude Sonnet 4.6",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-ant-CONFIGURE_ME",
    base_url: "https://api.anthropic.com",
    model_id: "claude-sonnet-4-6",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Anthropic Claude Opus 4.5",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-ant-CONFIGURE_ME",
    base_url: "https://api.anthropic.com",
    model_id: "claude-opus-4-5",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Anthropic Claude Sonnet 4.5",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-ant-CONFIGURE_ME",
    base_url: "https://api.anthropic.com",
    model_id: "claude-sonnet-4-5-20250929",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Anthropic Claude Haiku 4.5",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-ant-CONFIGURE_ME",
    base_url: "https://api.anthropic.com",
    model_id: "claude-haiku-4-5",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Anthropic Claude Haiku 4.5 (Oct 2025)",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-ant-CONFIGURE_ME",
    base_url: "https://api.anthropic.com",
    model_id: "claude-haiku-4-5-20251001",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Anthropic Claude Sonnet 4",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-ant-CONFIGURE_ME",
    base_url: "https://api.anthropic.com",
    model_id: "claude-sonnet-4-20250514",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Anthropic Claude Mythos Preview",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "sk-ant-CONFIGURE_ME",
    base_url: "https://api.anthropic.com",
    model_id: "claude-mythos-preview",
    model_config: JSON.stringify({ maxTokens: 16384, topP: 0, samplingMode: "top_p" }),
    is_default: false,
    is_active: false,
  },
];

export class AnthropicLLMSeed extends BaseSeed {
  name = "AnthropicLLMSeed";
  moduleName = "llm";
  order = 1;
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
    this.logSuccess(`Anthropic Claude: ${totalInserted} models seeded across ${contexts.length} organizations`);
  }
}

/**
 * LLM Seed: Google Gemini (10 models) — Latest: Gemini 3.5 Flash
 */

import { DataSource } from "typeorm";
import { BaseSeed } from "../../../../../database/shared/BaseSeed";
import {
  type LLMProviderData,
  resolveAllLLMContexts,
  cleanupProviderType,
  insertProviders,
} from "./_shared/llm-seed-helpers";

const PROVIDER_TYPE = "google";

const providers: LLMProviderData[] = [
  {
    name: "Google Gemini 3.5 Flash",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "AI-CONFIGURE_ME",
    base_url: "https://generativelanguage.googleapis.com",
    model_id: "gemini-3.5-flash",
    model_config: JSON.stringify({ maxTokens: 65536, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Google Gemini 3.1 Flash Lite",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "AI-CONFIGURE_ME",
    base_url: "https://generativelanguage.googleapis.com",
    model_id: "gemini-3.1-flash-lite",
    model_config: JSON.stringify({ maxTokens: 65536, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Google Gemini 3.1 Pro Preview",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "AI-CONFIGURE_ME",
    base_url: "https://generativelanguage.googleapis.com",
    model_id: "gemini-3.1-pro-preview",
    model_config: JSON.stringify({ maxTokens: 65536, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Google Gemini 3 Flash Preview",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "AI-CONFIGURE_ME",
    base_url: "https://generativelanguage.googleapis.com",
    model_id: "gemini-3-flash-preview",
    model_config: JSON.stringify({ maxTokens: 65536, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Google Gemini 2.5 Pro",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "AI-CONFIGURE_ME",
    base_url: "https://generativelanguage.googleapis.com",
    model_id: "gemini-2.5-pro",
    model_config: JSON.stringify({ maxTokens: 65536, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Google Gemini 2.5 Flash",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "AI-CONFIGURE_ME",
    base_url: "https://generativelanguage.googleapis.com",
    model_id: "gemini-2.5-flash",
    model_config: JSON.stringify({ maxTokens: 65536, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Google Gemini 2.5 Flash-Lite",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "AI-CONFIGURE_ME",
    base_url: "https://generativelanguage.googleapis.com",
    model_id: "gemini-2.5-flash-lite",
    model_config: JSON.stringify({ maxTokens: 65536, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Google Gemini 2.0 Flash",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "AI-CONFIGURE_ME",
    base_url: "https://generativelanguage.googleapis.com",
    model_id: "gemini-2.0-flash",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Google Gemini 2.0 Flash Lite",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "AI-CONFIGURE_ME",
    base_url: "https://generativelanguage.googleapis.com",
    model_id: "gemini-2.0-flash-lite",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
  {
    name: "Google Gemini 1.5 Pro",
    provider_type: PROVIDER_TYPE,
    api_key_placeholder: "AI-CONFIGURE_ME",
    base_url: "https://generativelanguage.googleapis.com",
    model_id: "gemini-1.5-pro",
    model_config: JSON.stringify({ maxTokens: 8192, temperature: 0.7 }),
    is_default: false,
    is_active: false,
  },
];

export class GoogleLLMSeed extends BaseSeed {
  name = "GoogleLLMSeed";
  moduleName = "llm";
  order = 2;
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
    this.logSuccess(`Google Gemini: ${totalInserted} models seeded across ${contexts.length} organizations`);
  }
}

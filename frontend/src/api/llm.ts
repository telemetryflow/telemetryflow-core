/**
 * LLM API client
 * TASK-11: Frontend API client for BYOLLM AI Insights module
 */

import { collectorClient } from "./collector";
import { iamClient } from "./iam";
import { config } from "@/config";
import { getMockProviders } from "./llm-config";

// Import mock data from separate files
import { METRICS_MOCK_DATA, METRICS_CONVERSATION_TITLES } from "./llm-metrics";
import { LOGS_MOCK_DATA, LOGS_CONVERSATION_TITLES } from "./llm-logs";
import { TRACES_MOCK_DATA, TRACES_CONVERSATION_TITLES } from "./llm-traces";
import {
  ALERTS_MOCK_DATA,
  ALERTS_CONVERSATION_TITLES,
  ALERT_RULES_MOCK_DATA,
  ALERT_RULES_CONVERSATION_TITLES,
} from "./llm-alerts";
import {
  KUBERNETES_MOCK_DATA,
  KUBERNETES_CONVERSATION_TITLES,
  KUBERNETES_API_SERVER_MOCK_DATA,
  KUBERNETES_API_SERVER_CONVERSATION_TITLES,
  KUBERNETES_COREDNS_MOCK_DATA,
  KUBERNETES_COREDNS_CONVERSATION_TITLES,
} from "./llm-kubernetes";
import { AGENTS_MOCK_DATA, AGENTS_CONVERSATION_TITLES } from "./llm-agents";
import { UPTIME_MOCK_DATA, UPTIME_CONVERSATION_TITLES } from "./llm-uptime";
import {
  STATUS_PAGE_MOCK_DATA,
  STATUS_PAGE_CONVERSATION_TITLES,
} from "./llm-status-page";
import {
  CORRELATIONS_MOCK_DATA,
  CORRELATIONS_CONVERSATION_TITLES,
} from "./llm-correlations";
import {
  DASHBOARD_MOCK_DATA,
  DASHBOARD_CONVERSATION_TITLES,
} from "./llm-dashboard";
import {
  EXEMPLARS_MOCK_DATA,
  EXEMPLARS_CONVERSATION_TITLES,
} from "./llm-exemplars";
import {
  INFRA_CPU_MOCK_DATA,
  INFRA_CPU_CONVERSATION_TITLES,
  INFRA_MEMORY_MOCK_DATA,
  INFRA_MEMORY_CONVERSATION_TITLES,
  INFRA_STORAGE_MOCK_DATA,
  INFRA_STORAGE_CONVERSATION_TITLES,
  INFRA_NETWORK_MOCK_DATA,
  INFRA_NETWORK_CONVERSATION_TITLES,
  INFRA_OVERVIEW_CONVERSATION_TITLES,
} from "./llm-infra";
import {
  SERVICE_MAP_MOCK_DATA,
  SERVICE_MAP_CONVERSATION_TITLES,
} from "./llm-service-map";
import {
  NETWORK_MAP_MOCK_DATA,
  NETWORK_MAP_CONVERSATION_TITLES,
} from "./llm-network-map";
import { REPORTS_MOCK_DATA, REPORTS_CONVERSATION_TITLES } from "./llm-reports";
import { IAM_MOCK_DATA, IAM_CONVERSATION_TITLES } from "./llm-iam";
import { TENANCY_MOCK_DATA, TENANCY_CONVERSATION_TITLES } from "./llm-tenancy";
import { AUDIT_MOCK_DATA, AUDIT_CONVERSATION_TITLES } from "./llm-audit";
import {
  RETENTION_MOCK_DATA,
  RETENTION_CONVERSATION_TITLES,
} from "./llm-retention";
import {
  SUBSCRIPTION_MOCK_DATA,
  SUBSCRIPTION_CONVERSATION_TITLES,
} from "./llm-subscription";
import {
  API_KEYS_MOCK_DATA,
  API_KEYS_CONVERSATION_TITLES,
} from "./llm-api-keys";
import {
  NOTIFICATIONS_MOCK_DATA,
  NOTIFICATIONS_CONVERSATION_TITLES,
} from "./llm-notifications";
// IAM sub-feature contexts
import {
  IAM_USERS_MOCK_DATA,
  IAM_USERS_CONVERSATION_TITLES,
  IAM_ROLES_MOCK_DATA,
  IAM_ROLES_CONVERSATION_TITLES,
  IAM_PERMISSIONS_MOCK_DATA,
  IAM_PERMISSIONS_CONVERSATION_TITLES,
  IAM_MATRIX_MOCK_DATA,
  IAM_MATRIX_CONVERSATION_TITLES,
  IAM_ASSIGNMENTS_MOCK_DATA,
  IAM_ASSIGNMENTS_CONVERSATION_TITLES,
} from "./llm-iam";
// Tenancy sub-feature contexts
import {
  TENANCY_REGIONS_MOCK_DATA,
  TENANCY_REGIONS_CONVERSATION_TITLES,
  TENANCY_ORGANIZATIONS_MOCK_DATA,
  TENANCY_ORGANIZATIONS_CONVERSATION_TITLES,
  TENANCY_WORKSPACES_MOCK_DATA,
  TENANCY_WORKSPACES_CONVERSATION_TITLES,
  TENANCY_TENANTS_MOCK_DATA,
  TENANCY_TENANTS_CONVERSATION_TITLES,
} from "./llm-tenancy";
// System sub-feature contexts
import {
  SYSTEM_SETUP_MOCK_DATA,
  SYSTEM_SETUP_CONVERSATION_TITLES,
  SYSTEM_CHANNELS_MOCK_DATA,
  SYSTEM_CHANNELS_CONVERSATION_TITLES,
  AI_ASSISTANT_MOCK_DATA,
  AI_ASSISTANT_CONVERSATION_TITLES,
  DATA_MASKING_MOCK_DATA,
  DATA_MASKING_CONVERSATION_TITLES,
} from "./llm-system";
// Account sub-feature contexts
import {
  ACCOUNT_PROFILE_MOCK_DATA,
  ACCOUNT_PROFILE_CONVERSATION_TITLES,
  ACCOUNT_SECURITY_MOCK_DATA,
  ACCOUNT_SECURITY_CONVERSATION_TITLES,
  ACCOUNT_SESSIONS_MOCK_DATA,
  ACCOUNT_SESSIONS_CONVERSATION_TITLES,
  ACCOUNT_NOTIFICATIONS_MOCK_DATA,
  ACCOUNT_NOTIFICATIONS_CONVERSATION_TITLES,
  ACCOUNT_PREFERENCES_MOCK_DATA,
  ACCOUNT_PREFERENCES_CONVERSATION_TITLES,
  ACCOUNT_ORGANIZATION_MOCK_DATA,
  ACCOUNT_ORGANIZATION_CONVERSATION_TITLES,
} from "./llm-account";

import type {
  LLMProvider,
  Conversation,
  ConversationDetail,
  ChatMessage,
  Insight,
  CreateLLMProviderRequest,
  UpdateLLMProviderRequest,
  SendMessageRequest,
  SendMessageResponse,
  GenerateInsightRequest,
  ListLLMProvidersQuery,
  ListConversationsQuery,
  PaginatedProviders,
  PaginatedConversations,
  ValidateApiKeyResponse,
  ContextType,
  InsightType,
  StreamEvent,
} from "@/types/llm";

// ==================== ENDPOINTS ====================

export const LLM_ENDPOINTS = {
  // Providers
  PROVIDERS: "/api/v2/llm/providers",
  PROVIDER: (id: string) => `/api/v2/llm/providers/${id}`,
  PROVIDER_DEFAULT: "/api/v2/llm/providers/default",
  PROVIDER_SET_DEFAULT: (id: string) =>
    `/api/v2/llm/providers/${id}/set-default`,
  PROVIDER_VALIDATE: (id: string) => `/api/v2/llm/providers/${id}/validate`,
  // Chat
  CHAT_MESSAGE: "/api/v2/llm/chat/message",
  CHAT_STREAM: "/api/v2/llm/chat/stream",
  CONVERSATIONS: "/api/v2/llm/chat/conversations",
  CONVERSATION: (id: string) => `/api/v2/llm/chat/conversations/${id}`,
  CONVERSATION_ARCHIVE: (id: string) =>
    `/api/v2/llm/chat/conversations/${id}/archive`,
  // Insights
  INSIGHTS_GENERATE: "/api/v2/llm/insights/generate",
  INSIGHTS_CHRONOLOGY: "/api/v2/llm/insights/chronology",
  INSIGHTS_ROOT_CAUSE: "/api/v2/llm/insights/root-cause",
  INSIGHTS_PREDICT: "/api/v2/llm/insights/predict",
  INSIGHTS_RECOMMEND: "/api/v2/llm/insights/recommend",
  INSIGHTS_PATTERNS: "/api/v2/llm/insights/patterns",
} as const;

// ==================== MOCK DATA ====================

function generateMockProviders(): LLMProvider[] {
  const org = "org-devopscorner";
  const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString();
  const now = new Date().toISOString();
  const inactive = { isActive: false as const, usageCount: 0, lastUsedAt: undefined };

  return [
    // ─── Anthropic Claude (6 models) ───
    { id: "provider-claude-opus-47", organizationId: org, name: "Anthropic Claude Opus 4.7", providerType: "anthropic", apiKeyHint: "sk-an...E_ME", modelId: "claude-opus-4-7", baseUrl: "https://api.anthropic.com", modelConfig: { temperature: 0.7, maxTokens: 16384, topP: 1 }, isDefault: true, isActive: true, usageCount: 1250, lastUsedAt: now, createdAt: d(30), updatedAt: now },
    { id: "provider-claude-opus-46", organizationId: org, name: "Anthropic Claude Opus 4.6", providerType: "anthropic", apiKeyHint: "sk-an...E_ME", modelId: "claude-opus-4-6", baseUrl: "https://api.anthropic.com", modelConfig: { temperature: 0.7, maxTokens: 8192, topP: 1 }, isDefault: false, ...inactive, createdAt: d(30), updatedAt: d(30) },
    { id: "provider-claude-sonnet-46", organizationId: org, name: "Anthropic Claude Sonnet 4.6", providerType: "anthropic", apiKeyHint: "sk-an...E_ME", modelId: "claude-sonnet-4-6", baseUrl: "https://api.anthropic.com", modelConfig: { temperature: 0.7, maxTokens: 8192, topP: 1 }, isDefault: false, ...inactive, createdAt: d(30), updatedAt: d(30) },
    { id: "provider-claude-sonnet-45", organizationId: org, name: "Anthropic Claude Sonnet 4.5", providerType: "anthropic", apiKeyHint: "sk-an...E_ME", modelId: "claude-sonnet-4-5-20250929", baseUrl: "https://api.anthropic.com", modelConfig: { temperature: 0.7, maxTokens: 8192, topP: 1 }, isDefault: false, ...inactive, createdAt: d(30), updatedAt: d(30) },
    { id: "provider-claude-haiku-45", organizationId: org, name: "Anthropic Claude Haiku 4.5", providerType: "anthropic", apiKeyHint: "sk-an...E_ME", modelId: "claude-haiku-4-5", baseUrl: "https://api.anthropic.com", modelConfig: { temperature: 0.7, maxTokens: 8192, topP: 1 }, isDefault: false, ...inactive, createdAt: d(30), updatedAt: d(30) },
    { id: "provider-claude-haiku-45-dated", organizationId: org, name: "Anthropic Claude Haiku 4.5 (Oct 2025)", providerType: "anthropic", apiKeyHint: "sk-an...E_ME", modelId: "claude-haiku-4-5-20251001", baseUrl: "https://api.anthropic.com", modelConfig: { temperature: 0.7, maxTokens: 8192, topP: 1 }, isDefault: false, ...inactive, createdAt: d(30), updatedAt: d(30) },
    // ─── Google Gemini (6 models) ───
    { id: "provider-gemini-3", organizationId: org, name: "Google Gemini 3", providerType: "google", apiKeyHint: "AI-CO...E_ME", modelId: "gemini-3", baseUrl: "https://generativelanguage.googleapis.com", modelConfig: { temperature: 0.7, maxTokens: 65536, topP: 1 }, isDefault: false, isActive: true, usageCount: 156, lastUsedAt: d(5), createdAt: d(45), updatedAt: d(10) },
    { id: "provider-gemini-25-pro", organizationId: org, name: "Google Gemini 2.5 Pro", providerType: "google", apiKeyHint: "AI-CO...E_ME", modelId: "gemini-2.5-pro", baseUrl: "https://generativelanguage.googleapis.com", modelConfig: { temperature: 0.7, maxTokens: 65536, topP: 1 }, isDefault: false, ...inactive, createdAt: d(45), updatedAt: d(45) },
    { id: "provider-gemini-25-flash", organizationId: org, name: "Google Gemini 2.5 Flash", providerType: "google", apiKeyHint: "AI-CO...E_ME", modelId: "gemini-2.5-flash", baseUrl: "https://generativelanguage.googleapis.com", modelConfig: { temperature: 0.7, maxTokens: 65536, topP: 1 }, isDefault: false, ...inactive, createdAt: d(45), updatedAt: d(45) },
    { id: "provider-gemini-25-flash-lite", organizationId: org, name: "Google Gemini 2.5 Flash-Lite", providerType: "google", apiKeyHint: "AI-CO...E_ME", modelId: "gemini-2.5-flash-lite", baseUrl: "https://generativelanguage.googleapis.com", modelConfig: { temperature: 0.7, maxTokens: 65536, topP: 1 }, isDefault: false, ...inactive, createdAt: d(45), updatedAt: d(45) },
    { id: "provider-gemini-20-flash", organizationId: org, name: "Google Gemini 2.0 Flash", providerType: "google", apiKeyHint: "AI-CO...E_ME", modelId: "gemini-2.0-flash", baseUrl: "https://generativelanguage.googleapis.com", modelConfig: { temperature: 0.7, maxTokens: 8192, topP: 1 }, isDefault: false, ...inactive, createdAt: d(45), updatedAt: d(45) },
    { id: "provider-gemini-15-pro", organizationId: org, name: "Google Gemini 1.5 Pro", providerType: "google", apiKeyHint: "AI-CO...E_ME", modelId: "gemini-1.5-pro", baseUrl: "https://generativelanguage.googleapis.com", modelConfig: { temperature: 0.7, maxTokens: 8192, topP: 1 }, isDefault: false, ...inactive, createdAt: d(45), updatedAt: d(45) },
    // ─── OpenAI ChatGPT (6 models) ───
    { id: "provider-openai-gpt55", organizationId: org, name: "OpenAI GPT-5.5", providerType: "openai", apiKeyHint: "sk-CO...E_ME", modelId: "gpt-5.5", baseUrl: "https://api.openai.com/v1", modelConfig: { temperature: 0.8, maxTokens: 16384, topP: 1 }, isDefault: false, isActive: true, usageCount: 340, lastUsedAt: d(2), createdAt: d(60), updatedAt: d(7) },
    { id: "provider-openai-gpt5", organizationId: org, name: "OpenAI GPT-5", providerType: "openai", apiKeyHint: "sk-CO...E_ME", modelId: "gpt-5", baseUrl: "https://api.openai.com/v1", modelConfig: { temperature: 0.8, maxTokens: 8192, topP: 1 }, isDefault: false, ...inactive, createdAt: d(60), updatedAt: d(60) },
    { id: "provider-openai-gpt41", organizationId: org, name: "OpenAI GPT-4.1", providerType: "openai", apiKeyHint: "sk-CO...E_ME", modelId: "gpt-4.1", baseUrl: "https://api.openai.com/v1", modelConfig: { temperature: 0.8, maxTokens: 8192, topP: 1 }, isDefault: false, ...inactive, createdAt: d(60), updatedAt: d(60) },
    { id: "provider-openai-gpt41-mini", organizationId: org, name: "OpenAI GPT-4.1 Mini", providerType: "openai", apiKeyHint: "sk-CO...E_ME", modelId: "gpt-4.1-mini", baseUrl: "https://api.openai.com/v1", modelConfig: { temperature: 0.8, maxTokens: 8192, topP: 1 }, isDefault: false, ...inactive, createdAt: d(60), updatedAt: d(60) },
    { id: "provider-openai-o3", organizationId: org, name: "OpenAI o3", providerType: "openai", apiKeyHint: "sk-CO...E_ME", modelId: "o3", baseUrl: "https://api.openai.com/v1", modelConfig: { temperature: 0.8, maxTokens: 8192, topP: 1 }, isDefault: false, ...inactive, createdAt: d(60), updatedAt: d(60) },
    { id: "provider-openai-gpt4o", organizationId: org, name: "OpenAI GPT-4o", providerType: "openai", apiKeyHint: "sk-CO...E_ME", modelId: "gpt-4o", baseUrl: "https://api.openai.com/v1", modelConfig: { temperature: 0.8, maxTokens: 4096, topP: 1 }, isDefault: false, ...inactive, createdAt: d(60), updatedAt: d(60) },
    // ─── DeepSeek (6 models) ───
    { id: "provider-deepseek-v4-pro", organizationId: org, name: "DeepSeek V4 Pro", providerType: "deepseek", apiKeyHint: "sk-CO...E_ME", modelId: "deepseek-v4-pro", baseUrl: "https://api.deepseek.com", modelConfig: { temperature: 0.7, maxTokens: 8192, topP: 1 }, isDefault: false, isActive: true, usageCount: 23, lastUsedAt: d(3), createdAt: d(20), updatedAt: d(3) },
    { id: "provider-deepseek-chat", organizationId: org, name: "DeepSeek Chat V3.2", providerType: "deepseek", apiKeyHint: "sk-CO...E_ME", modelId: "deepseek-chat", baseUrl: "https://api.deepseek.com", modelConfig: { temperature: 0.7, maxTokens: 8192, topP: 1 }, isDefault: false, ...inactive, createdAt: d(20), updatedAt: d(20) },
    { id: "provider-deepseek-v32", organizationId: org, name: "DeepSeek V3.2", providerType: "deepseek", apiKeyHint: "sk-CO...E_ME", modelId: "deepseek-v3.2", baseUrl: "https://api.deepseek.com", modelConfig: { temperature: 0.7, maxTokens: 8192, topP: 1 }, isDefault: false, ...inactive, createdAt: d(20), updatedAt: d(20) },
    { id: "provider-deepseek-v31", organizationId: org, name: "DeepSeek V3.1", providerType: "deepseek", apiKeyHint: "sk-CO...E_ME", modelId: "deepseek-v3.1", baseUrl: "https://api.deepseek.com", modelConfig: { temperature: 0.7, maxTokens: 8192, topP: 1 }, isDefault: false, ...inactive, createdAt: d(20), updatedAt: d(20) },
    { id: "provider-deepseek-reasoner", organizationId: org, name: "DeepSeek R2 Reasoner", providerType: "deepseek", apiKeyHint: "sk-CO...E_ME", modelId: "deepseek-reasoner", baseUrl: "https://api.deepseek.com", modelConfig: { temperature: 0.7, maxTokens: 8192, topP: 1 }, isDefault: false, ...inactive, createdAt: d(20), updatedAt: d(20) },
    { id: "provider-deepseek-ocr-2", organizationId: org, name: "DeepSeek OCR 2", providerType: "deepseek", apiKeyHint: "sk-CO...E_ME", modelId: "deepseek-ocr-2", baseUrl: "https://api.deepseek.com", modelConfig: { temperature: 0.3, maxTokens: 4096, topP: 1 }, isDefault: false, ...inactive, createdAt: d(20), updatedAt: d(20) },
    // ─── Alibaba Qwen (6 models) ───
    { id: "provider-qwen3-max", organizationId: org, name: "Alibaba Qwen3 Max", providerType: "qwen", apiKeyHint: "sk-CO...E_ME", modelId: "qwen3-max", baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", modelConfig: { temperature: 0.7, maxTokens: 8192, topP: 1 }, isDefault: false, isActive: true, usageCount: 45, lastUsedAt: d(14), createdAt: d(15), updatedAt: d(14) },
    { id: "provider-qwen3-235b", organizationId: org, name: "Alibaba Qwen3 235B A22B", providerType: "qwen", apiKeyHint: "sk-CO...E_ME", modelId: "qwen3-235b-a22b", baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", modelConfig: { temperature: 0.7, maxTokens: 8192, topP: 1 }, isDefault: false, ...inactive, createdAt: d(15), updatedAt: d(15) },
    { id: "provider-qwen3-32b", organizationId: org, name: "Alibaba Qwen3 32B", providerType: "qwen", apiKeyHint: "sk-CO...E_ME", modelId: "qwen3-32b", baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", modelConfig: { temperature: 0.7, maxTokens: 8192, topP: 1 }, isDefault: false, ...inactive, createdAt: d(15), updatedAt: d(15) },
    { id: "provider-qwen-max", organizationId: org, name: "Alibaba Qwen Max", providerType: "qwen", apiKeyHint: "sk-CO...E_ME", modelId: "qwen-max", baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", modelConfig: { temperature: 0.7, maxTokens: 8192, topP: 1 }, isDefault: false, ...inactive, createdAt: d(15), updatedAt: d(15) },
    { id: "provider-qwen25-72b", organizationId: org, name: "Alibaba Qwen 2.5 72B Instruct", providerType: "qwen", apiKeyHint: "sk-CO...E_ME", modelId: "qwen2.5-72b-instruct", baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", modelConfig: { temperature: 0.7, maxTokens: 8192, topP: 1 }, isDefault: false, ...inactive, createdAt: d(15), updatedAt: d(15) },
    { id: "provider-qwen25-32b", organizationId: org, name: "Alibaba Qwen 2.5 32B Instruct", providerType: "qwen", apiKeyHint: "sk-CO...E_ME", modelId: "qwen2.5-32b-instruct", baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", modelConfig: { temperature: 0.7, maxTokens: 8192, topP: 1 }, isDefault: false, ...inactive, createdAt: d(15), updatedAt: d(15) },
    // ─── Ollama (6 models — local deployment) ───
    { id: "provider-ollama-llama4-maverick", organizationId: org, name: "Ollama Llama 4 Maverick 17B", providerType: "ollama", apiKeyHint: "ollam...E_ME", modelId: "llama4:maverick-17b", baseUrl: "http://localhost:11434/v1", modelConfig: { temperature: 0.7, maxTokens: 8192, topP: 1 }, isDefault: false, isActive: true, usageCount: 12, lastUsedAt: d(3), createdAt: d(10), updatedAt: d(3) },
    { id: "provider-ollama-gemma4-26b", organizationId: org, name: "Ollama Gemma 4 26B", providerType: "ollama", apiKeyHint: "ollam...E_ME", modelId: "gemma4:26b", baseUrl: "http://localhost:11434/v1", modelConfig: { temperature: 0.7, maxTokens: 8192, topP: 1 }, isDefault: false, ...inactive, createdAt: d(10), updatedAt: d(10) },
    { id: "provider-ollama-qwen3-32b", organizationId: org, name: "Ollama Qwen3 32B", providerType: "ollama", apiKeyHint: "ollam...E_ME", modelId: "qwen3:32b", baseUrl: "http://localhost:11434/v1", modelConfig: { temperature: 0.7, maxTokens: 8192, topP: 1 }, isDefault: false, ...inactive, createdAt: d(10), updatedAt: d(10) },
    { id: "provider-ollama-deepseek-r1-70b", organizationId: org, name: "Ollama DeepSeek R1 70B", providerType: "ollama", apiKeyHint: "ollam...E_ME", modelId: "deepseek-r1:70b", baseUrl: "http://localhost:11434/v1", modelConfig: { temperature: 0.7, maxTokens: 8192, topP: 1 }, isDefault: false, ...inactive, createdAt: d(10), updatedAt: d(10) },
    { id: "provider-ollama-llama33-70b", organizationId: org, name: "Ollama Llama 3.3 70B", providerType: "ollama", apiKeyHint: "ollam...E_ME", modelId: "llama3.3:70b", baseUrl: "http://localhost:11434/v1", modelConfig: { temperature: 0.7, maxTokens: 8192, topP: 1 }, isDefault: false, ...inactive, createdAt: d(10), updatedAt: d(10) },
    { id: "provider-ollama-phi4-14b", organizationId: org, name: "Ollama Phi-4 14B", providerType: "ollama", apiKeyHint: "ollam...E_ME", modelId: "phi4:14b", baseUrl: "http://localhost:11434/v1", modelConfig: { temperature: 0.7, maxTokens: 8192, topP: 1 }, isDefault: false, ...inactive, createdAt: d(10), updatedAt: d(10) },
    // ─── Mistral AI (6 models) ───
    { id: "provider-mistral-medium-31", organizationId: org, name: "Mistral Medium 3.1", providerType: "mistral", apiKeyHint: "sk-MI...E_ME", modelId: "mistral-medium-2508", baseUrl: "https://api.mistral.ai/v1", modelConfig: { temperature: 0.7, maxTokens: 16384, topP: 1 }, isDefault: false, ...inactive, createdAt: d(25), updatedAt: d(25) },
    { id: "provider-mistral-large-21", organizationId: org, name: "Mistral Large 2.1", providerType: "mistral", apiKeyHint: "sk-MI...E_ME", modelId: "mistral-large-2411", baseUrl: "https://api.mistral.ai/v1", modelConfig: { temperature: 0.7, maxTokens: 8192, topP: 1 }, isDefault: false, ...inactive, createdAt: d(25), updatedAt: d(25) },
    { id: "provider-mistral-small-32", organizationId: org, name: "Mistral Small 3.2", providerType: "mistral", apiKeyHint: "sk-MI...E_ME", modelId: "mistral-small-2506", baseUrl: "https://api.mistral.ai/v1", modelConfig: { temperature: 0.7, maxTokens: 8192, topP: 1 }, isDefault: false, ...inactive, createdAt: d(25), updatedAt: d(25) },
    { id: "provider-mistral-codestral", organizationId: org, name: "Mistral Codestral 2508", providerType: "mistral", apiKeyHint: "sk-MI...E_ME", modelId: "codestral-2508", baseUrl: "https://api.mistral.ai/v1", modelConfig: { temperature: 0.5, maxTokens: 16384, topP: 1 }, isDefault: false, ...inactive, createdAt: d(25), updatedAt: d(25) },
    { id: "provider-mistral-devstral", organizationId: org, name: "Mistral Devstral Small 1.1", providerType: "mistral", apiKeyHint: "sk-MI...E_ME", modelId: "devstral-small-2507", baseUrl: "https://api.mistral.ai/v1", modelConfig: { temperature: 0.7, maxTokens: 8192, topP: 1 }, isDefault: false, ...inactive, createdAt: d(25), updatedAt: d(25) },
    { id: "provider-mistral-ministral-3b", organizationId: org, name: "Mistral Ministral 3B", providerType: "mistral", apiKeyHint: "sk-MI...E_ME", modelId: "ministral-3b-2410", baseUrl: "https://api.mistral.ai/v1", modelConfig: { temperature: 0.7, maxTokens: 4096, topP: 1 }, isDefault: false, ...inactive, createdAt: d(25), updatedAt: d(25) },
    // ─── xAI Grok (6 models) ───
    { id: "provider-grok-420-reasoning", organizationId: org, name: "xAI Grok 4.20 Reasoning", providerType: "grok", apiKeyHint: "xai-...E_ME", modelId: "grok-4.20-0309-reasoning", baseUrl: "https://api.x.ai/v1", modelConfig: { temperature: 0.7, maxTokens: 16384, topP: 1 }, isDefault: false, ...inactive, createdAt: d(15), updatedAt: d(15) },
    { id: "provider-grok-420-non-reasoning", organizationId: org, name: "xAI Grok 4.20 Non-Reasoning", providerType: "grok", apiKeyHint: "xai-...E_ME", modelId: "grok-4.20-0309-non-reasoning", baseUrl: "https://api.x.ai/v1", modelConfig: { temperature: 0.7, maxTokens: 16384, topP: 1 }, isDefault: false, ...inactive, createdAt: d(15), updatedAt: d(15) },
    { id: "provider-grok-420-multi-agent", organizationId: org, name: "xAI Grok 4.20 Multi-Agent", providerType: "grok", apiKeyHint: "xai-...E_ME", modelId: "grok-4.20-multi-agent-0309", baseUrl: "https://api.x.ai/v1", modelConfig: { temperature: 0.7, maxTokens: 16384, topP: 1 }, isDefault: false, ...inactive, createdAt: d(15), updatedAt: d(15) },
    { id: "provider-grok-41-fast-reasoning", organizationId: org, name: "xAI Grok 4.1 Fast Reasoning", providerType: "grok", apiKeyHint: "xai-...E_ME", modelId: "grok-4-1-fast-reasoning", baseUrl: "https://api.x.ai/v1", modelConfig: { temperature: 0.7, maxTokens: 8192, topP: 1 }, isDefault: false, ...inactive, createdAt: d(15), updatedAt: d(15) },
    { id: "provider-grok-41-fast-non-reasoning", organizationId: org, name: "xAI Grok 4.1 Fast Non-Reasoning", providerType: "grok", apiKeyHint: "xai-...E_ME", modelId: "grok-4-1-fast-non-reasoning", baseUrl: "https://api.x.ai/v1", modelConfig: { temperature: 0.7, maxTokens: 8192, topP: 1 }, isDefault: false, ...inactive, createdAt: d(15), updatedAt: d(15) },
    { id: "provider-grok-3", organizationId: org, name: "xAI Grok 3", providerType: "grok", apiKeyHint: "xai-...E_ME", modelId: "grok-3", baseUrl: "https://api.x.ai/v1", modelConfig: { temperature: 0.7, maxTokens: 8192, topP: 1 }, isDefault: false, ...inactive, createdAt: d(15), updatedAt: d(15) },
    // ─── Kimi / Moonshot AI (6 models) ───
    { id: "provider-kimi-k26", organizationId: org, name: "Kimi K2.6", providerType: "kimi", apiKeyHint: "sk-KI...E_ME", modelId: "kimi-k2.6", baseUrl: "https://api.moonshot.cn/v1", modelConfig: { temperature: 0.7, maxTokens: 16384, topP: 1 }, isDefault: false, ...inactive, createdAt: d(20), updatedAt: d(20) },
    { id: "provider-kimi-k25", organizationId: org, name: "Kimi K2.5", providerType: "kimi", apiKeyHint: "sk-KI...E_ME", modelId: "kimi-k2.5", baseUrl: "https://api.moonshot.cn/v1", modelConfig: { temperature: 0.7, maxTokens: 16384, topP: 1 }, isDefault: false, ...inactive, createdAt: d(20), updatedAt: d(20) },
    { id: "provider-kimi-v1-128k", organizationId: org, name: "Moonshot V1 128K", providerType: "kimi", apiKeyHint: "sk-KI...E_ME", modelId: "moonshot-v1-128k", baseUrl: "https://api.moonshot.cn/v1", modelConfig: { temperature: 0.7, maxTokens: 8192, topP: 1 }, isDefault: false, ...inactive, createdAt: d(20), updatedAt: d(20) },
    { id: "provider-kimi-v1-32k", organizationId: org, name: "Moonshot V1 32K", providerType: "kimi", apiKeyHint: "sk-KI...E_ME", modelId: "moonshot-v1-32k", baseUrl: "https://api.moonshot.cn/v1", modelConfig: { temperature: 0.7, maxTokens: 8192, topP: 1 }, isDefault: false, ...inactive, createdAt: d(20), updatedAt: d(20) },
    { id: "provider-kimi-k2-thinking", organizationId: org, name: "Kimi K2 Thinking", providerType: "kimi", apiKeyHint: "sk-KI...E_ME", modelId: "kimi-k2-thinking", baseUrl: "https://api.moonshot.cn/v1", modelConfig: { temperature: 0.7, maxTokens: 8192, topP: 1 }, isDefault: false, ...inactive, createdAt: d(20), updatedAt: d(20) },
    { id: "provider-kimi-k2-turbo-preview", organizationId: org, name: "Kimi K2 Turbo Preview", providerType: "kimi", apiKeyHint: "sk-KI...E_ME", modelId: "kimi-k2-turbo-preview", baseUrl: "https://api.moonshot.cn/v1", modelConfig: { temperature: 0.7, maxTokens: 8192, topP: 1 }, isDefault: false, ...inactive, createdAt: d(20), updatedAt: d(20) },
    // ─── Zhipu GLM (6 models) ───
    { id: "provider-zhipu-glm-51", organizationId: org, name: "Zhipu GLM-5.1", providerType: "zhipu", apiKeyHint: "glm-...E_ME", modelId: "glm-5.1", baseUrl: "https://open.bigmodel.cn/api/paas/v4", modelConfig: { temperature: 0.7, maxTokens: 16384, topP: 1 }, isDefault: false, ...inactive, createdAt: d(18), updatedAt: d(18) },
    { id: "provider-zhipu-glm-5", organizationId: org, name: "Zhipu GLM-5", providerType: "zhipu", apiKeyHint: "glm-...E_ME", modelId: "glm-5", baseUrl: "https://open.bigmodel.cn/api/paas/v4", modelConfig: { temperature: 0.7, maxTokens: 16384, topP: 1 }, isDefault: false, ...inactive, createdAt: d(18), updatedAt: d(18) },
    { id: "provider-zhipu-glm-47", organizationId: org, name: "Zhipu GLM-4.7", providerType: "zhipu", apiKeyHint: "glm-...E_ME", modelId: "glm-4.7", baseUrl: "https://open.bigmodel.cn/api/paas/v4", modelConfig: { temperature: 0.7, maxTokens: 8192, topP: 1 }, isDefault: false, ...inactive, createdAt: d(18), updatedAt: d(18) },
    { id: "provider-zhipu-glm-45", organizationId: org, name: "Zhipu GLM-4.5", providerType: "zhipu", apiKeyHint: "glm-...E_ME", modelId: "glm-4.5", baseUrl: "https://open.bigmodel.cn/api/paas/v4", modelConfig: { temperature: 0.7, maxTokens: 8192, topP: 1 }, isDefault: false, ...inactive, createdAt: d(18), updatedAt: d(18) },
    { id: "provider-zhipu-glm-45-air", organizationId: org, name: "Zhipu GLM-4.5 Air", providerType: "zhipu", apiKeyHint: "glm-...E_ME", modelId: "glm-4.5-air", baseUrl: "https://open.bigmodel.cn/api/paas/v4", modelConfig: { temperature: 0.7, maxTokens: 4096, topP: 1 }, isDefault: false, ...inactive, createdAt: d(18), updatedAt: d(18) },
    { id: "provider-zhipu-glm-4-flash", organizationId: org, name: "Zhipu GLM-4 Flash", providerType: "zhipu", apiKeyHint: "glm-...E_ME", modelId: "glm-4-flash", baseUrl: "https://open.bigmodel.cn/api/paas/v4", modelConfig: { temperature: 0.7, maxTokens: 4096, topP: 1 }, isDefault: false, ...inactive, createdAt: d(18), updatedAt: d(18) },
    // ─── Xiaomi MiMo (6 models) ───
    { id: "provider-mimo-v2-pro", organizationId: org, name: "Xiaomi MiMo-V2-Pro", providerType: "mimo", apiKeyHint: "mimo-...E_ME", modelId: "mimo-v2-pro", baseUrl: "https://platform.xiaomimimo.com/v1", modelConfig: { temperature: 0.7, maxTokens: 16384, topP: 1 }, isDefault: false, ...inactive, createdAt: d(12), updatedAt: d(12) },
    { id: "provider-mimo-v2-flash", organizationId: org, name: "Xiaomi MiMo-V2-Flash", providerType: "mimo", apiKeyHint: "mimo-...E_ME", modelId: "mimo-v2-flash", baseUrl: "https://platform.xiaomimimo.com/v1", modelConfig: { temperature: 0.7, maxTokens: 8192, topP: 1 }, isDefault: false, ...inactive, createdAt: d(12), updatedAt: d(12) },
    { id: "provider-mimo-v2-omni", organizationId: org, name: "Xiaomi MiMo-V2-Omni", providerType: "mimo", apiKeyHint: "mimo-...E_ME", modelId: "mimo-v2-omni", baseUrl: "https://platform.xiaomimimo.com/v1", modelConfig: { temperature: 0.7, maxTokens: 8192, topP: 1 }, isDefault: false, ...inactive, createdAt: d(12), updatedAt: d(12) },
    { id: "provider-mimo-v2-tts", organizationId: org, name: "Xiaomi MiMo-V2-TTS", providerType: "mimo", apiKeyHint: "mimo-...E_ME", modelId: "mimo-v2-tts", baseUrl: "https://platform.xiaomimimo.com/v1", modelConfig: { temperature: 0.7, maxTokens: 4096, topP: 1 }, isDefault: false, ...inactive, createdAt: d(12), updatedAt: d(12) },
    { id: "provider-mimo-7b", organizationId: org, name: "Xiaomi MiMo-7B", providerType: "mimo", apiKeyHint: "mimo-...E_ME", modelId: "mimo-7b", baseUrl: "https://platform.xiaomimimo.com/v1", modelConfig: { temperature: 0.7, maxTokens: 4096, topP: 1 }, isDefault: false, ...inactive, createdAt: d(12), updatedAt: d(12) },
    { id: "provider-mimo-vl-7b", organizationId: org, name: "Xiaomi MiMo-VL-7B", providerType: "mimo", apiKeyHint: "mimo-...E_ME", modelId: "mimo-vl-7b", baseUrl: "https://platform.xiaomimimo.com/v1", modelConfig: { temperature: 0.7, maxTokens: 4096, topP: 1 }, isDefault: false, ...inactive, createdAt: d(12), updatedAt: d(12) },
    // ─── Custom API Endpoint (1 model) ───
    { id: "provider-custom-1", organizationId: org, name: "Custom API Endpoint", providerType: "custom", apiKeyHint: "custo...E_ME", modelId: "custom-model-v1", baseUrl: "http://localhost:8000/v1", modelConfig: { temperature: 0.7, maxTokens: 2048, topP: 1 }, isDefault: false, ...inactive, createdAt: d(10), updatedAt: d(10) },
  ];
}

// Context-specific conversation titles for realistic mock data
const MOCK_CONVERSATION_TITLES: Record<ContextType, string[]> = {
  metrics: METRICS_CONVERSATION_TITLES,
  logs: LOGS_CONVERSATION_TITLES,
  traces: TRACES_CONVERSATION_TITLES,
  alerts: ALERTS_CONVERSATION_TITLES,
  "alert-rules": ALERT_RULES_CONVERSATION_TITLES,
  "infra-overview": INFRA_OVERVIEW_CONVERSATION_TITLES,
  "kubernetes-overview": KUBERNETES_CONVERSATION_TITLES,
  "kubernetes-clusters": KUBERNETES_CONVERSATION_TITLES,
  "kubernetes-namespaces": KUBERNETES_CONVERSATION_TITLES,
  "kubernetes-nodes": KUBERNETES_CONVERSATION_TITLES,
  "kubernetes-pods": KUBERNETES_CONVERSATION_TITLES,
  "kubernetes-deployments": KUBERNETES_CONVERSATION_TITLES,
  "kubernetes-pv": KUBERNETES_CONVERSATION_TITLES,
  "kubernetes-api-server": KUBERNETES_API_SERVER_CONVERSATION_TITLES,
  "kubernetes-coredns": KUBERNETES_COREDNS_CONVERSATION_TITLES,
  agents: AGENTS_CONVERSATION_TITLES,
  uptime: UPTIME_CONVERSATION_TITLES,
  "status-page": STATUS_PAGE_CONVERSATION_TITLES,
  correlations: CORRELATIONS_CONVERSATION_TITLES,
  dashboard: DASHBOARD_CONVERSATION_TITLES,
  exemplars: EXEMPLARS_CONVERSATION_TITLES,
  "infra-cpu": INFRA_CPU_CONVERSATION_TITLES,
  "infra-memory": INFRA_MEMORY_CONVERSATION_TITLES,
  "infra-storage": INFRA_STORAGE_CONVERSATION_TITLES,
  "infra-network": INFRA_NETWORK_CONVERSATION_TITLES,
  "service-map": SERVICE_MAP_CONVERSATION_TITLES,
  "network-map": NETWORK_MAP_CONVERSATION_TITLES,
  reports: REPORTS_CONVERSATION_TITLES,
  iam: IAM_CONVERSATION_TITLES,
  "iam-users": IAM_USERS_CONVERSATION_TITLES,
  "iam-roles": IAM_ROLES_CONVERSATION_TITLES,
  "iam-permissions": IAM_PERMISSIONS_CONVERSATION_TITLES,
  "iam-matrix": IAM_MATRIX_CONVERSATION_TITLES,
  "iam-assignments": IAM_ASSIGNMENTS_CONVERSATION_TITLES,
  tenancy: TENANCY_CONVERSATION_TITLES,
  "tenancy-regions": TENANCY_REGIONS_CONVERSATION_TITLES,
  "tenancy-organizations": TENANCY_ORGANIZATIONS_CONVERSATION_TITLES,
  "tenancy-workspaces": TENANCY_WORKSPACES_CONVERSATION_TITLES,
  "tenancy-tenants": TENANCY_TENANTS_CONVERSATION_TITLES,
  "data-masking": DATA_MASKING_CONVERSATION_TITLES,
  audit: AUDIT_CONVERSATION_TITLES,
  retention: RETENTION_CONVERSATION_TITLES,
  subscription: SUBSCRIPTION_CONVERSATION_TITLES,
  "api-keys": API_KEYS_CONVERSATION_TITLES,
  notifications: NOTIFICATIONS_CONVERSATION_TITLES,
  "system-setup": SYSTEM_SETUP_CONVERSATION_TITLES,
  "system-channels": SYSTEM_CHANNELS_CONVERSATION_TITLES,
  "ai-assistant": AI_ASSISTANT_CONVERSATION_TITLES,
  "account-profile": ACCOUNT_PROFILE_CONVERSATION_TITLES,
  "account-security": ACCOUNT_SECURITY_CONVERSATION_TITLES,
  "account-sessions": ACCOUNT_SESSIONS_CONVERSATION_TITLES,
  "account-notifications": ACCOUNT_NOTIFICATIONS_CONVERSATION_TITLES,
  "account-preferences": ACCOUNT_PREFERENCES_CONVERSATION_TITLES,
  "account-organization": ACCOUNT_ORGANIZATION_CONVERSATION_TITLES,
  "anomaly-detection": [
    "Why is CPU spiking on node-01?",
    "Explain the anomaly correlation between CPU and HTTP latency",
    "What caused the memory pressure anomaly?",
    "Show me anomaly trends for the last 24 hours",
  ],
  "corrective-maintenance": [
    "Generate a remediation plan for the current CPU anomaly",
    "What actions are in the latest proposed remediation plan?",
    "Why was the last remediation plan rejected?",
    "Show me completed remediations in the last 7 days",
  ],
  "predictive-maintenance": [
    "Which resources have the highest failure probability?",
    "Explain the health score trend for node-01 over the last 7 days",
    "What is the predicted time to failure for disk storage?",
    "Show me all high-risk predictions for the next 24 hours",
  ],
  "db-monitoring-inventory": [
    "How many database instances are currently offline?",
    "Show me the fleet composition by database type",
    "Which instances are in a degraded state?",
    "What is the distribution of database providers?",
  ],
  "cost-optimization": [
    "What is my total cloud spend this month?",
    "Which services are costing the most?",
    "Show me cost trends across providers",
    "What optimization recommendations are available?",
    "How are my budgets performing?",
  ],
  "db-monitoring-timescaledb": [
    "Show me hypertable compression status",
    "What continuous aggregates are defined?",
    "How are scheduled jobs performing?",
    "What is the TimescaleDB disk usage?",
  ],
  "db-monitoring-aurora": [
    "What is the topology of my Aurora cluster?",
    "Show me Performance Insights for the writer instance",
    "How is the Serverless v2 ACU scaling?",
    "What is the global database replication lag?",
    "Show me recent cluster events",
  ],
  "db-monitoring-mysql": [
    "What is the InnoDB buffer pool hit ratio?",
    "Show me slow queries for the last hour",
    "How is replication lag on my read replicas?",
    "What are the top queries by execution time?",
    "Show me connection pool utilization",
  ],
};

function generateMockConversations(): Conversation[] {
  const conversations: Conversation[] = [];
  const contexts: ContextType[] = Object.keys(
    MOCK_CONVERSATION_TITLES,
  ) as ContextType[];
  let globalIndex = 0;

  contexts.forEach((context) => {
    const titles = MOCK_CONVERSATION_TITLES[context];
    titles.forEach((title, titleIndex) => {
      conversations.push({
        id: `conv-${context}-${titleIndex + 1}`,
        title,
        contextType: context,
        messageCount: Math.floor(Math.random() * 15) + 3,
        totalTokensUsed: Math.floor(Math.random() * 8000) + 1000,
        lastMessageAt: new Date(
          Date.now() - globalIndex * 2 * 60 * 60 * 1000,
        ).toISOString(),
        isArchived: globalIndex > 40, // Archive older conversations
        createdAt: new Date(
          Date.now() - globalIndex * 8 * 60 * 60 * 1000,
        ).toISOString(),
      });
      globalIndex++;
    });
  });

  return conversations.sort(
    (a, b) =>
      new Date(b.lastMessageAt || 0).getTime() -
      new Date(a.lastMessageAt || 0).getTime(),
  );
}

// Context-aware mock AI responses using imported mock data files
// This combines all mock data from separate files for cross-context question matching
const MOCK_AI_RESPONSES: Record<
  ContextType,
  { question: string; answer: string }[]
> = {
  metrics: METRICS_MOCK_DATA,
  logs: LOGS_MOCK_DATA,
  traces: TRACES_MOCK_DATA,
  alerts: ALERTS_MOCK_DATA,
  "alert-rules": ALERT_RULES_MOCK_DATA,
  "infra-overview": [
    ...INFRA_CPU_MOCK_DATA,
    ...INFRA_MEMORY_MOCK_DATA,
    ...INFRA_STORAGE_MOCK_DATA,
    ...INFRA_NETWORK_MOCK_DATA,
  ],
  "kubernetes-overview": KUBERNETES_MOCK_DATA,
  "kubernetes-clusters": KUBERNETES_MOCK_DATA,
  "kubernetes-namespaces": KUBERNETES_MOCK_DATA,
  "kubernetes-nodes": KUBERNETES_MOCK_DATA,
  "kubernetes-pods": KUBERNETES_MOCK_DATA,
  "kubernetes-deployments": KUBERNETES_MOCK_DATA,
  "kubernetes-pv": KUBERNETES_MOCK_DATA,
  "kubernetes-api-server": KUBERNETES_API_SERVER_MOCK_DATA,
  "kubernetes-coredns": KUBERNETES_COREDNS_MOCK_DATA,
  agents: AGENTS_MOCK_DATA,
  uptime: UPTIME_MOCK_DATA,
  "status-page": STATUS_PAGE_MOCK_DATA,
  correlations: CORRELATIONS_MOCK_DATA,
  dashboard: DASHBOARD_MOCK_DATA,
  exemplars: EXEMPLARS_MOCK_DATA,
  "infra-cpu": INFRA_CPU_MOCK_DATA,
  "infra-memory": INFRA_MEMORY_MOCK_DATA,
  "infra-storage": INFRA_STORAGE_MOCK_DATA,
  "infra-network": INFRA_NETWORK_MOCK_DATA,
  "service-map": SERVICE_MAP_MOCK_DATA,
  "network-map": NETWORK_MAP_MOCK_DATA,
  reports: REPORTS_MOCK_DATA,
  iam: IAM_MOCK_DATA,
  tenancy: TENANCY_MOCK_DATA,
  "data-masking": DATA_MASKING_MOCK_DATA,
  audit: AUDIT_MOCK_DATA,
  retention: RETENTION_MOCK_DATA,
  subscription: SUBSCRIPTION_MOCK_DATA,
  "api-keys": API_KEYS_MOCK_DATA,
  notifications: NOTIFICATIONS_MOCK_DATA,
  // IAM sub-feature contexts
  "iam-users": IAM_USERS_MOCK_DATA,
  "iam-roles": IAM_ROLES_MOCK_DATA,
  "iam-permissions": IAM_PERMISSIONS_MOCK_DATA,
  "iam-matrix": IAM_MATRIX_MOCK_DATA,
  "iam-assignments": IAM_ASSIGNMENTS_MOCK_DATA,
  // Tenancy sub-feature contexts
  "tenancy-regions": TENANCY_REGIONS_MOCK_DATA,
  "tenancy-organizations": TENANCY_ORGANIZATIONS_MOCK_DATA,
  "tenancy-workspaces": TENANCY_WORKSPACES_MOCK_DATA,
  "tenancy-tenants": TENANCY_TENANTS_MOCK_DATA,
  // System sub-feature contexts
  "system-setup": SYSTEM_SETUP_MOCK_DATA,
  "system-channels": SYSTEM_CHANNELS_MOCK_DATA,
  "ai-assistant": AI_ASSISTANT_MOCK_DATA,
  // Account sub-feature contexts
  "account-profile": ACCOUNT_PROFILE_MOCK_DATA,
  "account-security": ACCOUNT_SECURITY_MOCK_DATA,
  "account-sessions": ACCOUNT_SESSIONS_MOCK_DATA,
  "account-notifications": ACCOUNT_NOTIFICATIONS_MOCK_DATA,
  "account-preferences": ACCOUNT_PREFERENCES_MOCK_DATA,
  "account-organization": ACCOUNT_ORGANIZATION_MOCK_DATA,
  "anomaly-detection": [
    {
      question: "Why is CPU spiking on node-01?",
      answer: "The CPU spike on node-01 (z-score 5.2σ) is correlated with elevated HTTP latency on api-gateway. Likely causes: GC pressure from memory leak or a traffic surge from a downstream service. Recommend scaling api-gateway horizontally and inspecting GC logs.",
    },
    {
      question: "Explain the anomaly correlation between CPU and HTTP latency",
      answer: "Anomaly event ev-001 (CPU spike, 0.94 observed vs 0.42 expected) and ev-002 (HTTP latency 1250ms vs 180ms expected) share a 2-hour temporal overlap. The statistical correlation suggests a common root cause — likely a resource-intensive request pattern hitting both the compute layer and the API tier simultaneously.",
    },
    {
      question: "What caused the memory pressure anomaly?",
      answer: "Memory utilization exceeded 3σ baseline. Common causes include heap fragmentation, unbounded in-memory caches, or a recent deployment introducing a memory leak. Check JVM/Go runtime heap metrics and recent deployment changelogs.",
    },
    {
      question: "Show me anomaly trends for the last 24 hours",
      answer: "In the last 24 hours: 8 anomaly events detected — 3 critical (CPU, HTTP latency), 5 warning (memory, log error volume). Average anomaly score: 0.71. Peak anomaly window was between 02:00–04:00 UTC. CPU utilization anomalies account for 38% of all events.",
    },
  ],
  "corrective-maintenance": [
    {
      question: "Generate a remediation plan for the current CPU anomaly",
      answer: "I've analyzed the CPU anomaly on api-gateway. Proposed plan: (1) Investigate: review GC logs and heap metrics on the affected pod — estimated 15 min. (2) Manual: scale api-gateway from 2 to 4 replicas — low risk. (3) Investigate: audit recent deployments for memory regressions. Risk level: medium. Shall I submit this plan for approval?",
    },
    {
      question: "What actions are in the latest proposed remediation plan?",
      answer: "The latest plan 'Address CPU Spike on api-gateway' (proposed 2h ago, risk: medium) contains 3 actions: [1] Investigate GC logs (pending), [2] Scale api-gateway horizontally (pending), [3] Review recent deployment diff (pending). No actions have been executed yet — the plan is awaiting approval.",
    },
    {
      question: "Why was the last remediation plan rejected?",
      answer: "Plan 'Restart payment-service pods' was rejected by admin@org.com with comment: 'Restarting payment pods during business hours is high risk. Schedule for maintenance window at 02:00 UTC.' Rejection recorded at 14:32 UTC. You can create a revised plan with a deferred execution schedule.",
    },
    {
      question: "Show me completed remediations in the last 7 days",
      answer: "7 remediation plans completed in the last 7 days: 5 successful (71%), 2 failed. Average of 2.8 actions per plan. Most common trigger: anomaly-detected (5 plans). Failed plans were for memory exhaustion on legacy-worker nodes — root cause traced to a misconfigured memory limit in the Helm chart.",
    },
  ],
  "predictive-maintenance": [
    {
      question: "Which resources have the highest failure probability?",
      answer: "Top 3 resources by failure probability (24h horizon): (1) node-03 disk — 87% (degrading trend, 6% free), (2) api-gateway CPU — 74% (Holt-Winters model, seasonal overload pattern), (3) payment-db memory — 68% (linear regression, 92% utilization). Recommend immediate capacity review for node-03.",
    },
    {
      question: "Explain the health score trend for node-01 over the last 7 days",
      answer: "node-01 health score dropped from 82 to 61 over 7 days. Primary drivers: CPU weight (0.25) contributed −9 points due to sustained 88% utilization, disk weight (0.15) contributed −7 points as free space fell below 15%. Current status: Warning. At this rate, critical threshold (40) will be reached in ~4 days.",
    },
    {
      question: "What is the predicted time to failure for disk storage?",
      answer: "Linear regression model 'Disk Exhaustion' predicts: node-03 /data volume reaches 100% capacity in approximately 31 hours (high confidence, R²=0.94). node-07 /var/log reaches capacity in ~18 days (medium confidence, R²=0.72). Recommended action: provision additional storage or archive logs for node-03 immediately.",
    },
    {
      question: "Show me all high-risk predictions for the next 24 hours",
      answer: "5 high-risk predictions (>70% failure probability, 24h horizon): node-03 disk (87%), api-gateway CPU (74%), payment-db memory (68% — upgraded to high-risk in last cycle), worker-02 network saturation (71%), k8s-node-05 pressure score (73%). 3 alert instances generated. Review prediction models for accuracy calibration.",
    },
  ],
  "db-monitoring-inventory": [
    {
      question: "How many database instances are currently offline?",
      answer: "Currently 2 out of 8 instances are offline: ClickHouse Analytics (kubernetes, port 8123) and a staging MySQL instance (docker, port 3306). The ClickHouse instance has been offline for 45 minutes. Check agent connectivity for both instances.",
    },
    {
      question: "Show me the fleet composition by database type",
      answer: "Your fleet has 8 instances across 6 database types: MySQL (2), PostgreSQL (1), MongoDB (1), ClickHouse (1), SQL Server (1), SQLite3 (1), RDS MySQL (1). MySQL is the most common type. Consider setting up monitoring rules for the ClickHouse and SQL Server instances.",
    },
    {
      question: "Which instances are in a degraded state?",
      answer: "1 instance is degraded: ClickHouse Analytics (kubernetes, port 8123) — error count: 3, last error: 'Connection timeout after 10s'. The degraded status was set after errorCount exceeded the 5-error threshold. Check network connectivity between the agent and the ClickHouse server.",
    },
    {
      question: "What is the distribution of database providers?",
      answer: "Provider distribution: self-hosted (5), docker (1), aws-rds (1), kubernetes (1). The majority of your instances are self-hosted. Consider migrating to managed providers for better availability guarantees.",
    },
  ],
  "cost-optimization": [
    {
      question: "What is my total cloud spend this month?",
      answer: "Your total cloud spend month-to-date is $5,620 across 3 providers: AWS ($4,200), GCP ($1,100), and DigitalOcean ($320). This is 12% higher than the same period last month. The primary driver is EC2 usage increase on the AWS production account.",
    },
    {
      question: "Which services are costing the most?",
      answer: "Top 5 services by cost: EC2 ($1,820), RDS ($680), Compute Engine ($560), S3 ($240), DigitalOcean Droplets ($320). EC2 alone accounts for 32% of total spend. Consider rightsizing the m5.2xlarge instances in us-east-1 — they average 35% CPU utilization.",
    },
    {
      question: "What optimization recommendations are available?",
      answer: "5 open recommendations with $1,240/mo estimated savings: (1) Rightsize 12 EC2 instances ($580/mo), (2) Purchase RI for RDS Multi-AZ ($340/mo), (3) Delete 47 unattached EBS volumes ($120/mo), (4) Switch to Committed Use Discounts for GCP Compute ($200/mo). Confidence scores range from 0.85 to 0.95.",
    },
    {
      question: "How are my budgets performing?",
      answer: "3 active budgets: 'AWS Production' at 78% ($7,800/$10,000 — warning threshold crossed), 'GCP Staging' at 45% ($900/$2,000 — ok), 'Overall Cloud' at 62% ($5,620/$9,000 — ok). The AWS Production budget is projected to exceed by month-end at current trajectory.",
    },
  ],
  "db-monitoring-timescaledb": [
    {
      question: "Show me hypertable compression status",
      answer: "3 of 5 hypertables have compression enabled: metrics_raw (92% compressed, 340GB saved), logs_raw (88% compressed, 120GB saved), traces_raw (not compressed — add compression policy). Recommended: enable compression for traces_raw with segment_by='service_name' to save an estimated 80GB.",
    },
    {
      question: "How are scheduled jobs performing?",
      answer: "8 scheduled jobs: 6 successful, 1 failed (continuous aggregate refresh for metrics_1h — last failed 2h ago due to lock timeout), 1 scheduled (retention policy for logs_raw). The failed job will retry on next schedule. Consider increasing lock_timeout for the aggregate refresh job.",
    },
  ],
  "db-monitoring-aurora": [
    {
      question: "What is the topology of my Aurora cluster?",
      answer: "Your primary Aurora MySQL cluster 'tf-prod-aurora-mysql' has 3 instances: 1 writer (db.r6g.2xlarge in us-east-1a) and 2 readers (db.r6g.2xlarge in us-east-1b, db.r6g.xlarge in us-east-1c). All instances are healthy with status 'available'. The cluster endpoint routes writes to the writer, and the reader endpoint load-balances across readers.",
    },
    {
      question: "Show me Performance Insights for the writer instance",
      answer: "The writer instance tf-prod-aurora-mysql-node-1 has a total DB load of 12.8 AAS. Top SQL by load: a SELECT on users table (3.42 AAS, CPU wait), an UPDATE on orders (2.15 AAS, Lock wait), and a COUNT on sessions (1.88 AAS, IO wait). Aurora Storage IO accounts for 34.4% of total wait time. Consider adding an index on the orders.status column to reduce lock contention.",
    },
    {
      question: "How is the Serverless v2 ACU scaling?",
      answer: "Serverless v2 instances are operating normally. tf-prod-aurora-pg-node-1: 4.5 ACU (28.1% of 16 max), tf-prod-aurora-pg-reader-1: 2.8 ACU (17.5% of 16 max). The writer scaled up from 4.0 to 4.5 ACU 20 minutes ago. Estimated ACU-hours consumed: 38.7 this billing period. No scaling bottlenecks detected.",
    },
    {
      question: "What is the global database replication lag?",
      answer: "Global database 'tf-global-aurora' replication is healthy. Primary region: us-east-1. Secondary clusters: eu-west-1 (45ms lag, available), ap-southeast-1 (82ms lag, available). RPO lag: 3 seconds. Both secondaries are well within the 100ms warning threshold. The last planned failover was on 2025-11-01.",
    },
    {
      question: "Show me recent cluster events",
      answer: "8 recent events across all clusters: (1) Reader node-3 promoted to tier 2 (5 min ago, info), (2) Writer scaled to db.r6g.2xlarge (30 min ago, info), (3) ACU scaled 3.5→4.5 on pg-node-1 (1h ago, info), (4) Automatic failover initiated on mysql cluster (2h ago, warning), (5) Global replication lag exceeded threshold (4h ago, warning).",
    },
  ],
  "db-monitoring-mysql": [
    {
      question: "What is the InnoDB buffer pool hit ratio?",
      answer: "InnoDB buffer pool hit ratio is 99.2%, which is excellent (target >95%). The buffer pool size is 8GB with 6.2GB used. Freeable memory: 8.1GB. No buffer pool pressure detected. Current read IOPS: 1,250 and write IOPS: 680. The high hit ratio indicates the working set fits comfortably in memory.",
    },
    {
      question: "Show me slow queries for the last hour",
      answer: "3 slow queries detected in the last hour: (1) SELECT on notifications with BETWEEN — avg latency 1536ms, 288K shared blocks read, (2) SELECT on orders JOIN order_items — avg latency 1030ms, 640K shared blocks read, (3) VACUUM ANALYZE on notifications — avg latency 1700ms. All three are IO-bound. Consider adding composite indexes on the notification and order tables.",
    },
    {
      question: "How is replication lag on my read replicas?",
      answer: "Replication lag on tf-prod-aurora-mysql-node-2 is 5.2ms (avg), which is healthy. Node-3 shows 4.8ms lag. Both replicas are streaming and within acceptable thresholds (<100ms warning, <1000ms critical). No replication delays or errors detected in the last 24 hours.",
    },
    {
      question: "What are the top queries by execution time?",
      answer: "Top 5 queries by total execution time: (1) INSERT into audit_log — 253s total, 120.5K executions, (2) SELECT users — 542s total, 45.2K executions, (3) SELECT reviews JOIN — 288s total, 15.2K executions, (4) UPDATE orders — 199s total, 28.4K executions, (5) SELECT products JOIN — 144s total, 8.5K executions. The audit_log INSERT has the highest exec count at 120.5K.",
    },
    {
      question: "Show me connection pool utilization",
      answer: "Active connections: 145 (avg) with variance of ±40. Current max_connections is 1000, putting utilization at 14.5%. Peak connections in the last hour: 185. Connection count is stable with no signs of connection leakage. The commit latency is 1.8ms and DML latency is 3.2ms, both within normal ranges.",
    },
  ],
};

// Combine all mock data for cross-context search
const ALL_MOCK_RESPONSES: {
  question: string;
  answer: string;
  context: ContextType;
}[] = [
  ...METRICS_MOCK_DATA.map((m) => ({
    ...m,
    context: "metrics" as ContextType,
  })),
  ...LOGS_MOCK_DATA.map((m) => ({ ...m, context: "logs" as ContextType })),
  ...TRACES_MOCK_DATA.map((m) => ({ ...m, context: "traces" as ContextType })),
  ...ALERTS_MOCK_DATA.map((m) => ({ ...m, context: "alerts" as ContextType })),
  ...ALERT_RULES_MOCK_DATA.map((m) => ({
    ...m,
    context: "alert-rules" as ContextType,
  })),
  ...KUBERNETES_MOCK_DATA.map((m) => ({
    ...m,
    context: "kubernetes-overview" as ContextType,
  })),
  ...AGENTS_MOCK_DATA.map((m) => ({ ...m, context: "agents" as ContextType })),
  ...UPTIME_MOCK_DATA.map((m) => ({ ...m, context: "uptime" as ContextType })),
  ...STATUS_PAGE_MOCK_DATA.map((m) => ({
    ...m,
    context: "status-page" as ContextType,
  })),
  ...CORRELATIONS_MOCK_DATA.map((m) => ({
    ...m,
    context: "correlations" as ContextType,
  })),
  ...DASHBOARD_MOCK_DATA.map((m) => ({
    ...m,
    context: "dashboard" as ContextType,
  })),
  ...EXEMPLARS_MOCK_DATA.map((m) => ({
    ...m,
    context: "exemplars" as ContextType,
  })),
  ...INFRA_CPU_MOCK_DATA.map((m) => ({
    ...m,
    context: "infra-cpu" as ContextType,
  })),
  ...INFRA_MEMORY_MOCK_DATA.map((m) => ({
    ...m,
    context: "infra-memory" as ContextType,
  })),
  ...INFRA_STORAGE_MOCK_DATA.map((m) => ({
    ...m,
    context: "infra-storage" as ContextType,
  })),
  ...INFRA_NETWORK_MOCK_DATA.map((m) => ({
    ...m,
    context: "infra-network" as ContextType,
  })),
  ...SERVICE_MAP_MOCK_DATA.map((m) => ({
    ...m,
    context: "service-map" as ContextType,
  })),
  ...NETWORK_MAP_MOCK_DATA.map((m) => ({
    ...m,
    context: "network-map" as ContextType,
  })),
  ...REPORTS_MOCK_DATA.map((m) => ({
    ...m,
    context: "reports" as ContextType,
  })),
  ...IAM_MOCK_DATA.map((m) => ({
    ...m,
    context: "iam" as ContextType,
  })),
  ...TENANCY_MOCK_DATA.map((m) => ({
    ...m,
    context: "tenancy" as ContextType,
  })),
  ...AUDIT_MOCK_DATA.map((m) => ({
    ...m,
    context: "audit" as ContextType,
  })),
  ...RETENTION_MOCK_DATA.map((m) => ({
    ...m,
    context: "retention" as ContextType,
  })),
  ...SUBSCRIPTION_MOCK_DATA.map((m) => ({
    ...m,
    context: "subscription" as ContextType,
  })),
  ...API_KEYS_MOCK_DATA.map((m) => ({
    ...m,
    context: "api-keys" as ContextType,
  })),
  ...NOTIFICATIONS_MOCK_DATA.map((m) => ({
    ...m,
    context: "notifications" as ContextType,
  })),
  // IAM sub-feature contexts
  ...IAM_USERS_MOCK_DATA.map((m) => ({
    ...m,
    context: "iam-users" as ContextType,
  })),
  ...IAM_ROLES_MOCK_DATA.map((m) => ({
    ...m,
    context: "iam-roles" as ContextType,
  })),
  ...IAM_PERMISSIONS_MOCK_DATA.map((m) => ({
    ...m,
    context: "iam-permissions" as ContextType,
  })),
  ...IAM_MATRIX_MOCK_DATA.map((m) => ({
    ...m,
    context: "iam-matrix" as ContextType,
  })),
  ...IAM_ASSIGNMENTS_MOCK_DATA.map((m) => ({
    ...m,
    context: "iam-assignments" as ContextType,
  })),
  // Tenancy sub-feature contexts
  ...TENANCY_REGIONS_MOCK_DATA.map((m) => ({
    ...m,
    context: "tenancy-regions" as ContextType,
  })),
  ...TENANCY_ORGANIZATIONS_MOCK_DATA.map((m) => ({
    ...m,
    context: "tenancy-organizations" as ContextType,
  })),
  ...TENANCY_WORKSPACES_MOCK_DATA.map((m) => ({
    ...m,
    context: "tenancy-workspaces" as ContextType,
  })),
  ...TENANCY_TENANTS_MOCK_DATA.map((m) => ({
    ...m,
    context: "tenancy-tenants" as ContextType,
  })),
  // System sub-feature contexts
  ...SYSTEM_SETUP_MOCK_DATA.map((m) => ({
    ...m,
    context: "system-setup" as ContextType,
  })),
  ...SYSTEM_CHANNELS_MOCK_DATA.map((m) => ({
    ...m,
    context: "system-channels" as ContextType,
  })),
  ...AI_ASSISTANT_MOCK_DATA.map((m) => ({
    ...m,
    context: "ai-assistant" as ContextType,
  })),
  // Account sub-feature contexts
  ...ACCOUNT_PROFILE_MOCK_DATA.map((m) => ({
    ...m,
    context: "account-profile" as ContextType,
  })),
  ...ACCOUNT_SECURITY_MOCK_DATA.map((m) => ({
    ...m,
    context: "account-security" as ContextType,
  })),
  ...ACCOUNT_SESSIONS_MOCK_DATA.map((m) => ({
    ...m,
    context: "account-sessions" as ContextType,
  })),
  ...ACCOUNT_NOTIFICATIONS_MOCK_DATA.map((m) => ({
    ...m,
    context: "account-notifications" as ContextType,
  })),
  ...ACCOUNT_PREFERENCES_MOCK_DATA.map((m) => ({
    ...m,
    context: "account-preferences" as ContextType,
  })),
];

function generateMockMessages(contextType?: ContextType): ChatMessage[] {
  const context = contextType || "logs";
  const mockData = MOCK_AI_RESPONSES[context]?.[0] || MOCK_AI_RESPONSES.logs[0];

  return [
    {
      id: "msg-1",
      role: "user",
      content: mockData.question,
      createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    },
    {
      id: "msg-2",
      role: "assistant",
      content: mockData.answer,
      tokensUsed: Math.floor(Math.random() * 800) + 400,
      modelId: "claude-sonnet-4-20250514",
      latencyMs: Math.floor(Math.random() * 2000) + 1500,
      createdAt: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
    },
  ];
}

// Get context-aware streaming response with cross-context question matching
// This function searches across ALL mock files to find the best matching answer
function getContextAwareResponse(
  contextType: ContextType,
  userMessage?: string,
): string {
  const contextResponses = MOCK_AI_RESPONSES[contextType];

  // If no user message, return first response from current context
  if (!userMessage) {
    if (contextResponses && contextResponses.length > 0) {
      return contextResponses[0].answer;
    }
    return MOCK_AI_RESPONSES.dashboard[0].answer;
  }

  // Normalize user message for matching
  const normalizedMessage = userMessage.toLowerCase().trim();

  // Search across ALL mock responses for best match (cross-context search)
  let bestMatch = contextResponses?.[0] || MOCK_AI_RESPONSES.dashboard[0];
  let bestScore = 0;

  for (const response of ALL_MOCK_RESPONSES) {
    const normalizedQuestion = response.question.toLowerCase().trim();

    // Exact match - return immediately
    if (normalizedQuestion === normalizedMessage) {
      return response.answer;
    }

    // Calculate similarity score based on word overlap
    const messageWords = normalizedMessage.split(/\s+/);
    const questionWords = normalizedQuestion.split(/\s+/);

    let matchCount = 0;
    for (const word of messageWords) {
      if (
        word.length > 2 &&
        questionWords.some((qw) => qw.includes(word) || word.includes(qw))
      ) {
        matchCount++;
      }
    }

    const score = matchCount / Math.max(messageWords.length, 1);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = response;
    }
  }

  // Return best match if score is reasonable (>30% word match)
  if (bestScore > 0.3) {
    return bestMatch.answer;
  }

  // Fallback to first response in current context
  if (contextResponses && contextResponses.length > 0) {
    return contextResponses[0].answer;
  }

  return MOCK_AI_RESPONSES.dashboard[0].answer;
}

// ==================== API CLIENT ====================

export const llmApi = {
  // ==================== PROVIDERS ====================

  /**
   * Create a new LLM provider
   */
  async createProvider(data: CreateLLMProviderRequest): Promise<LLMProvider> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const mockProviders = generateMockProviders();
      return {
        ...mockProviders[0],
        id: `provider-${Date.now()}`,
        name: data.name,
        providerType: data.providerType,
        modelId: data.modelId,
        baseUrl: data.baseUrl,
        apiKeyHint: `${data.apiKey.substring(0, 5)}...${data.apiKey.slice(-4)}`,
        modelConfig: {
          temperature: data.temperature ?? 0.7,
          maxTokens: data.maxTokens ?? 4096,
          topP: data.topP ?? 1,
        },
        isDefault: data.isDefault ?? false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const response = await collectorClient.post<LLMProvider>(
      LLM_ENDPOINTS.PROVIDERS,
      data,
    );
    return (response as any).data ?? (response as any);
  },

  /**
   * List LLM providers
   */
  async listProviders(
    query: ListLLMProvidersQuery = {},
  ): Promise<PaginatedProviders> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      // Use shared mock cache from llm-config so enable/disable changes
      // made on the AI Assistant settings page are reflected here too.
      let providers: LLMProvider[] = getMockProviders().map((p) => ({
        id: p.id,
        organizationId: "org-devopscorner",
        name: p.displayName || p.name,
        providerType: p.provider as LLMProvider["providerType"],
        apiKeyHint: p.apiKey ? `${p.apiKey.substring(0, 5)}...` : "***",
        modelId: p.modelId,
        baseUrl: p.apiEndpoint || "",
        modelConfig: {
          temperature: p.temperature ?? 0.7,
          maxTokens: p.maxTokens ?? 4096,
          topP: p.topP ?? 1,
        },
        isDefault: p.isDefault,
        isActive: p.enabled,
        usageCount: 0,
        lastUsedAt: undefined,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }));

      if (query.isActive !== undefined) {
        providers = providers.filter((p) => p.isActive === query.isActive);
      }
      if (query.providerType) {
        providers = providers.filter(
          (p) => p.providerType === query.providerType,
        );
      }

      return {
        items: providers,
        total: providers.length,
        page: query.page || 1,
        pageSize: query.pageSize || 20,
      };
    }

    const response = await collectorClient.get<PaginatedProviders>(
      LLM_ENDPOINTS.PROVIDERS,
      { params: query },
    );
    // Handle both wrapped { data: T } and unwrapped T responses
    return response.data ?? (response as unknown as PaginatedProviders);
  },

  /**
   * Get default provider
   */
  async getDefaultProvider(): Promise<LLMProvider | null> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const p = getMockProviders().find((p) => p.isDefault);
      if (!p) return null;
      return {
        id: p.id,
        organizationId: "org-devopscorner",
        name: p.displayName || p.name,
        providerType: p.provider as LLMProvider["providerType"],
        apiKeyHint: p.apiKey ? `${p.apiKey.substring(0, 5)}...` : "***",
        modelId: p.modelId,
        baseUrl: p.apiEndpoint || "",
        modelConfig: {
          temperature: p.temperature ?? 0.7,
          maxTokens: p.maxTokens ?? 4096,
          topP: p.topP ?? 1,
        },
        isDefault: p.isDefault,
        isActive: p.enabled,
        usageCount: 0,
        lastUsedAt: undefined,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    }

    try {
      const response = await collectorClient.get<LLMProvider>(
        LLM_ENDPOINTS.PROVIDER_DEFAULT,
      );
      return (response as any).data ?? (response as any);
    } catch (error: unknown) {
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 404) {
          return null;
        }
      }
      throw error;
    }
  },

  /**
   * Get provider by ID
   */
  async getProvider(id: string): Promise<LLMProvider> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const providers = generateMockProviders();
      return providers.find((p) => p.id === id) || providers[0];
    }

    const response = await collectorClient.get<LLMProvider>(
      LLM_ENDPOINTS.PROVIDER(id),
    );
    return (response as any).data ?? (response as any);
  },

  /**
   * Update provider
   */
  async updateProvider(
    id: string,
    data: UpdateLLMProviderRequest,
  ): Promise<LLMProvider> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const providers = generateMockProviders();
      const provider = providers[0];
      return {
        ...provider,
        ...data,
        apiKeyHint: data.apiKey
          ? `${data.apiKey.substring(0, 5)}...${data.apiKey.slice(-4)}`
          : provider.apiKeyHint,
        modelConfig: {
          temperature: data.temperature ?? provider.modelConfig.temperature,
          maxTokens: data.maxTokens ?? provider.modelConfig.maxTokens,
          topP: data.topP ?? provider.modelConfig.topP,
        },
        updatedAt: new Date().toISOString(),
      };
    }

    const response = await collectorClient.patch<LLMProvider>(
      LLM_ENDPOINTS.PROVIDER(id),
      data,
    );
    return (response as any).data ?? (response as any);
  },

  /**
   * Set provider as default
   */
  async setDefaultProvider(id: string): Promise<LLMProvider> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const providers = getMockProviders();
      providers.forEach((p) => {
        p.isDefault = p.id === id;
      });
      const p = providers.find((p) => p.id === id) || providers[0];
      return {
        id: p.id,
        organizationId: "org-devopscorner",
        name: p.displayName || p.name,
        providerType: p.provider as LLMProvider["providerType"],
        apiKeyHint: p.apiKey ? `${p.apiKey.substring(0, 5)}...` : "***",
        modelId: p.modelId,
        baseUrl: p.apiEndpoint || "",
        modelConfig: {
          temperature: p.temperature ?? 0.7,
          maxTokens: p.maxTokens ?? 4096,
          topP: p.topP ?? 1,
        },
        isDefault: p.isDefault,
        isActive: p.enabled,
        usageCount: 0,
        lastUsedAt: undefined,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    }

    const response = await collectorClient.post<LLMProvider>(
      LLM_ENDPOINTS.PROVIDER_SET_DEFAULT(id),
    );
    return (response as any).data ?? (response as any);
  },

  /**
   * Validate provider API key
   */
  async validateProvider(id: string): Promise<ValidateApiKeyResponse> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { valid: true, message: "API key is valid" };
    }

    const response = await collectorClient.post<ValidateApiKeyResponse>(
      LLM_ENDPOINTS.PROVIDER_VALIDATE(id),
    );
    return (response as any).data ?? (response as any);
  },

  /**
   * Delete provider
   */
  async deleteProvider(id: string): Promise<void> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return;
    }

    await collectorClient.delete(LLM_ENDPOINTS.PROVIDER(id));
  },

  // ==================== CHAT ====================

  /**
   * Send a chat message
   */
  async sendMessage(data: SendMessageRequest): Promise<SendMessageResponse> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const messages = generateMockMessages();
      return {
        conversationId: data.conversationId || `conv-${Date.now()}`,
        message: messages[1],
        usage: {
          promptTokens: 150,
          completionTokens: 300,
          totalTokens: 450,
        },
      };
    }

    const response = await collectorClient.post<SendMessageResponse>(
      LLM_ENDPOINTS.CHAT_MESSAGE,
      data,
    );
    return (response as any).data ?? (response as any);
  },

  /**
   * Send a chat message with streaming response
   * Returns an EventSource for SSE handling
   */
  createMessageStream(
    data: SendMessageRequest,
    onEvent: (event: StreamEvent) => void,
    onError?: (error: Error) => void,
  ): () => void {
    if (config.useMock) {
      // Mock streaming with context-aware response matched to user question
      const contextType = data.contextType || "dashboard";
      const mockResponse = getContextAwareResponse(contextType, data.message);
      const words = mockResponse.split(" ");
      let index = 0;
      let aborted = false;

      // Send start event
      setTimeout(() => {
        if (!aborted) {
          onEvent({ type: "start", conversationId: `conv-${Date.now()}` });
        }
      }, 100);

      // Stream words
      const interval = setInterval(() => {
        if (aborted || index >= words.length) {
          clearInterval(interval);
          if (!aborted) {
            onEvent({
              type: "end",
              messageId: `msg-${Date.now()}`,
              latencyMs: Math.floor(Math.random() * 2000) + 1500,
            });
          }
          return;
        }
        onEvent({ type: "chunk", content: words[index] + " " });
        index++;
      }, 35);

      return () => {
        aborted = true;
        clearInterval(interval);
      };
    }

    // Real SSE implementation
    const controller = new AbortController();
    const token = iamClient.getAccessToken();

    fetch(`${config.apiUrl}${LLM_ENDPOINTS.CHAT_STREAM}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          // Try to extract the error message from the response body
          try {
            const body = await response.json();
            const msgs = body?.message;
            const detail = Array.isArray(msgs)
              ? msgs.join(", ")
              : (msgs ?? body?.error ?? `HTTP ${response.status}`);
            throw new Error(detail);
          } catch (parseErr) {
            if (
              parseErr instanceof Error &&
              parseErr.message !== `HTTP ${response.status}`
            )
              throw parseErr;
            throw new Error(`HTTP ${response.status}`);
          }
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader available");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const event = JSON.parse(line.slice(6)) as StreamEvent;
                onEvent(event);
              } catch {
                // Ignore parse errors
              }
            }
          }
        }
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          onError?.(error);
        }
      });

    return () => controller.abort();
  },

  /**
   * List conversations
   */
  async listConversations(
    query: ListConversationsQuery = {},
  ): Promise<PaginatedConversations> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      let conversations = generateMockConversations();

      if (query.contextType) {
        conversations = conversations.filter(
          (c) => c.contextType === query.contextType,
        );
      }
      if (query.isArchived !== undefined) {
        conversations = conversations.filter(
          (c) => c.isArchived === query.isArchived,
        );
      }
      if (query.search) {
        const search = query.search.toLowerCase();
        conversations = conversations.filter((c) =>
          c.title?.toLowerCase().includes(search),
        );
      }

      return {
        items: conversations,
        total: conversations.length,
        page: query.page || 1,
        pageSize: query.pageSize || 20,
      };
    }

    const response = await collectorClient.get<PaginatedConversations>(
      LLM_ENDPOINTS.CONVERSATIONS,
      { params: query },
    );
    // Handle both wrapped { data: T } and unwrapped T responses
    return response.data ?? (response as unknown as PaginatedConversations);
  },

  /**
   * Get conversation with messages
   */
  async getConversation(id: string): Promise<ConversationDetail> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const conversations = generateMockConversations();
      const conversation = conversations[0];
      return {
        ...conversation,
        id,
        messages: generateMockMessages(),
      };
    }

    const response = await collectorClient.get<ConversationDetail>(
      LLM_ENDPOINTS.CONVERSATION(id),
    );
    return (response as any).data ?? (response as any);
  },

  /**
   * Archive conversation
   */
  async archiveConversation(id: string): Promise<void> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return;
    }

    await collectorClient.post(LLM_ENDPOINTS.CONVERSATION_ARCHIVE(id));
  },

  /**
   * Delete conversation
   */
  async deleteConversation(id: string): Promise<void> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return;
    }

    await collectorClient.delete(LLM_ENDPOINTS.CONVERSATION(id));
  },

  // ==================== INSIGHTS ====================

  /**
   * Generate an AI insight
   */
  async generateInsight(data: GenerateInsightRequest): Promise<Insight> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const insightContent: Record<InsightType, string> = {
        chronology: `## Incident Chronology

### Timeline
- **10:45 UTC** - First error spike detected in auth-service
- **10:47 UTC** - Database connection timeouts begin
- **10:52 UTC** - Alert triggered: "Auth Error Rate > 5%"
- **10:55 UTC** - Auto-scaling triggered for auth-service
- **11:02 UTC** - Error rate begins to normalize

### Root Cause
Database connection pool exhaustion due to increased traffic from marketing campaign launch.`,
        prediction: `## Predictive Analysis

### Potential Issues (Next 24h)
1. **High Risk**: Database CPU may exceed 80% during peak hours (4-6 PM)
2. **Medium Risk**: Auth service may experience latency spikes
3. **Low Risk**: Log volume may exceed retention policy threshold

### Recommendations
- Pre-scale database resources before peak hours
- Consider implementing request queuing`,
        recommendation: `## Recommendations

### Immediate Actions
1. Increase database connection pool to 50 connections
2. Enable request rate limiting on auth endpoints

### Short-term Improvements
1. Implement circuit breaker pattern
2. Add caching layer for frequently accessed data

### Long-term Optimizations
1. Consider database sharding
2. Implement async processing for non-critical operations`,
        "root-cause": `## Root Cause Analysis

### Primary Root Cause
Database connection pool exhaustion (10 connections max) under increased load.

### Contributing Factors
1. Missing connection timeout configuration
2. No connection pooling middleware
3. Synchronous database calls blocking threads

### Evidence
- Connection count peaked at 10/10
- Query latency increased from 50ms to 3000ms
- Thread pool exhausted at 10:52 UTC`,
        pattern: `## Pattern Analysis

### Detected Patterns
1. **Weekly Pattern**: Error rates spike every Monday 9-10 AM
2. **Daily Pattern**: Latency increases 15% during lunch hours
3. **Anomaly**: Unexpected 3x traffic spike on March 15th

### Correlations
- High correlation (0.85) between API latency and database CPU
- Error rate correlates with deployment events`,
      };

      return {
        insightType: data.insightType,
        contextType: data.contextType,
        timeRange: {
          from:
            data.timeFrom ||
            new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          to: data.timeTo || new Date().toISOString(),
        },
        content: insightContent[data.insightType],
        modelId: "claude-sonnet-4-20250514",
        usage: {
          promptTokens: 500,
          completionTokens: 800,
          totalTokens: 1300,
        },
        latencyMs: 1850,
        generatedAt: new Date().toISOString(),
      };
    }

    const response = await collectorClient.post<Insight>(
      LLM_ENDPOINTS.INSIGHTS_GENERATE,
      data,
    );
    return (response as any).data ?? (response as any);
  },

  /**
   * Shortcut methods for specific insight types
   */
  async generateChronology(
    data: Omit<GenerateInsightRequest, "insightType">,
  ): Promise<Insight> {
    return this.generateInsight({ ...data, insightType: "chronology" });
  },

  async generateRootCause(
    data: Omit<GenerateInsightRequest, "insightType">,
  ): Promise<Insight> {
    return this.generateInsight({ ...data, insightType: "root-cause" });
  },

  async generatePrediction(
    data: Omit<GenerateInsightRequest, "insightType">,
  ): Promise<Insight> {
    return this.generateInsight({ ...data, insightType: "prediction" });
  },

  async generateRecommendations(
    data: Omit<GenerateInsightRequest, "insightType">,
  ): Promise<Insight> {
    return this.generateInsight({ ...data, insightType: "recommendation" });
  },

  async detectPatterns(
    data: Omit<GenerateInsightRequest, "insightType">,
  ): Promise<Insight> {
    return this.generateInsight({ ...data, insightType: "pattern" });
  },
};

export default llmApi;

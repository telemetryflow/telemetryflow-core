import { collectorClient } from "./collector";
import { config } from "@/config";
import type { SamplingMode } from "@/types/llm";

// ==================== ENDPOINTS ====================

const LLM_CONFIG_ENDPOINTS = {
  PROVIDERS: "/api/v2/llm/providers",
  PROVIDER: (id: string) => `/api/v2/llm/providers/${id}`,
  PROVIDER_SET_DEFAULT: (id: string) =>
    `/api/v2/llm/providers/${id}/set-default`,
  PROVIDER_TEST: (id: string) => `/api/v2/llm/providers/${id}/validate`,
  PROVIDER_TEST_KEY: "/api/v2/llm/providers/test-key",
} as const;

// ==================== TYPES ====================

export interface LLMProvider {
  id: string;
  name: string;
  displayName: string;
  provider:
    | "anthropic"
    | "claude"
    | "openai"
    | "google"
    | "gemini"
    | "deepseek"
    | "qwen"
    | "ollama"
    | "mistral"
    | "grok"
    | "kimi"
    | "zhipu"
    | "mimo"
    | "custom";
  modelId: string;
  apiKey?: string;
  apiEndpoint?: string;
  enabled: boolean;
  isDefault: boolean;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  samplingMode?: SamplingMode;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLLMProviderRequest {
  name: string;
  displayName: string;
  provider: string;
  modelId: string;
  apiKey?: string;
  apiEndpoint?: string;
  enabled?: boolean;
  isDefault?: boolean;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  samplingMode?: SamplingMode;
}

export interface UpdateLLMProviderRequest {
  name?: string;
  displayName?: string;
  modelId?: string;
  apiKey?: string;
  apiEndpoint?: string;
  enabled?: boolean;
  isDefault?: boolean;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  samplingMode?: SamplingMode;
}

// ==================== MOCK DATA ====================

let _mockProviders: LLMProvider[] | null = null;

export function getMockProviders(): LLMProvider[] {
  if (!_mockProviders) {
    _mockProviders = generateMockProviders();
  }
  return _mockProviders;
}

function generateMockProviders(): LLMProvider[] {
  const ts = "2025-01-01T00:00:00Z";
  const ANTHROPIC = "https://api.anthropic.com";
  const GOOGLE = "https://generativelanguage.googleapis.com";
  const OPENAI = "https://api.openai.com/v1";
  const DEEPSEEK = "https://api.deepseek.com";
  const QWEN = "https://dashscope.aliyuncs.com/compatible-mode/v1";
  const OLLAMA = "http://localhost:11434/v1";
  const MISTRAL = "https://api.mistral.ai/v1";
  const GROK = "https://api.x.ai/v1";
  const KIMI = "https://api.moonshot.cn/v1";
  const ZHIPU = "https://open.bigmodel.cn/api/paas/v4";
  const MIMO = "https://platform.xiaomimimo.com/v1";
  const CUSTOM = "http://localhost:8000/v1";

  const m = (
    provider: LLMProvider["provider"],
    modelId: string,
    displayName: string,
    apiEndpoint: string,
    maxTokens: number,
    temperature: number,
    isDefault: boolean,
    enabled: boolean,
    samplingMode?: SamplingMode,
    topP?: number,
  ): LLMProvider => ({
    id: `provider-${modelId}`,
    name: displayName,
    displayName,
    provider,
    modelId,
    apiEndpoint,
    enabled,
    isDefault,
    maxTokens,
    temperature,
    samplingMode,
    topP,
    createdAt: ts,
    updatedAt: ts,
  });

  return [
    // ─── Anthropic Claude (11 models) ───
    m("anthropic", "claude-opus-4-7", "Anthropic Claude Opus 4.7", ANTHROPIC, 16384, 0.7, true, true, "top_p", 0),
    m("anthropic", "claude-opus-4-7-fast", "Anthropic Claude Opus 4.7 Fast", ANTHROPIC, 16384, 0.7, false, false, "top_p", 0),
    m("anthropic", "claude-opus-4-6", "Anthropic Claude Opus 4.6", ANTHROPIC, 8192, 0.7, false, false, "top_p", 0),
    m("anthropic", "claude-opus-4-6-fast", "Anthropic Claude Opus 4.6 Fast", ANTHROPIC, 8192, 0.7, false, false, "top_p", 0),
    m("anthropic", "claude-sonnet-4-6", "Anthropic Claude Sonnet 4.6", ANTHROPIC, 8192, 0.7, false, false),
    m("anthropic", "claude-opus-4-5", "Anthropic Claude Opus 4.5", ANTHROPIC, 8192, 0.7, false, false),
    m("anthropic", "claude-sonnet-4-5-20250929", "Anthropic Claude Sonnet 4.5", ANTHROPIC, 8192, 0.7, false, false),
    m("anthropic", "claude-haiku-4-5", "Anthropic Claude Haiku 4.5", ANTHROPIC, 8192, 0.7, false, false),
    m("anthropic", "claude-haiku-4-5-20251001", "Anthropic Claude Haiku 4.5 (Oct 2025)", ANTHROPIC, 8192, 0.7, false, false),
    m("anthropic", "claude-sonnet-4-20250514", "Anthropic Claude Sonnet 4", ANTHROPIC, 8192, 0.7, false, false),
    m("anthropic", "claude-mythos-preview", "Anthropic Claude Mythos Preview", ANTHROPIC, 16384, 0.7, false, false, "top_p", 0),

    // ─── Google Gemini (10 models) ───
    m("google", "gemini-3.5-flash", "Google Gemini 3.5 Flash", GOOGLE, 65536, 0.7, false, false),
    m("google", "gemini-3.1-flash-lite", "Google Gemini 3.1 Flash Lite", GOOGLE, 65536, 0.7, false, false),
    m("google", "gemini-3.1-pro-preview", "Google Gemini 3.1 Pro Preview", GOOGLE, 65536, 0.7, false, false),
    m("google", "gemini-3-flash-preview", "Google Gemini 3 Flash Preview", GOOGLE, 65536, 0.7, false, false),
    m("google", "gemini-2.5-pro", "Google Gemini 2.5 Pro", GOOGLE, 65536, 0.7, false, false),
    m("google", "gemini-2.5-flash", "Google Gemini 2.5 Flash", GOOGLE, 65536, 0.7, false, false),
    m("google", "gemini-2.5-flash-lite", "Google Gemini 2.5 Flash-Lite", GOOGLE, 65536, 0.7, false, false),
    m("google", "gemini-2.0-flash", "Google Gemini 2.0 Flash", GOOGLE, 8192, 0.7, false, false),
    m("google", "gemini-2.0-flash-lite", "Google Gemini 2.0 Flash Lite", GOOGLE, 8192, 0.7, false, false),
    m("google", "gemini-1.5-pro", "Google Gemini 1.5 Pro", GOOGLE, 8192, 0.7, false, false),

    // ─── OpenAI ChatGPT (10 models) ───
    m("openai", "gpt-5.5-pro", "OpenAI GPT-5.5 Pro", OPENAI, 16384, 0.8, false, false),
    m("openai", "gpt-5.5", "OpenAI GPT-5.5", OPENAI, 16384, 0.8, false, false),
    m("openai", "gpt-5.4-pro", "OpenAI GPT-5.4 Pro", OPENAI, 16384, 0.8, false, false),
    m("openai", "gpt-5.4", "OpenAI GPT-5.4", OPENAI, 8192, 0.8, false, false),
    m("openai", "gpt-5.4-mini", "OpenAI GPT-5.4 Mini", OPENAI, 8192, 0.8, false, false),
    m("openai", "gpt-5.4-nano", "OpenAI GPT-5.4 Nano", OPENAI, 8192, 0.8, false, false),
    m("openai", "gpt-5.3-chat", "OpenAI GPT-5.3 Chat", OPENAI, 8192, 0.8, false, false),
    m("openai", "gpt-5", "OpenAI GPT-5", OPENAI, 8192, 0.8, false, false),
    m("openai", "gpt-4.1", "OpenAI GPT-4.1", OPENAI, 8192, 0.8, false, false),
    m("openai", "o3", "OpenAI o3", OPENAI, 8192, 0.8, false, false),

    // ─── DeepSeek (10 models) ───
    m("deepseek", "deepseek-v4-pro", "DeepSeek V4 Pro", DEEPSEEK, 16384, 0.7, false, false),
    m("deepseek", "deepseek-v4-flash", "DeepSeek V4 Flash", DEEPSEEK, 16384, 0.7, false, false),
    m("deepseek", "deepseek-v3.2-speciale", "DeepSeek V3.2 Speciale", DEEPSEEK, 8192, 0.7, false, false),
    m("deepseek", "deepseek-chat", "DeepSeek Chat V3.2", DEEPSEEK, 8192, 0.7, false, false),
    m("deepseek", "deepseek-v3.2", "DeepSeek V3.2", DEEPSEEK, 8192, 0.7, false, false),
    m("deepseek", "deepseek-v3.2-exp", "DeepSeek V3.2 Exp", DEEPSEEK, 8192, 0.7, false, false),
    m("deepseek", "deepseek-v3.1-terminus", "DeepSeek V3.1 Terminus", DEEPSEEK, 8192, 0.7, false, false),
    m("deepseek", "deepseek-chat-v3.1", "DeepSeek V3.1", DEEPSEEK, 8192, 0.7, false, false),
    m("deepseek", "deepseek-r1-0528", "DeepSeek R1 0528", DEEPSEEK, 8192, 0.7, false, false),
    m("deepseek", "deepseek-reasoner", "DeepSeek R2 Reasoner", DEEPSEEK, 8192, 0.7, false, false),

    // ─── Alibaba Qwen (10 models) ───
    m("qwen", "qwen3.6-max-preview", "Alibaba Qwen3.6 Max Preview", QWEN, 16384, 0.7, false, false),
    m("qwen", "qwen3.6-plus", "Alibaba Qwen3.6 Plus", QWEN, 16384, 0.7, false, false),
    m("qwen", "qwen3.6-flash", "Alibaba Qwen3.6 Flash", QWEN, 8192, 0.7, false, false),
    m("qwen", "qwen3.6-35b-a3b", "Alibaba Qwen3.6 35B A3B", QWEN, 8192, 0.7, false, false),
    m("qwen", "qwen3.6-27b", "Alibaba Qwen3.6 27B", QWEN, 8192, 0.7, false, false),
    m("qwen", "qwen3.5-plus", "Alibaba Qwen3.5 Plus", QWEN, 8192, 0.7, false, false),
    m("qwen", "qwen3.5-9b", "Alibaba Qwen3.5 9B", QWEN, 8192, 0.7, false, false),
    m("qwen", "qwen3.5-35b-a3b", "Alibaba Qwen3.5 35B A3B", QWEN, 8192, 0.7, false, false),
    m("qwen", "qwen3.5-27b", "Alibaba Qwen3.5 27B", QWEN, 8192, 0.7, false, false),
    m("qwen", "qwen3.5-122b-a10b", "Alibaba Qwen3.5 122B A10B", QWEN, 8192, 0.7, false, false),

    // ─── Ollama (10 models) ───
    m("ollama", "qwen3.6:flash", "Ollama Qwen3.6 Flash", OLLAMA, 8192, 0.7, false, false),
    m("ollama", "qwen3.5:plus", "Ollama Qwen3.5 Plus", OLLAMA, 8192, 0.7, false, false),
    m("ollama", "llama4:maverick-17b", "Ollama Llama 4 Maverick 17B", OLLAMA, 8192, 0.7, false, false),
    m("ollama", "gemma4:26b", "Ollama Gemma 4 26B", OLLAMA, 8192, 0.7, false, false),
    m("ollama", "mistral-small:2603", "Ollama Mistral Small 4", OLLAMA, 8192, 0.7, false, false),
    m("ollama", "qwen3:32b", "Ollama Qwen3 32B", OLLAMA, 8192, 0.7, false, false),
    m("ollama", "deepseek-r1:70b", "Ollama DeepSeek R1 70B", OLLAMA, 8192, 0.7, false, false),
    m("ollama", "granite:4.1-8b", "Ollama Granite 4.1 8B", OLLAMA, 8192, 0.7, false, false),
    m("ollama", "llama3.3:70b", "Ollama Llama 3.3 70B", OLLAMA, 8192, 0.7, false, false),
    m("ollama", "phi4:14b", "Ollama Phi-4 14B", OLLAMA, 8192, 0.7, false, false),

    // ─── Mistral AI (10 models) ───
    m("mistral", "mistral-medium-3-5", "Mistral Medium 3.5", MISTRAL, 16384, 0.7, false, false),
    m("mistral", "mistral-small-2603", "Mistral Small 4", MISTRAL, 8192, 0.7, false, false),
    m("mistral", "mistral-large-2512", "Mistral Large 3", MISTRAL, 16384, 0.7, false, false),
    m("mistral", "devstral-2512", "Mistral Devstral 2", MISTRAL, 8192, 0.7, false, false),
    m("mistral", "ministral-14b-2512", "Mistral Ministral 3 14B", MISTRAL, 8192, 0.7, false, false),
    m("mistral", "ministral-8b-2512", "Mistral Ministral 3 8B", MISTRAL, 8192, 0.7, false, false),
    m("mistral", "ministral-3b-2512", "Mistral Ministral 3 3B", MISTRAL, 4096, 0.7, false, false),
    m("mistral", "mistral-medium-2508", "Mistral Medium 3.1", MISTRAL, 16384, 0.7, false, false),
    m("mistral", "codestral-2508", "Mistral Codestral 2508", MISTRAL, 16384, 0.5, false, false),
    m("mistral", "mistral-large-2411", "Mistral Large 2.1", MISTRAL, 8192, 0.7, false, false),

    // ─── xAI Grok (10 models) ───
    m("grok", "grok-4.3", "xAI Grok 4.3", GROK, 16384, 0.7, false, false),
    m("grok", "grok-4.20-multi-agent", "xAI Grok 4.20 Multi-Agent", GROK, 16384, 0.7, false, false),
    m("grok", "grok-4.20-0309-reasoning", "xAI Grok 4.20 Reasoning", GROK, 16384, 0.7, false, false),
    m("grok", "grok-4.20-0309-non-reasoning", "xAI Grok 4.20 Non-Reasoning", GROK, 16384, 0.7, false, false),
    m("grok", "grok-4-1-fast-reasoning", "xAI Grok 4.1 Fast Reasoning", GROK, 8192, 0.7, false, false),
    m("grok", "grok-4-1-fast-non-reasoning", "xAI Grok 4.1 Fast Non-Reasoning", GROK, 8192, 0.7, false, false),
    m("grok", "grok-3", "xAI Grok 3", GROK, 8192, 0.7, false, false),
    m("grok", "grok-3-mini", "xAI Grok 3 Mini", GROK, 8192, 0.7, false, false),
    m("grok", "grok-2", "xAI Grok 2", GROK, 8192, 0.7, false, false),
    m("grok", "grok-2-mini", "xAI Grok 2 Mini", GROK, 4096, 0.7, false, false),

    // ─── Kimi / Moonshot AI (10 models) ───
    m("kimi", "kimi-k2.6", "Kimi K2.6", KIMI, 16384, 0.7, false, false),
    m("kimi", "kimi-k2.5", "Kimi K2.5", KIMI, 16384, 0.7, false, false),
    m("kimi", "kimi-k2-thinking", "Kimi K2 Thinking", KIMI, 16384, 0.7, false, false),
    m("kimi", "kimi-k2-0905", "Kimi K2 0905", KIMI, 8192, 0.7, false, false),
    m("kimi", "kimi-k2-turbo-preview", "Kimi K2 Turbo Preview", KIMI, 8192, 0.7, false, false),
    m("kimi", "kimi-k2", "Kimi K2 0711", KIMI, 8192, 0.7, false, false),
    m("kimi", "moonshot-v1-128k", "Moonshot V1 128K", KIMI, 8192, 0.7, false, false),
    m("kimi", "moonshot-v1-32k", "Moonshot V1 32K", KIMI, 8192, 0.7, false, false),
    m("kimi", "moonshot-v1-8k", "Moonshot V1 8K", KIMI, 4096, 0.7, false, false),
    m("kimi", "moonshot-v1-auto", "Moonshot V1 Auto", KIMI, 4096, 0.7, false, false),

    // ─── Zhipu GLM (10 models) ───
    m("zhipu", "glm-5.1", "Zhipu GLM-5.1", ZHIPU, 16384, 0.7, false, false),
    m("zhipu", "glm-5-turbo", "Zhipu GLM-5 Turbo", ZHIPU, 16384, 0.7, false, false),
    m("zhipu", "glm-5", "Zhipu GLM-5", ZHIPU, 16384, 0.7, false, false),
    m("zhipu", "glm-4.7-flash", "Zhipu GLM-4.7 Flash", ZHIPU, 8192, 0.7, false, false),
    m("zhipu", "glm-4.7", "Zhipu GLM-4.7", ZHIPU, 8192, 0.7, false, false),
    m("zhipu", "glm-4.6", "Zhipu GLM-4.6", ZHIPU, 8192, 0.7, false, false),
    m("zhipu", "glm-4.5", "Zhipu GLM-4.5", ZHIPU, 8192, 0.7, false, false),
    m("zhipu", "glm-4.5-air", "Zhipu GLM-4.5 Air", ZHIPU, 4096, 0.7, false, false),
    m("zhipu", "glm-4-flash", "Zhipu GLM-4 Flash", ZHIPU, 4096, 0.7, false, false),
    m("zhipu", "glm-4", "Zhipu GLM-4", ZHIPU, 4096, 0.7, false, false),

    // ─── Xiaomi MiMo (10 models) ───
    m("mimo", "mimo-v2.5-pro", "Xiaomi MiMo-V2.5 Pro", MIMO, 16384, 0.7, false, false),
    m("mimo", "mimo-v2.5", "Xiaomi MiMo-V2.5", MIMO, 16384, 0.7, false, false),
    m("mimo", "mimo-v2-omni", "Xiaomi MiMo-V2-Omni", MIMO, 8192, 0.7, false, false),
    m("mimo", "mimo-v2-pro", "Xiaomi MiMo-V2-Pro", MIMO, 16384, 0.7, false, false),
    m("mimo", "mimo-v2-flash", "Xiaomi MiMo-V2-Flash", MIMO, 8192, 0.7, false, false),
    m("mimo", "mimo-v2-tts", "Xiaomi MiMo-V2-TTS", MIMO, 4096, 0.7, false, false),
    m("mimo", "mimo-7b", "Xiaomi MiMo-7B", MIMO, 4096, 0.7, false, false),
    m("mimo", "mimo-vl-7b", "Xiaomi MiMo-VL-7B", MIMO, 4096, 0.7, false, false),
    m("mimo", "mimo-v2.5-lite", "Xiaomi MiMo-V2.5 Lite", MIMO, 4096, 0.7, false, false),
    m("mimo", "mimo-7b-0321", "Xiaomi MiMo-7B-0321", MIMO, 4096, 0.7, false, false),

    // ─── Custom API Endpoint (1 model) ───
    m("custom", "custom-model-v1", "Custom API Endpoint", CUSTOM, 2048, 0.7, false, false),
  ];
}

// ==================== TRANSFORM ====================

function transformProvider(raw: any): LLMProvider {
  return {
    id: raw.id,
    name: raw.name,
    displayName: raw.name,
    provider: raw.providerType ?? raw.provider,
    modelId: raw.modelId,
    apiKey: raw.apiKeyHint,
    apiEndpoint: raw.baseUrl ?? raw.apiEndpoint,
    enabled: raw.isActive ?? raw.enabled ?? false,
    isDefault: raw.isDefault ?? false,
    maxTokens: raw.modelConfig?.maxTokens ?? raw.maxTokens,
    temperature: raw.modelConfig?.temperature ?? raw.temperature,
    topP: raw.modelConfig?.topP ?? raw.topP,
    samplingMode: raw.modelConfig?.samplingMode ?? raw.samplingMode,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

// ==================== API ====================

export const llmConfigApi = {
  list: async (): Promise<{ data: LLMProvider[] }> => {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return { data: [...getMockProviders()] };
    }

    const response = await collectorClient.get<any>(
      LLM_CONFIG_ENDPOINTS.PROVIDERS,
      { params: { pageSize: config.limitDataMax, page: 1 } },
    );
    // collectorClient.get() returns the JSON body directly (not axios response)
    // Backend returns paginated: { items: [...], total, page, pageSize }
    const body = response as any;
    const items: any[] = Array.isArray(body) ? body : (body?.items ?? []);
    return { data: items.map(transformProvider) };
  },

  get: async (id: string): Promise<{ data: LLMProvider }> => {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const providers = getMockProviders();
      const provider = providers.find((p) => p.id === id) ?? providers[0];
      return { data: { ...provider } };
    }

    const response = await collectorClient.get<any>(
      LLM_CONFIG_ENDPOINTS.PROVIDER(id),
    );
    return { data: transformProvider(response as any) };
  },

  create: async (
    data: CreateLLMProviderRequest,
  ): Promise<{ data: LLMProvider }> => {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const mock = getMockProviders()[0];
      const newProvider: LLMProvider = {
        ...mock,
        ...data,
        provider: (data.provider as LLMProvider["provider"]) ?? mock.provider,
        id: `provider-${Date.now()}`,
        enabled: data.enabled ?? true,
        isDefault: data.isDefault ?? false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      getMockProviders().push(newProvider);
      return { data: { ...newProvider } };
    }

    // Map frontend field names to backend DTO field names
    const backendData: Record<string, any> = {
      name: data.displayName || data.name,
      providerType: data.provider,
      modelId: data.modelId,
      apiKey: data.apiKey,
      baseUrl: data.apiEndpoint || undefined,
      isDefault: data.isDefault,
      temperature: data.temperature,
      maxTokens: data.maxTokens,
      topP: data.topP,
      samplingMode: data.samplingMode,
    };
    // Remove undefined keys
    Object.keys(backendData).forEach(
      (k) => backendData[k] === undefined && delete backendData[k],
    );

    const response = await collectorClient.post<any>(
      LLM_CONFIG_ENDPOINTS.PROVIDERS,
      backendData,
    );
    return { data: transformProvider(response as any) };
  },

  update: async (
    id: string,
    data: UpdateLLMProviderRequest,
  ): Promise<{ data: LLMProvider }> => {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const providers = getMockProviders();
      const idx = providers.findIndex((p) => p.id === id);
      if (idx !== -1) {
        if (data.isDefault === true) {
          providers.forEach((p) => {
            p.isDefault = false;
          });
        }
        providers[idx] = {
          ...providers[idx],
          ...data,
          updatedAt: new Date().toISOString(),
        };
        return { data: { ...providers[idx] } };
      }
      return { data: { ...providers[0], ...data } };
    }

    // Map frontend field names to backend DTO field names
    const backendData: Record<string, any> = {};
    if (data.name !== undefined) backendData.name = data.name;
    if (data.displayName !== undefined) backendData.name = data.displayName; // displayName takes precedence
    if (data.modelId !== undefined) backendData.modelId = data.modelId;
    if (data.apiKey !== undefined) backendData.apiKey = data.apiKey;
    if (data.apiEndpoint !== undefined) backendData.baseUrl = data.apiEndpoint;
    if (data.temperature !== undefined)
      backendData.temperature = data.temperature;
    if (data.maxTokens !== undefined) backendData.maxTokens = data.maxTokens;
    if (data.topP !== undefined) backendData.topP = data.topP;
    if (data.samplingMode !== undefined) backendData.samplingMode = data.samplingMode;
    if (data.enabled !== undefined) backendData.isActive = data.enabled;
    // isDefault is NOT handled by PATCH — use /set-default endpoint instead

    const response = await collectorClient.patch<any>(
      LLM_CONFIG_ENDPOINTS.PROVIDER(id),
      backendData,
    );
    const updated = transformProvider(response as any);

    // If caller also wants to set as default, call the dedicated endpoint
    if (data.isDefault === true) {
      await collectorClient.post<any>(
        LLM_CONFIG_ENDPOINTS.PROVIDER_SET_DEFAULT(id),
      );
    }

    return { data: updated };
  },

  delete: async (id: string): Promise<void> => {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return;
    }

    await collectorClient.delete(LLM_CONFIG_ENDPOINTS.PROVIDER(id));
  },

  setDefault: async (id: string): Promise<{ data: LLMProvider }> => {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const providers = getMockProviders();
      providers.forEach((p) => {
        p.isDefault = p.id === id;
      });
      const provider = providers.find((p) => p.id === id) ?? providers[0];
      return { data: { ...provider } };
    }

    const response = await collectorClient.post<any>(
      LLM_CONFIG_ENDPOINTS.PROVIDER_SET_DEFAULT(id),
    );
    return { data: transformProvider(response as any) };
  },

  testConnection: async (
    id: string,
  ): Promise<{ success: boolean; message: string }> => {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { success: true, message: "Connection successful" };
    }

    const response = await collectorClient.post<{
      success: boolean;
      message: string;
    }>(LLM_CONFIG_ENDPOINTS.PROVIDER_TEST(id));
    const body = response as any;
    // Backend returns { valid, message }
    return {
      success: body?.success ?? body?.valid ?? false,
      message: body?.message || "Connection test completed",
    };
  },

  // Test a raw API key before saving a provider
  testKey: async (data: {
    providerType: string;
    apiKey: string;
    baseUrl?: string;
  }): Promise<{ success: boolean; message: string }> => {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // Simulate basic format validation in mock mode
      const isLikelyValid =
        data.apiKey.length > 10 &&
        (data.providerType !== "anthropic" ||
          data.apiKey.startsWith("sk-ant")) &&
        (data.providerType !== "openai" || data.apiKey.startsWith("sk-")) &&
        (data.providerType !== "mistral" || data.apiKey.length > 20) &&
        (data.providerType !== "grok" || data.apiKey.length > 20) &&
        (data.providerType !== "kimi" ||
          data.apiKey.startsWith("sk-") ||
          data.apiKey.length > 20);
      return {
        success: isLikelyValid,
        message: isLikelyValid
          ? "API key is valid"
          : "API key format looks invalid",
      };
    }

    const response = await collectorClient.post<{
      valid: boolean;
      message: string;
    }>(LLM_CONFIG_ENDPOINTS.PROVIDER_TEST_KEY, data);
    const body = response as any;
    return {
      success: body?.success ?? body?.valid ?? false,
      message: body?.message || "Connection test completed",
    };
  },
};

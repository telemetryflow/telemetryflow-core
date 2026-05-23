/**
 * ProviderType Value Object
 * Represents supported LLM provider types
 */

export enum ProviderTypeEnum {
  ANTHROPIC = "anthropic",
  CLAUDE = "claude", // Alias for anthropic
  OPENAI = "openai",
  GOOGLE = "google", // Alias for gemini
  GEMINI = "gemini",
  DEEPSEEK = "deepseek",
  QWEN = "qwen",
  OLLAMA = "ollama",
  MISTRAL = "mistral",
  GROK = "grok",
  KIMI = "kimi",
  ZIPU = "zhipu",
  MIMO = "mimo",
  OPENROUTER = "openrouter",
  CUSTOM = "custom",
}

export class ProviderType {
  private constructor(private readonly value: ProviderTypeEnum) {
    Object.freeze(this);
  }

  static anthropic(): ProviderType {
    return new ProviderType(ProviderTypeEnum.ANTHROPIC);
  }

  static claude(): ProviderType {
    return new ProviderType(ProviderTypeEnum.ANTHROPIC); // Map claude to anthropic
  }

  static openai(): ProviderType {
    return new ProviderType(ProviderTypeEnum.OPENAI);
  }

  static google(): ProviderType {
    return new ProviderType(ProviderTypeEnum.GOOGLE);
  }

  static gemini(): ProviderType {
    return new ProviderType(ProviderTypeEnum.GOOGLE); // Map gemini to google
  }

  static deepseek(): ProviderType {
    return new ProviderType(ProviderTypeEnum.DEEPSEEK);
  }

  static qwen(): ProviderType {
    return new ProviderType(ProviderTypeEnum.QWEN);
  }

  static ollama(): ProviderType {
    return new ProviderType(ProviderTypeEnum.OLLAMA);
  }

  static mistral(): ProviderType {
    return new ProviderType(ProviderTypeEnum.MISTRAL);
  }

  static grok(): ProviderType {
    return new ProviderType(ProviderTypeEnum.GROK);
  }

  static kimi(): ProviderType {
    return new ProviderType(ProviderTypeEnum.KIMI);
  }

  static zhipu(): ProviderType {
    return new ProviderType(ProviderTypeEnum.ZIPU);
  }

  static mimo(): ProviderType {
    return new ProviderType(ProviderTypeEnum.MIMO);
  }

  static openrouter(): ProviderType {
    return new ProviderType(ProviderTypeEnum.OPENROUTER);
  }

  static custom(): ProviderType {
    return new ProviderType(ProviderTypeEnum.CUSTOM);
  }

  static fromString(value: string): ProviderType {
    const normalized = value.toLowerCase();
    const aliasMap: Record<string, ProviderTypeEnum> = {
      claude: ProviderTypeEnum.ANTHROPIC,
      anthropic: ProviderTypeEnum.ANTHROPIC,
      gemini: ProviderTypeEnum.GOOGLE,
      google: ProviderTypeEnum.GOOGLE,
      openai: ProviderTypeEnum.OPENAI,
      deepseek: ProviderTypeEnum.DEEPSEEK,
      qwen: ProviderTypeEnum.QWEN,
      ollama: ProviderTypeEnum.OLLAMA,
      mistral: ProviderTypeEnum.MISTRAL,
      grok: ProviderTypeEnum.GROK,
      kimi: ProviderTypeEnum.KIMI,
      zhipu: ProviderTypeEnum.ZIPU,
      mimo: ProviderTypeEnum.MIMO,
      openrouter: ProviderTypeEnum.OPENROUTER,
      custom: ProviderTypeEnum.CUSTOM,
    };

    const enumValue = aliasMap[normalized];
    if (!enumValue) {
      throw new Error(`Invalid provider type: ${value}`);
    }
    return new ProviderType(enumValue);
  }

  getValue(): ProviderTypeEnum {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: ProviderType): boolean {
    return this.value === other.value;
  }

  getDefaultBaseUrl(): string {
    switch (this.value) {
      case ProviderTypeEnum.ANTHROPIC:
      case ProviderTypeEnum.CLAUDE:
        return "https://api.anthropic.com";
      case ProviderTypeEnum.OPENAI:
        return "https://api.openai.com/v1";
      case ProviderTypeEnum.GOOGLE:
      case ProviderTypeEnum.GEMINI:
        return "https://generativelanguage.googleapis.com";
      case ProviderTypeEnum.DEEPSEEK:
        return "https://api.deepseek.com";
      case ProviderTypeEnum.QWEN:
        return "https://dashscope.aliyuncs.com/compatible-mode/v1";
      case ProviderTypeEnum.OLLAMA:
        return "http://localhost:11434/v1";
      case ProviderTypeEnum.MISTRAL:
        return "https://api.mistral.ai/v1";
      case ProviderTypeEnum.GROK:
        return "https://api.x.ai/v1";
      case ProviderTypeEnum.KIMI:
        return "https://api.moonshot.cn/v1";
      case ProviderTypeEnum.ZIPU:
        return "https://open.bigmodel.cn/api/paas/v4";
      case ProviderTypeEnum.MIMO:
        return "https://platform.xiaomimimo.com/v1";
      case ProviderTypeEnum.OPENROUTER:
        return "https://openrouter.ai/api/v1";
      case ProviderTypeEnum.CUSTOM:
      default:
        return "";
    }
  }

  getDefaultModels(): string[] {
    switch (this.value) {
      case ProviderTypeEnum.ANTHROPIC:
      case ProviderTypeEnum.CLAUDE:
        // Verified from https://docs.anthropic.com/en/docs/about-claude/models
        return [
          "claude-opus-4-6",
          "claude-opus-4-5",
          "claude-sonnet-4-6",
          "claude-sonnet-4-5",
          "claude-haiku-4-5",
          "claude-haiku-4-5-20251001",
        ];
      case ProviderTypeEnum.OPENAI:
        // Verified from platform.openai.com/docs/models (Mar 2026)
        return [
          "gpt-5",
          "gpt-4.1",
          "gpt-4.1-mini",
          "o4-mini",
          "o3",
          "gpt-4o",
          "gpt-3.5-turbo",
        ];
      case ProviderTypeEnum.GOOGLE:
      case ProviderTypeEnum.GEMINI:
        // Verified from https://ai.google.dev/gemini-api/docs/models
        return [
          "gemini-3.1-pro-preview",
          "gemini-3-pro-preview",
          "gemini-3-flash-preview",
          "gemini-3.1-flash-lite-preview",
          "gemini-2.5-pro",
          "gemini-2.5-flash",
          "gemini-2.5-flash-lite",
          "gemini-2.0-flash",
          "gemini-2.0-flash-lite",
          "gemini-1.5-pro",
          "gemini-1.5-flash",
          "gemini-1.5-flash-8b",
        ];
      case ProviderTypeEnum.DEEPSEEK:
        // Verified from api-docs.deepseek.com — only 2 real model IDs
        return [
          "deepseek-chat",
          "deepseek-reasoner",
        ];
      case ProviderTypeEnum.QWEN:
        // Verified from DashScope API — qwen3 series confirmed
        return [
          "qwen3-max",
          "qwen3-235b-a22b",
          "qwen3-32b",
          "qwen-max",
          "qwen-plus",
          "qwen-turbo",
          "qwen2.5-72b-instruct",
          "qwen2.5-32b-instruct",
        ];
      case ProviderTypeEnum.OLLAMA:
        return [
          "llama3.3:70b",
          "llama3.2",
          "llama3.1:8b",
          "mistral:7b",
          "codellama:13b",
          "phi3:medium",
        ];
      case ProviderTypeEnum.MISTRAL:
        return [
          "mistral-medium-2508",
          "mistral-large-2411",
          "mistral-small-2506",
          "codestral-2508",
          "devstral-small-2507",
          "ministral-3b-2410",
        ];
      case ProviderTypeEnum.GROK:
        return [
          "grok-4.20-0309-reasoning",
          "grok-4.20-0309-non-reasoning",
          "grok-4.20-multi-agent-0309",
          "grok-4-1-fast-reasoning",
          "grok-4-1-fast-non-reasoning",
          "grok-3",
        ];
      case ProviderTypeEnum.KIMI:
        return [
          "kimi-k2.6",
          "kimi-k2.5",
          "moonshot-v1-128k",
          "moonshot-v1-32k",
          "kimi-k2-thinking",
          "kimi-k2-turbo-preview",
        ];
      case ProviderTypeEnum.ZIPU:
        return [
          "glm-5.1",
          "glm-5",
          "glm-4.7",
          "glm-4.5",
          "glm-4.5-air",
          "glm-4-flash",
        ];
      case ProviderTypeEnum.MIMO:
        return [
          "mimo-v2-pro",
          "mimo-v2-flash",
          "mimo-v2-omni",
          "mimo-v2-tts",
          "mimo-7b",
          "mimo-vl-7b",
        ];
      case ProviderTypeEnum.OPENROUTER:
        return [
          "anthropic/claude-opus-4",
          "anthropic/claude-sonnet-4",
          "openai/gpt-4o",
          "openai/gpt-4.1",
          "google/gemini-2.5-pro",
          "google/gemini-2.5-flash",
          "deepseek/deepseek-chat",
          "meta-llama/llama-4-maverick",
        ];
      case ProviderTypeEnum.CUSTOM:
      default:
        return [];
    }
  }

  getDisplayName(): string {
    switch (this.value) {
      case ProviderTypeEnum.ANTHROPIC:
      case ProviderTypeEnum.CLAUDE:
        return "Claude (Anthropic)";
      case ProviderTypeEnum.OPENAI:
        return "ChatGPT (OpenAI)";
      case ProviderTypeEnum.GOOGLE:
      case ProviderTypeEnum.GEMINI:
        return "Gemini (Google)";
      case ProviderTypeEnum.DEEPSEEK:
        return "DeepSeek";
      case ProviderTypeEnum.QWEN:
        return "Qwen (Alibaba)";
      case ProviderTypeEnum.OLLAMA:
        return "Ollama (Local)";
      case ProviderTypeEnum.MISTRAL:
        return "Mistral AI";
      case ProviderTypeEnum.GROK:
        return "Grok (xAI)";
      case ProviderTypeEnum.KIMI:
        return "Kimi (Moonshot)";
      case ProviderTypeEnum.ZIPU:
        return "GLM (Z.ai)";
      case ProviderTypeEnum.MIMO:
        return "MiMo (Xiaomi)";
      case ProviderTypeEnum.OPENROUTER:
        return "OpenRouter";
      case ProviderTypeEnum.CUSTOM:
        return "Custom Provider";
      default:
        return this.value;
    }
  }

  requiresBaseUrl(): boolean {
    return (
      this.value === ProviderTypeEnum.CUSTOM ||
      this.value === ProviderTypeEnum.OLLAMA
    );
  }
}

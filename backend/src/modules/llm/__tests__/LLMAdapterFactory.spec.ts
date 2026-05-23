import { LLMAdapterFactory } from "../infrastructure/providers/LLMAdapterFactory";
import { OpenAIAdapter } from "../infrastructure/providers/OpenAIAdapter";
import { ClaudeAdapter } from "../infrastructure/providers/ClaudeAdapter";
import { GeminiAdapter } from "../infrastructure/providers/GeminiAdapter";
import { DeepSeekAdapter } from "../infrastructure/providers/DeepSeekAdapter";
import { QwenAdapter } from "../infrastructure/providers/QwenAdapter";
import { OllamaAdapter } from "../infrastructure/providers/OllamaAdapter";
import { CustomAdapter } from "../infrastructure/providers/CustomAdapter";

describe("LLMAdapterFactory", () => {
  let factory: LLMAdapterFactory;
  let openaiAdapter: OpenAIAdapter;
  let setBaseUrlSpy: jest.SpyInstance;

  beforeEach(() => {
    openaiAdapter = new OpenAIAdapter();
    setBaseUrlSpy = jest.spyOn(openaiAdapter, "setBaseUrl").mockReturnThis();
    factory = new LLMAdapterFactory(
      new ClaudeAdapter(),
      openaiAdapter,
      new GeminiAdapter(),
      new DeepSeekAdapter(),
      new QwenAdapter(),
      new OllamaAdapter(),
      new CustomAdapter(),
    );
  });

  afterEach(() => {
    setBaseUrlSpy.mockRestore();
  });

  describe("isSupported", () => {
    it.each([
      "anthropic",
      "claude",
      "openai",
      "google",
      "gemini",
      "deepseek",
      "qwen",
      "ollama",
      "mistral",
      "grok",
      "kimi",
      "zhipu",
      "mimo",
      "openrouter",
      "custom",
    ])("should support %s", (provider) => {
      expect(factory.isSupported(provider)).toBe(true);
    });

    it("should return false for unsupported provider", () => {
      expect(factory.isSupported("nonexistent")).toBe(false);
    });
  });

  describe("getAdapter - OpenAI-compatible providers resolve correct default base URL", () => {
    it("should resolve zhipu to open.bigmodel.cn", () => {
      factory.getAdapter("zhipu");
      expect(setBaseUrlSpy).toHaveBeenCalledWith(
        "https://open.bigmodel.cn/api/paas/v4",
      );
    });

    it("should resolve mistral to api.mistral.ai", () => {
      factory.getAdapter("mistral");
      expect(setBaseUrlSpy).toHaveBeenCalledWith("https://api.mistral.ai/v1");
    });

    it("should resolve grok to api.x.ai", () => {
      factory.getAdapter("grok");
      expect(setBaseUrlSpy).toHaveBeenCalledWith("https://api.x.ai/v1");
    });

    it("should resolve kimi to api.moonshot.cn", () => {
      factory.getAdapter("kimi");
      expect(setBaseUrlSpy).toHaveBeenCalledWith("https://api.moonshot.cn/v1");
    });

    it("should resolve mimo to xiaomimimo.com", () => {
      factory.getAdapter("mimo");
      expect(setBaseUrlSpy).toHaveBeenCalledWith(
        "https://platform.xiaomimimo.com/v1",
      );
    });

    it("should resolve openrouter to openrouter.ai", () => {
      factory.getAdapter("openrouter");
      expect(setBaseUrlSpy).toHaveBeenCalledWith("https://openrouter.ai/api/v1");
    });

    it("should use explicit baseUrl over default", () => {
      factory.getAdapter("zhipu", "https://custom-proxy.example.com/v1");
      expect(setBaseUrlSpy).toHaveBeenCalledWith(
        "https://custom-proxy.example.com/v1",
      );
    });

    it("should use explicit baseUrl for mistral", () => {
      factory.getAdapter("mistral", "https://my-proxy.com/v1");
      expect(setBaseUrlSpy).toHaveBeenCalledWith("https://my-proxy.com/v1");
    });
  });

  describe("getAdapter - dedicated adapters", () => {
    it("should return ClaudeAdapter for anthropic", () => {
      const adapter = factory.getAdapter("anthropic");
      expect(adapter).toBeInstanceOf(ClaudeAdapter);
    });

    it("should return ClaudeAdapter for claude (alias)", () => {
      const adapter = factory.getAdapter("claude");
      expect(adapter).toBeInstanceOf(ClaudeAdapter);
    });

    it("should return OpenAIAdapter for openai without setBaseUrl call", () => {
      const adapter = factory.getAdapter("openai");
      expect(adapter).toBeInstanceOf(OpenAIAdapter);
      expect(setBaseUrlSpy).not.toHaveBeenCalled();
    });

    it("should return GeminiAdapter for google", () => {
      const adapter = factory.getAdapter("google");
      expect(adapter).toBeInstanceOf(GeminiAdapter);
    });

    it("should return DeepSeekAdapter for deepseek", () => {
      const adapter = factory.getAdapter("deepseek");
      expect(adapter).toBeInstanceOf(DeepSeekAdapter);
    });

    it("should return QwenAdapter for qwen", () => {
      const adapter = factory.getAdapter("qwen");
      expect(adapter).toBeInstanceOf(QwenAdapter);
    });

    it("should return OllamaAdapter for ollama", () => {
      const adapter = factory.getAdapter("ollama");
      expect(adapter).toBeInstanceOf(OllamaAdapter);
    });

    it("should return CustomAdapter for custom with baseUrl", () => {
      const adapter = factory.getAdapter("custom", "https://my-llm.com/v1");
      expect(adapter).toBeInstanceOf(CustomAdapter);
    });

    it("should throw for custom without baseUrl", () => {
      expect(() => factory.getAdapter("custom")).toThrow(
        "Custom provider requires a base URL",
      );
    });

    it("should throw for unsupported provider", () => {
      expect(() => factory.getAdapter("nonexistent")).toThrow(
        "Unsupported provider type",
      );
    });
  });

  describe("getSupportedProviders", () => {
    it("should include all 13 provider types", () => {
      const providers = factory.getSupportedProviders();
      expect(providers).toHaveLength(13);
      expect(providers).toEqual(
        expect.arrayContaining(["zhipu", "mistral", "grok", "kimi", "mimo", "openrouter"]),
      );
    });
  });
});

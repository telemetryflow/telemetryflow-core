import { OpenAIAdapter } from "../infrastructure/providers/OpenAIAdapter";

// jest.mock is hoisted above imports — everything it uses must be defined inline
const mockModelsList = jest.fn();

jest.mock("openai", () => {
  class AuthenticationError extends Error {
    status = 401;
    constructor(message: string) {
      super(message);
      this.name = "AuthenticationError";
    }
  }

  const MockFn: any = jest
    .fn()
    .mockImplementation((opts: Record<string, string>) => ({
      models: { list: mockModelsList },
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: "hi" }, finish_reason: "stop" }],
            model: "test-model",
            usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
          }),
        },
      },
    }));
  MockFn.AuthenticationError = AuthenticationError;
  return { __esModule: true, default: MockFn };
});

// Re-export for use in tests
const MockAuthError = jest.requireMock("openai").default
  .AuthenticationError as typeof Error;

describe("OpenAIAdapter", () => {
  let adapter: OpenAIAdapter;
  let MockOpenAI: jest.Mock;

  beforeEach(() => {
    adapter = new OpenAIAdapter();
    MockOpenAI = jest.requireMock("openai").default;
    MockOpenAI.mockClear();
    mockModelsList.mockReset().mockResolvedValue({ data: [] });
  });

  describe("setBaseUrl", () => {
    it("should return this for chaining", () => {
      const result = adapter.setBaseUrl("https://open.bigmodel.cn/api/paas/v4");
      expect(result).toBe(adapter);
    });
  });

  describe("validateApiKey", () => {
    it("should return true when models.list succeeds", async () => {
      const result = await adapter.validateApiKey("valid-key");
      expect(result).toBe(true);
    });

    it("should return false on 401 authentication error", async () => {
      mockModelsList.mockRejectedValueOnce(
        new MockAuthError("Invalid API key"),
      );
      const result = await adapter.validateApiKey("bad-key");
      expect(result).toBe(false);
    });

    it("should return true on 429 rate limit (key is valid)", async () => {
      mockModelsList.mockRejectedValueOnce(new Error("Rate limit"));
      const result = await adapter.validateApiKey("rate-limited-key");
      expect(result).toBe(true);
    });

    it("should return true on network error (cannot confirm invalid)", async () => {
      mockModelsList.mockRejectedValueOnce(new Error("ECONNREFUSED"));
      const result = await adapter.validateApiKey("maybe-valid-key");
      expect(result).toBe(true);
    });

    it("should pass apiKey without baseURL when no custom baseUrl set", async () => {
      await adapter.validateApiKey("sk-test");
      expect(MockOpenAI).toHaveBeenCalledWith({ apiKey: "sk-test" });
    });

    it("should pass baseURL to OpenAI for Zhipu provider", async () => {
      adapter.setBaseUrl("https://open.bigmodel.cn/api/paas/v4");
      await adapter.validateApiKey("zhipu-key");
      expect(MockOpenAI).toHaveBeenCalledWith({
        apiKey: "zhipu-key",
        baseURL: "https://open.bigmodel.cn/api/paas/v4",
      });
    });

    it("should pass baseURL to OpenAI for Mistral provider", async () => {
      adapter.setBaseUrl("https://api.mistral.ai/v1");
      await adapter.validateApiKey("mistral-key");
      expect(MockOpenAI).toHaveBeenCalledWith({
        apiKey: "mistral-key",
        baseURL: "https://api.mistral.ai/v1",
      });
    });
  });

  describe("getAvailableModels", () => {
    it("should pass custom baseURL to OpenAI client", async () => {
      adapter.setBaseUrl("https://open.bigmodel.cn/api/paas/v4");
      await adapter.getAvailableModels("zhipu-key");
      expect(MockOpenAI).toHaveBeenCalledWith({
        apiKey: "zhipu-key",
        baseURL: "https://open.bigmodel.cn/api/paas/v4",
      });
    });

    it("should return default list on error", async () => {
      mockModelsList.mockRejectedValueOnce(new Error("fail"));
      const models = await adapter.getAvailableModels("key");
      expect(models).toContain("gpt-4o");
    });
  });
});

# LLM Settings Module

This module provides the BYOLLM (Bring Your Own LLM) feature for configuring AI chatbot providers.

## Features

- **Multi-Provider Support**: Configure multiple LLM providers (Anthropic, OpenAI, Google, DeepSeek, Qwen, Ollama, Custom)
- **Provider Management**: Create, edit, delete, and test LLM providers
- **Default Provider**: Set a default provider for the chatbot
- **Connection Testing**: Test API connectivity before saving
- **Enable/Disable**: Toggle providers on/off without deleting
- **Search & Filter**: Search providers by name, model, or provider type

## Supported Providers

1. **Anthropic Claude** - Claude Sonnet, Opus, Haiku models
2. **OpenAI GPT** - GPT-4, GPT-4o, GPT-3.5 models
3. **Google Gemini** - Gemini Pro, Flash models
4. **DeepSeek** - DeepSeek Chat models
5. **Qwen (Alibaba)** - Qwen Max, Plus models
6. **Ollama (Local)** - Self-hosted local models
7. **Custom** - Any OpenAI-compatible API

## Configuration Options

Each provider can be configured with:

- **Display Name**: Human-readable name
- **Model ID**: Specific model identifier
- **API Key**: Authentication key (optional for local)
- **API Endpoint**: Custom endpoint URL (optional)
- **Max Tokens**: Maximum response length
- **Temperature**: Creativity level (0-2)
- **Top P**: Nucleus sampling parameter (0-1)

## File Structure

```
llm/
├── index.vue           # Main LLM providers management page
└── README.md          # This file
```

## API Integration

Uses `@/api/llm-config.ts` for backend communication:

- `GET /api/llm/providers` - List all providers
- `POST /api/llm/providers` - Create new provider
- `PATCH /api/llm/providers/:id` - Update provider
- `DELETE /api/llm/providers/:id` - Delete provider
- `POST /api/llm/providers/:id/set-default` - Set as default
- `POST /api/llm/providers/:id/test` - Test connection

## Usage

Navigate to Settings > LLM Providers to manage AI chatbot configurations.

## Design Pattern

Follows the "channel design" pattern similar to notification channels, with:

- Card-based layout for each provider
- Color-coded provider icons
- Quick actions (Test, Set Default, Edit, Delete)
- Enable/disable toggle
- Default provider badge

# LLM Integration Guide

## Overview

The LLM (BYOLLM - Bring Your Own LLM) feature is fully integrated into TelemetryFlow Platform with two main components:

1. **LLM Provider Management** - Settings page for CRUD operations on LLM providers
2. **AI Chatbot** - Global floating chatbot that uses configured providers

## Architecture

```mermaid
graph TB
    subgraph "Frontend Application"
        ML[MainLayout.vue]
        CB[ChatBox Component<br/>Floating AI Assistant]
        SP[Settings Page<br/>LLM Provider Management]

        ML -->|Includes| CB
        ML -->|Route| SP
        CB -->|Uses| Store
        SP -->|Manages| Store
    end

    subgraph "State Management"
        Store[LLM Store<br/>useLLMStore]
        Store -->|Loads| Providers[Provider List]
        Store -->|Manages| Chat[Chat State]
        Store -->|Handles| Stream[Message Streaming]
    end

    subgraph "API Layer"
        API[llm-config.ts<br/>API Client]
        API -->|CRUD| Backend[Backend API]
    end

    subgraph "Backend Services"
        Backend -->|Manages| DB[(Database<br/>Providers)]
        Backend -->|Connects| LLM1[Anthropic Claude]
        Backend -->|Connects| LLM2[OpenAI GPT]
        Backend -->|Connects| LLM3[Google Gemini]
        Backend -->|Connects| LLM4[DeepSeek]
        Backend -->|Connects| LLM5[Qwen]
        Backend -->|Connects| LLM6[Ollama Local]
        Backend -->|Connects| LLM7[Custom API]
    end

    Store -->|Calls| API

    style CB fill:#e0e7ff
    style SP fill:#ddd6fe
    style Store fill:#fef3c7
    style Backend fill:#d1fae5
    style LLM1 fill:#fecaca
    style LLM2 fill:#fecaca
    style LLM3 fill:#fecaca
    style LLM4 fill:#fecaca
    style LLM5 fill:#fecaca
    style LLM6 fill:#fecaca
    style LLM7 fill:#fecaca
```

## Components

### Component Interaction Flow

```mermaid
sequenceDiagram
    participant U as User
    participant CB as ChatBox
    participant Store as LLM Store
    participant API as API Client
    participant BE as Backend
    participant LLM as LLM Provider

    Note over U,LLM: Initial Setup
    U->>CB: Click AI Button
    CB->>Store: openChat()
    Store->>API: loadProviders()
    API->>BE: GET /api/llm/providers
    BE-->>API: Provider List
    API-->>Store: Providers
    Store-->>CB: Display Chat

    Note over U,LLM: Send Message
    U->>CB: Type & Send Message
    CB->>Store: sendMessageStream(message)
    Store->>API: POST /api/llm/chat
    API->>BE: Stream Request
    BE->>LLM: API Call
    LLM-->>BE: Stream Response
    BE-->>API: SSE Stream
    API-->>Store: Message Chunks
    Store-->>CB: Update UI
    CB-->>U: Display Response
```

### Provider Management Flow

```mermaid
sequenceDiagram
    participant U as User
    participant SP as Settings Page
    participant API as API Client
    participant BE as Backend
    participant DB as Database

    Note over U,DB: Create Provider
    U->>SP: Click "Add Provider"
    U->>SP: Fill Form & Submit
    SP->>API: create(providerData)
    API->>BE: POST /api/llm/providers
    BE->>DB: Insert Provider
    DB-->>BE: Success
    BE-->>API: Provider Created
    API-->>SP: Success
    SP-->>U: Show Success Message

    Note over U,DB: Test Connection
    U->>SP: Click "Test"
    SP->>API: testConnection(providerId)
    API->>BE: POST /api/llm/providers/:id/test
    BE->>BE: Validate API Key
    BE-->>API: Test Result
    API-->>SP: Result
    SP-->>U: Show Result
```

### 1. LLM Provider Management (`/settings/ai-assistant`)

**Location:** `frontend/src/views/settings/llm/index.vue`

**Features:**

- Create, Read, Update, Delete LLM providers
- Support for 7 provider types:
  - Anthropic Claude
  - OpenAI GPT
  - Google Gemini
  - DeepSeek
  - Qwen (Alibaba)
  - Ollama (Local)
  - Custom (OpenAI-compatible)
- Set default provider
- Test API connection
- Enable/disable providers
- Search and filter
- Card-based design (similar to notification channels)

**Configuration Options:**

- Display Name
- Model ID
- API Key (encrypted)
- API Endpoint (optional)
- Max Tokens
- Temperature (0-2)
- Top P (0-1)

### 2. AI Chatbot Component

**Location:** `frontend/src/components/llm/ChatBox.vue`

**Features:**

- Floating button (bottom-right)
- Multi-tab conversations
- File attachments (images, documents)
- Markdown support
- Streaming responses
- Context-aware suggestions
- Fullscreen mode
- Minimize/maximize
- Provider selection dropdown
- Responsive design (mobile-friendly)

**Integration:**

- Automatically loads providers from settings
- Uses default provider for conversations
- Can switch providers on-the-fly
- Persists conversation history per tab

## API Integration

### Backend Endpoints

```typescript
// Provider Management
GET    /api/llm/providers           // List all providers
POST   /api/llm/providers           // Create provider
GET    /api/llm/providers/:id       // Get provider details
PATCH  /api/llm/providers/:id       // Update provider
DELETE /api/llm/providers/:id       // Delete provider
POST   /api/llm/providers/:id/set-default  // Set as default
POST   /api/llm/providers/:id/test  // Test connection

// Chat
POST   /api/llm/chat                // Send message (streaming)
```

### API Client

**Location:** `frontend/src/api/llm-config.ts`

```typescript
import { llmConfigApi } from "@/api/llm-config";

// List providers
const { data } = await llmConfigApi.list();

// Create provider
await llmConfigApi.create({
  name: "my-provider",
  displayName: "My Claude Provider",
  provider: "anthropic",
  modelId: "claude-sonnet-4-20250514",
  apiKey: "sk-...",
  enabled: true,
  isDefault: true,
});

// Test connection
const result = await llmConfigApi.testConnection(providerId);
```

## Store Integration

**Location:** `frontend/src/store/llm.ts`

The LLM store manages:

- Provider list and default provider
- Chat state (open/minimized)
- Multi-tab conversations
- Message streaming
- Context detection

```typescript
import { useLLMStore } from "@/store/llm";

const llmStore = useLLMStore();

// Open chatbot
llmStore.openChat();

// Send message
llmStore.sendMessageStream("Analyze recent errors");

// Load providers
await llmStore.loadProviders();
```

## Usage Examples

### 1. Access Settings

Navigate to: **Settings > AI Assistant** (`/settings/ai-assistant`)

### 2. Configure Provider

1. Click "Add Provider"
2. Select provider type (e.g., Anthropic Claude)
3. Enter display name and model ID
4. Add API key
5. Configure parameters (temperature, max tokens)
6. Enable and set as default
7. Test connection

### 3. Use Chatbot

1. Click floating AI button (bottom-right)
2. Select provider from dropdown (if multiple)
3. Type question or use quick suggestions
4. Attach files if needed (optional)
5. Send message

### 4. Multi-Tab Conversations

1. Click "+" button in tab bar
2. Switch between tabs
3. Close tabs with "×" button
4. Each tab maintains separate conversation

## Responsive Design

### Responsive Breakpoints Diagram

```mermaid
graph LR
    subgraph "Mobile < 768px"
        M1[Full Width<br/>Bottom Sheet]
        M2[75vh Height]
        M3[Larger Touch<br/>Targets]
        M4[Safe Area<br/>Padding]
    end

    subgraph "Tablet 768px - 1023px"
        T1[480px Width]
        T2[560px Height]
        T3[2-Column<br/>Card Grid]
    end

    subgraph "Desktop 1024px+"
        D1[520px Width]
        D2[600px Height]
        D3[Multi-Column<br/>Layout]
    end

    M1 --> T1
    T1 --> D1

    style M1 fill:#fecaca
    style M2 fill:#fecaca
    style M3 fill:#fecaca
    style M4 fill:#fecaca
    style T1 fill:#fef3c7
    style T2 fill:#fef3c7
    style T3 fill:#fef3c7
    style D1 fill:#d1fae5
    style D2 fill:#d1fae5
    style D3 fill:#d1fae5
```

### Desktop (1024px+)

- Chatbot: 520px × 600px
- Settings: Full width with card grid

### Tablet (768px - 1023px)

- Chatbot: 480px × 560px
- Settings: 2-column card grid

### Mobile (< 768px)

- Chatbot: Full width bottom sheet (75vh)
- Settings: Single column
- Larger touch targets
- Safe area padding for notched phones

## Security

### Security Flow Diagram

```mermaid
graph TB
    subgraph "Frontend Security"
        F1[User Input<br/>Validation]
        F2[File Upload<br/>Validation]
        F3[API Key<br/>Masking]
    end

    subgraph "Transport Security"
        T1[HTTPS Only]
        T2[CORS<br/>Configuration]
        T3[Rate Limiting]
    end

    subgraph "Backend Security"
        B1[API Key<br/>Encryption]
        B2[Input<br/>Sanitization]
        B3[Authentication<br/>& Authorization]
        B4[Audit Logging]
    end

    subgraph "Storage Security"
        S1[Encrypted<br/>Database]
        S2[Key Hints<br/>Only Display]
        S3[Secure<br/>Deletion]
    end

    F1 --> T1
    F2 --> T1
    F3 --> T1
    T1 --> B1
    T2 --> B2
    T3 --> B3
    B1 --> S1
    B2 --> S2
    B3 --> S3
    B4 --> S1

    style F1 fill:#fecaca
    style F2 fill:#fecaca
    style F3 fill:#fecaca
    style T1 fill:#fef3c7
    style T2 fill:#fef3c7
    style T3 fill:#fef3c7
    style B1 fill:#e0e7ff
    style B2 fill:#e0e7ff
    style B3 fill:#e0e7ff
    style B4 fill:#e0e7ff
    style S1 fill:#d1fae5
    style S2 fill:#d1fae5
    style S3 fill:#d1fae5
```

### Security Features

- API keys are encrypted before storage
- Keys are never displayed in full (only hints)
- HTTPS required for API endpoints
- Rate limiting on chat endpoints
- File upload validation and size limits

## Mock Data

**Location:** `frontend/src/mocks/llm-providers.ts`

Mock providers for development/testing:

- Anthropic Claude (default)
- OpenAI GPT-4o
- Google Gemini Flash
- DeepSeek Chat
- Qwen Max
- Ollama (local)

## Troubleshooting

### Chatbot not appearing

- Check MainLayout.vue includes `<ChatBox />`
- Verify LLM store is initialized
- Check browser console for errors

### No providers available

- Navigate to Settings > AI Assistant
- Add at least one provider
- Set one as default
- Enable the provider

### Connection test fails

- Verify API key is correct
- Check API endpoint URL
- Ensure network connectivity
- Check backend logs

### Streaming not working

- Verify backend supports SSE (Server-Sent Events)
- Check CORS configuration
- Ensure provider API supports streaming

## Future Enhancements

- [ ] Voice input/output
- [ ] Code syntax highlighting in responses
- [ ] Export conversation history
- [ ] Custom system prompts per context
- [ ] Provider usage analytics
- [ ] Cost tracking per provider
- [ ] Conversation search
- [ ] Shared conversations (team feature)

## Related Files

### File Structure Diagram

```mermaid
graph LR
    subgraph "Views"
        V1[settings/llm/index.vue<br/>Provider Management]
        V2[settings/llm/README.md<br/>Documentation]
        V3[settings/llm/INTEGRATION.md<br/>Integration Guide]
    end

    subgraph "Components"
        C1[llm/ChatBox.vue<br/>Main Chatbot]
        C2[llm/ChatMessage.vue<br/>Message Display]
        C3[llm/RichTextInput.vue<br/>Input Component]
        C4[llm/index.ts<br/>Exports]
    end

    subgraph "API & Store"
        A1[api/llm-config.ts<br/>API Client]
        S1[store/llm.ts<br/>State Management]
    end

    subgraph "Composables"
        CO1[composables/useLLMContext.ts<br/>Context Detection]
        CO2[composables/useAIChatbot.ts<br/>Chatbot Helpers]
    end

    subgraph "Types & Mocks"
        T1[types/llm.ts<br/>TypeScript Types]
        M1[mocks/llm-providers.ts<br/>Mock Data]
    end

    V1 -->|Uses| A1
    V1 -->|Uses| S1
    C1 -->|Uses| A1
    C1 -->|Uses| S1
    C1 -->|Uses| C2
    C1 -->|Uses| C3
    C1 -->|Uses| CO1
    S1 -->|Uses| A1
    A1 -->|Uses| T1
    S1 -->|Uses| T1

    style V1 fill:#ddd6fe
    style C1 fill:#e0e7ff
    style A1 fill:#fef3c7
    style S1 fill:#fef3c7
    style T1 fill:#fecaca
    style M1 fill:#fecaca
```

### Detailed File List

```
frontend/src/
├── views/settings/llm/
│   ├── index.vue              # Provider management UI
│   ├── README.md              # Feature documentation
│   └── INTEGRATION.md         # This file
├── components/llm/
│   ├── ChatBox.vue            # Main chatbot component
│   ├── ChatMessage.vue        # Message display
│   ├── RichTextInput.vue      # Input with markdown
│   └── index.ts               # Component exports
├── api/
│   └── llm-config.ts          # API client
├── store/
│   └── llm.ts                 # State management
├── composables/
│   ├── useLLMContext.ts       # Context detection
│   └── useAIChatbot.ts        # Chatbot helpers
├── mocks/
│   └── llm-providers.ts       # Mock data
└── types/
    └── llm.ts                 # TypeScript types
```

## Support

For issues or questions:

1. Check this documentation
2. Review backend API documentation
3. Check browser console for errors
4. Review backend logs
5. Contact development team

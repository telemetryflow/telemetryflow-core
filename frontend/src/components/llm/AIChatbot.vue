<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from "vue";
import { Icon } from "@iconify/vue";
import { useMessage } from "naive-ui";
import { llmConfigApi, type LLMProvider } from "@/api/llm-config";
import { llmApi } from "@/api/llm";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

const message = useMessage();
const isOpen = ref(false);
const isMinimized = ref(false);
const isLoading = ref(false);
const userInput = ref("");
const messages = ref<Message[]>([]);
const chatContainer = ref<HTMLElement | null>(null);
const providers = ref<LLMProvider[]>([]);
const selectedProvider = ref<string>("");

const defaultProvider = computed(() =>
  providers.value.find((p) => p.isDefault),
);
const enabledProviders = computed(() =>
  providers.value.filter((p) => p.enabled),
);

async function loadProviders() {
  try {
    const response = await llmConfigApi.list();
    providers.value = response.data || [];
    if (defaultProvider.value) {
      selectedProvider.value = defaultProvider.value.id;
    }
  } catch (error) {
    console.error("Failed to load LLM providers:", error);
  }
}

function toggleChat() {
  isOpen.value = !isOpen.value;
  if (isOpen.value && messages.value.length === 0) {
    addWelcomeMessage();
  }
}

function toggleMinimize() {
  isMinimized.value = !isMinimized.value;
}

function closeChat() {
  isOpen.value = false;
  isMinimized.value = false;
}

function addWelcomeMessage() {
  const provider = providers.value.find((p) => p.id === selectedProvider.value);
  messages.value.push({
    id: Date.now().toString(),
    role: "assistant",
    content: `Hello! I'm your AI assistant powered by ${provider?.displayName || "AI"}. I can help you analyze logs, metrics, traces, and provide insights about your observability data. How can I help you today?`,
    timestamp: new Date(),
  });
}

async function sendMessage() {
  if (!userInput.value.trim()) return;
  if (!selectedProvider.value) {
    message.warning("Please select an LLM provider in settings");
    return;
  }

  const userMessage: Message = {
    id: Date.now().toString(),
    role: "user",
    content: userInput.value,
    timestamp: new Date(),
  };

  messages.value.push(userMessage);
  userInput.value = "";

  // Add loading message
  const loadingMessage: Message = {
    id: (Date.now() + 1).toString(),
    role: "assistant",
    content: "",
    timestamp: new Date(),
    isLoading: true,
  };
  messages.value.push(loadingMessage);

  await nextTick();
  scrollToBottom();

  isLoading.value = true;

  try {
    // Send message to LLM API
    const response = await llmApi.sendMessage({
      message: userMessage.content,
      contextType: "dashboard", // Can be made configurable based on current page
      conversationId: undefined, // Will create new conversation
      providerId: selectedProvider.value || undefined,
    });

    // Remove loading message
    messages.value = messages.value.filter((m) => m.id !== loadingMessage.id);

    // Add AI response
    const aiMessage: Message = {
      id: response.message.id,
      role: "assistant",
      content: response.message.content,
      timestamp: new Date(response.message.createdAt),
    };
    messages.value.push(aiMessage);

    await nextTick();
    scrollToBottom();
  } catch (error) {
    messages.value = messages.value.filter((m) => m.id !== loadingMessage.id);
    message.error("Failed to get AI response");
  } finally {
    isLoading.value = false;
  }
}

function scrollToBottom() {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  }
}

function clearChat() {
  messages.value = [];
  addWelcomeMessage();
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

onMounted(() => {
  loadProviders();
});

defineExpose({
  toggleChat,
  isOpen,
});
</script>

<template>
  <div class="ai-chatbot">
    <!-- Floating Button -->
    <n-button v-if="!isOpen" circle type="primary" size="large" class="chat-toggle-btn" @click="toggleChat">
      <template #icon>
        <Icon icon="carbon:ai-status" :width="24" :height="24" />
      </template>
    </n-button>

    <!-- Chat Window -->
    <transition name="slide-up">
      <div v-if="isOpen" class="chat-window" :class="{ minimized: isMinimized }">
        <!-- Header -->
        <div class="chat-header">
          <div class="header-left">
            <Icon icon="carbon:ai-status" :width="20" :height="20" />
            <span class="header-title">AI Assistant</span>
            <n-tag v-if="defaultProvider" size="small" :bordered="false" type="info">
              {{ defaultProvider.displayName }}
            </n-tag>
          </div>
          <div class="header-actions">
            <n-tooltip>
              <template #trigger>
                <n-button text @click="clearChat">
                  <template #icon>
                    <Icon icon="carbon:clean" />
                  </template>
                </n-button>
              </template>
              Clear Chat
            </n-tooltip>
            <n-tooltip>
              <template #trigger>
                <n-button text @click="toggleMinimize">
                  <template #icon>
                    <Icon
                      :icon="isMinimized
                        ? 'carbon:chevron-up'
                        : 'carbon:chevron-down'
                      "
                    />
                  </template>
                </n-button>
              </template>
              {{ isMinimized ? "Expand" : "Minimize" }}
            </n-tooltip>
            <n-button text @click="closeChat">
              <template #icon>
                <Icon icon="carbon:close" />
              </template>
            </n-button>
          </div>
        </div>

        <!-- Messages Container -->
        <div v-if="!isMinimized" class="chat-body">
          <div ref="chatContainer" class="messages-container">
            <div v-for="msg in messages" :key="msg.id" class="message" :class="msg.role">
              <div class="message-avatar">
                <Icon
                  :icon="msg.role === 'user'
                    ? 'carbon:user-avatar'
                    : 'carbon:ai-status'
                  " :width="20" :height="20"
                />
              </div>
              <div class="message-content">
                <div class="message-header">
                  <span class="message-sender">{{
                    msg.role === "user" ? "You" : "AI Assistant"
                  }}</span>
                  <span class="message-time">{{
                    formatTime(msg.timestamp)
                  }}</span>
                </div>
                <div v-if="msg.isLoading" class="message-loading">
                  <n-spin size="small" />
                  <span>Thinking...</span>
                </div>
                <div v-else class="message-text">{{ msg.content }}</div>
              </div>
            </div>
          </div>

          <!-- Input Area -->
          <div class="chat-input">
            <n-select
              v-model:value="selectedProvider" size="small" :options="enabledProviders.map((p) => ({
                label: p.displayName,
                value: p.id,
              }))
              " placeholder="Select Provider" class="provider-select"
            />
            <n-input
              v-model:value="userInput" type="textarea"
              placeholder="Ask me anything about your observability data..." :autosize="{ minRows: 1, maxRows: 4 }"
              :disabled="isLoading" @keydown.enter.prevent="sendMessage"
            />
            <n-button
              type="primary" :disabled="!userInput.trim() || isLoading" :loading="isLoading"
              @click="sendMessage"
            >
              <template #icon>
                <Icon icon="carbon:send-alt" />
              </template>
            </n-button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped lang="scss">
.ai-chatbot {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
}

.chat-toggle-btn {
  width: 56px;
  height: 56px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  &:hover {
    transform: scale(1.05);
  }
}

.chat-window {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 420px;
  max-height: 600px;
  display: flex;
  flex-direction: column;
  background: var(--card-color);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  overflow: hidden;

  :root:not(.dark) & {
    background: #ffffff;
    border: 1px solid #e2e8f0;
  }

  :root.dark & {
    background: rgba(30, 41, 59, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  &.minimized {
    max-height: 60px;
  }
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  background: linear-gradient(135deg,
      rgba(59, 130, 246, 0.1),
      rgba(99, 102, 241, 0.05));

  :root:not(.dark) & {
    border-color: #e2e8f0;
  }

  :root.dark & {
    border-color: rgba(255, 255, 255, 0.1);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;

    :deep(svg) {
      color: var(--primary-color);
    }
  }

  .header-title {
    font-weight: 600;
    font-size: 1rem;
  }

  .header-actions {
    display: flex;
    gap: 4px;
  }
}

.chat-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  display: flex;
  gap: 12px;
  animation: fadeIn 0.3s ease;

  &.user {
    flex-direction: row-reverse;

    .message-content {
      align-items: flex-end;
    }

    .message-text {
      background: var(--primary-color);
      color: white;
    }
  }

  &.assistant {
    .message-text {
      background: var(--card-color);

      :root:not(.dark) & {
        background: #f1f5f9;
      }

      :root.dark & {
        background: rgba(255, 255, 255, 0.05);
      }
    }
  }
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-color);
  color: white;
  flex-shrink: 0;
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 75%;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
  color: var(--n-text-color-3);
}

.message-sender {
  font-weight: 600;
}

.message-time {
  font-size: 0.7rem;
}

.message-text {
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 0.875rem;
  line-height: 1.5;
  word-wrap: break-word;
}

.message-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 12px;
  background: var(--card-color);
  font-size: 0.875rem;
  color: var(--n-text-color-3);

  :root:not(.dark) & {
    background: #f1f5f9;
  }

  :root.dark & {
    background: rgba(255, 255, 255, 0.05);
  }
}

.chat-input {
  display: flex;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid var(--border-color);
  background: var(--card-color);

  :root:not(.dark) & {
    border-color: #e2e8f0;
    background: #f8fafc;
  }

  :root.dark & {
    border-color: rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.02);
  }

  .provider-select {
    width: 180px;
  }

  :deep(.n-input) {
    flex: 1;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

@media (max-width: 768px) {
  .chat-window {
    width: calc(100vw - 32px);
    max-height: calc(100vh - 100px);
    bottom: 16px;
    right: 16px;
  }

  .chat-toggle-btn {
    bottom: 16px;
    right: 16px;
  }
}
</style>
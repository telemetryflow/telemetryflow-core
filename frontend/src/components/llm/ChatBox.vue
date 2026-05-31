<template>
  <Teleport to="body">
    <!-- Floating Chat Button (responsive positioning) -->
    <div v-if="!chatOpen" class="chat-fab" style="position: fixed; bottom: 24px; right: 24px; z-index: 2147483647;">
      <n-tooltip placement="left">
        <template #trigger>
          <n-button circle size="large" type="primary" class="chat-fab-btn" @click="openChat">
            <template #icon>
              <n-icon size="24">
                <ChatIcon />
              </n-icon>
            </template>
          </n-button>
        </template>
        AI Assistant
      </n-tooltip>
    </div>

    <!-- Chat Window -->
    <Transition name="slide-up">
      <div v-if="chatOpen" :class="chatWindowClasses">
        <!-- Header -->
        <div class="chat-header" @click="chatMinimized ? maximizeChat() : null">
          <div style="display: flex; align-items: center; gap: 8px;">
            <n-icon size="20" color="#6366f1">
              <SparklesIcon />
            </n-icon>
            <span class="font-semibold">
              AI Assistant
            </span>
            <n-tag v-if="currentContext" size="small" round :bordered="false" type="info">
              {{ CONTEXT_TYPES[currentContext]?.label || currentContext }}
            </n-tag>
          </div>
          <div style="display: flex; align-items: center; gap: 4px;">
            <n-button
              quaternary
              circle
              size="small"
              :title="historyPanelOpen ? 'Hide history' : 'Chat history'"
              :type="historyPanelOpen ? 'primary' : 'default'"
              @click.stop="historyPanelOpen = !historyPanelOpen"
            >
              <template #icon>
                <n-icon>
                  <HistoryIcon />
                </n-icon>
              </template>
            </n-button>
            <n-button quaternary circle size="small" title="New conversation" @click.stop="startNewConversation">
              <template #icon>
                <n-icon>
                  <PlusIcon />
                </n-icon>
              </template>
            </n-button>
            <n-button
              quaternary circle size="small" :disabled="!activeConversation || displayMessages.length === 0"
              title="Export conversation as Markdown"
              @click.stop="exportConversation"
            >
              <template #icon>
                <n-icon>
                  <DownloadIcon />
                </n-icon>
              </template>
            </n-button>
            <n-button
              quaternary circle size="small" :title="chatMinimized ? 'Maximize' : 'Minimize'"
              @click.stop="chatMinimized ? maximizeChat() : minimizeChat()"
            >
              <template #icon>
                <n-icon>
                  <MinimizeIcon v-if="!chatMinimized" />
                  <MaximizeIcon v-else />
                </n-icon>
              </template>
            </n-button>
            <n-button
              quaternary circle size="small" :title="isFullscreen ? 'Exit fullscreen' : 'Fullscreen'"
              @click.stop="toggleFullscreen"
            >
              <template #icon>
                <n-icon>
                  <ContractIcon v-if="isFullscreen" />
                  <ExpandIcon v-else />
                </n-icon>
              </template>
            </n-button>
            <n-button quaternary circle size="small" title="Close" @click.stop="closeChat">
              <template #icon>
                <n-icon>
                  <CloseIcon />
                </n-icon>
              </template>
            </n-button>
          </div>
        </div>

        <!-- Content (hidden when minimized) -->
        <template v-if="!chatMinimized">
          <!-- Tab Bar -->
          <div
            v-if="hasDefaultProvider && chatTabs.length > 0"
            class="chat-tabs flex items-center border-b border-gray-200 dark:border-gray-600 overflow-x-auto"
          >
            <div
              v-for="tab in chatTabs" :key="tab.id" :class="[
                'chat-tab flex items-center gap-1 px-3 py-2 cursor-pointer border-b-2 min-w-0 max-w-[140px] group',
                activeTabId === tab.id
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                  : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'
              ]" @click="handleSwitchTab(tab.id)"
            >
              <span class="truncate text-sm" :title="tab.title">{{ tab.title }}</span>
              <n-icon
                v-if="chatTabs.length > 1 && !tab.isStreaming" size="14"
                class="opacity-0 group-hover:opacity-100 flex-shrink-0 hover:text-red-500"
                @click.stop="handleCloseTab(tab.id)"
              >
                <CloseIcon />
              </n-icon>
              <n-spin v-if="tab.isStreaming" size="small" class="flex-shrink-0" />
            </div>
            <!-- Add Tab Button -->
            <n-tooltip v-if="canCreateNewTab">
              <template #trigger>
                <n-button quaternary circle size="tiny" class="ml-1 flex-shrink-0" @click="handleCreateNewTab">
                  <template #icon>
                    <n-icon size="14">
                      <PlusIcon />
                    </n-icon>
                  </template>
                </n-button>
              </template>
              New chat tab (max {{ maxTabs }})
            </n-tooltip>
          </div>

          <!-- No Provider Warning -->
          <div v-if="!hasDefaultProvider" class="chat-empty-state">
            <n-icon size="48" color="#9ca3af">
              <SettingsIcon />
            </n-icon>
            <h3 class="mt-4 text-lg font-medium">
              No AI Provider Configured
            </h3>
            <p class="mt-2 text-sm opacity-70">
              Configure an LLM provider in Settings to start using AI insights.
            </p>
            <n-button type="primary" class="mt-4" @click="goToSettings">
              Configure Provider
            </n-button>
          </div>

          <!-- Chat Content -->
          <template v-else>
            <!-- Body: history panel (left) + chat main (right) -->
            <div class="chat-body">
              <!-- History panel (slide-in from left) -->
              <Transition name="history-slide">
                <ChatHistory
                  v-if="historyPanelOpen"
                  @close="historyPanelOpen = false"
                />
              </Transition>

              <!-- Chat main column -->
              <div class="chat-main">
                <!-- Messages -->
                <div ref="messagesContainer" class="chat-messages">
                  <!-- Empty State -->
                  <div
                    v-if="displayMessages.length === 0"
                    style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;"
                  >
                    <n-icon size="48" color="#6366f1">
                      <SparklesIcon />
                    </n-icon>
                    <h3 class="mt-4 text-lg font-medium">
                      Ask anything about your {{ CONTEXT_TYPES[currentContext]?.label?.toLowerCase() || 'data' }}
                    </h3>
                    <p class="mt-2 text-sm opacity-70 max-w-xs">
                      I can help analyze patterns, identify issues, and provide recommendations.
                    </p>
                    <div class="mt-4 flex flex-wrap gap-2 justify-center max-w-sm">
                      <n-button
                        v-for="suggestion in suggestions" :key="suggestion" size="small" secondary
                        @click="sendQuickMessage(suggestion)"
                      >
                        {{ suggestion }}
                      </n-button>
                    </div>
                  </div>

                  <!-- Message List -->
                  <ChatMessage v-for="message in displayMessages" :key="message.id" :message="message" />
                </div>

                <!-- Attachment Preview -->
                <div
                  v-if="attachments.length > 0"
                  class="attachment-preview px-4 py-2 border-t border-gray-200 dark:border-gray-600"
                >
                  <div class="flex flex-wrap gap-2">
                    <div v-for="(attachment, index) in attachments" :key="index" class="attachment-item relative group">
                      <!-- Image Preview -->
                      <template v-if="attachment.type === 'image'">
                        <img
                          :src="attachment.preview" :alt="attachment.name"
                          class="w-16 h-16 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                        />
                      </template>
                      <!-- File Preview -->
                      <template v-else>
                        <div
                          class="w-16 h-16 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600"
                        >
                          <n-icon size="20" color="#6366f1">
                            <DocumentIcon />
                          </n-icon>
                          <span class="text-[10px] mt-1 text-gray-500 dark:text-gray-400 truncate max-w-[60px]">
                            {{ attachment.name.split('.').pop()?.toUpperCase() }}
                          </span>
                        </div>
                      </template>
                      <!-- Remove Button -->
                      <button
                        class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        @click="removeAttachment(index)"
                      >
                        &times;
                      </button>
                      <!-- File Name Tooltip -->
                      <n-tooltip>
                        <template #trigger>
                          <div class="absolute inset-0" />
                        </template>
                        {{ attachment.name }} ({{ formatFileSize(attachment.size) }})
                      </n-tooltip>
                    </div>
                  </div>
                </div>

                <!-- Input -->
                <div class="chat-input-area p-3">
                  <!-- Rich Text Editor with Action Buttons -->
                  <div class="flex gap-2 items-start">
                    <!-- Text Input (Resizable) -->
                    <div class="flex-1">
                      <RichTextInput
                        v-model="inputMessage" placeholder="Ask a question... (Markdown supported)"
                        :disabled="isStreaming" :min-height="40" :max-height="250" :resizable="true" @submit="handleSend"
                      />
                    </div>
                    <!-- Action Buttons (Top-Center aligned) -->
                    <div class="flex flex-col gap-2 pt-1">
                      <!-- Attachment Button -->
                      <n-tooltip>
                        <template #trigger>
                          <button
                            class="action-btn" :class="{ 'action-btn--disabled': isStreaming }"
                            :disabled="isStreaming" @click="triggerFileInput"
                          >
                            <n-icon size="18">
                              <AttachIcon />
                            </n-icon>
                          </button>
                        </template>
                        Attach file (txt, doc, docx, jpg, png)
                      </n-tooltip>
                      <input
                        ref="fileInputRef" type="file" multiple accept=".txt,.doc,.docx,.jpg,.jpeg,.png"
                        style="display: none" @change="handleFileSelect"
                      />
                      <!-- Send Button -->
                      <n-tooltip>
                        <template #trigger>
                          <button
                            class="action-btn action-btn--primary"
                            :class="{ 'action-btn--disabled': (!inputMessage.trim() && attachments.length === 0) || isStreaming }"
                            :disabled="(!inputMessage.trim() && attachments.length === 0) || isStreaming"
                            @click="handleSend"
                          >
                            <n-icon size="18">
                              <SendIcon />
                            </n-icon>
                          </button>
                        </template>
                        Send message
                      </n-tooltip>
                    </div>
                  </div>
                  <div class="mt-2 flex items-center justify-between text-xs">
                    <n-dropdown
                      v-if="providers.length > 0" trigger="click" :options="providerOptions" :z-index="2147483647"
                      scrollable @select="(key: string) => handleProviderSelect(key)"
                    >
                      <span class="provider-selector cursor-pointer">
                        Using <strong>{{ defaultProvider?.name || 'Select provider' }}</strong> (<strong>{{
                          defaultProvider?.modelId
                            || '-' }}</strong>)
                        <n-icon size="12">
                          <ChevronDownIcon />
                        </n-icon>
                      </span>
                    </n-dropdown>
                    <span v-else class="text-gray-400">No provider configured</span>
                    <span v-if="isStreaming" class="streaming-indicator flex items-center gap-1">
                      <n-spin size="small" />
                      Generating...
                    </span>
                  </div>
                </div>
                <!-- end .chat-main -->
              </div>
            <!-- end .chat-body -->
            </div>
          </template>
        </template>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from "vue";
import { useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import {
  NButton,
  NIcon,
  NTag,
  NTooltip,
  NSpin,
  NDropdown,
  useMessage,
} from "naive-ui";
import type { DropdownOption } from "naive-ui";
import {
  ChatboxOutline as ChatIcon,
  SparklesOutline as SparklesIcon,
  AddOutline as PlusIcon,
  RemoveOutline as MinimizeIcon,
  ExpandOutline as MaximizeIcon,
  CloseOutline as CloseIcon,
  SettingsOutline as SettingsIcon,
  SendOutline as SendIcon,
  ChevronDownOutline as ChevronDownIcon,
  AttachOutline as AttachIcon,
  DocumentOutline as DocumentIcon,
  ExpandOutline as ExpandIcon,
  ContractOutline as ContractIcon,
  TimeOutline as HistoryIcon,
  DownloadOutline as DownloadIcon,
} from "@vicons/ionicons5";
import { useLLMStore } from "@/store";
import { config } from "@/config";
import { CONTEXT_TYPES } from "@/types/llm";
import type { SendMessageAttachment } from "@/types/llm";
import ChatMessage from "./ChatMessage.vue";
import ChatHistory from "./ChatHistory.vue";
import RichTextInput from "./RichTextInput.vue";

const router = useRouter();
const message = useMessage();
const llmStore = useLLMStore();

const {
  chatOpen,
  chatMinimized,
  currentContext,
  defaultProvider,
  hasDefaultProvider,
  displayMessages,
  isStreaming,
  providers,
  chatTabs,
  activeTabId,
  canCreateNewTab,
  activeConversation,
} = storeToRefs(llmStore);

const {
  openChat,
  closeChat,
  minimizeChat,
  maximizeChat,
  startNewConversation,
  sendMessageStream,
  setDefaultProvider,
  loadProviders,
  loadDefaultProvider,
  createNewTab,
  switchTab,
  closeTab,
  initializeTabs,
  maxTabs,
} = llmStore;

// Fullscreen state
const isFullscreen = ref(false);

// History panel state
const historyPanelOpen = ref(false);

// Attachment state
interface Attachment {
  file: File;
  name: string;
  size: number;
  type: 'image' | 'document';
  preview?: string;
}

const attachments = ref<Attachment[]>([]);
const fileInputRef = ref<HTMLInputElement | null>(null);

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_DOC_TYPES = ['text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_ATTACHMENTS = 5;

// Initialize LLM store on mount — fetch all providers so all show in the dropdown
onMounted(async () => {
  await loadProviders({ pageSize: config.limitDataMax });
  await loadDefaultProvider();
  initializeTabs();
});

// Reload providers every time the chat is opened so enable/disable changes
// made on the AI Assistant settings page are immediately reflected.
watch(chatOpen, async (open) => {
  if (open) {
    await loadProviders({ pageSize: config.limitDataMax });
    await loadDefaultProvider();
  }
});

// Computed classes for chat window (responsive)
const chatWindowClasses = computed(() => {
  const baseClasses = 'chat-window';

  if (chatMinimized.value) {
    return `${baseClasses} chat-window--minimized`;
  }
  if (isFullscreen.value) {
    return `${baseClasses} chat-window--fullscreen`;
  }
  const withHistory = historyPanelOpen.value ? ' chat-window--with-history' : '';
  return `${baseClasses} chat-window--normal${withHistory}`;
});

// Provider dropdown options — active (A-Z), divider, inactive (A-Z)
const providerOptions = computed<DropdownOption[]>(() => {
  const byName = (a: { name: string }, b: { name: string }) =>
    a.name.localeCompare(b.name);

  const active = [...providers.value]
    .filter((p) => p.isActive ?? true)
    .sort(byName);

  const inactive = [...providers.value]
    .filter((p) => !(p.isActive ?? true))
    .sort(byName);

  const toOption = (p: (typeof providers.value)[number]): DropdownOption => {
    const isActive = p.isActive ?? true;
    const isCurrent = p.id === defaultProvider.value?.id;
    const prefix = isCurrent ? "✓ " : "  ";
    const suffix = isActive ? "" : " (inactive)";
    return {
      label: `${prefix}${p.name} (${p.modelId})${suffix}`,
      key: p.id,
      disabled: !isActive,
    };
  };

  const options: DropdownOption[] = active.map(toOption);
  if (inactive.length > 0) {
    options.push({ type: "divider", key: "divider-inactive" });
    inactive.forEach((p) => options.push(toOption(p)));
  }
  return options;
});

async function handleProviderSelect(providerId: string) {
  if (providerId !== defaultProvider.value?.id) {
    await setDefaultProvider(providerId);
  }
}

const inputMessage = ref("");
const messagesContainer = ref<HTMLElement | null>(null);

// Fullscreen toggle
function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value;
}

// Multi-tab handlers
function handleCreateNewTab() {
  createNewTab();
}

function handleSwitchTab(tabId: string) {
  switchTab(tabId);
}

function handleCloseTab(tabId: string) {
  closeTab(tabId);
}

// File handling functions
function triggerFileInput() {
  fileInputRef.value?.click();
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = input.files;
  if (!files) return;

  for (const file of Array.from(files)) {
    addAttachment(file);
  }

  // Reset input
  input.value = '';
}

function addAttachment(file: File) {
  // Check max attachments
  if (attachments.value.length >= MAX_ATTACHMENTS) {
    message.warning(`Maximum ${MAX_ATTACHMENTS} attachments allowed`);
    return;
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    message.error(`File "${file.name}" is too large. Maximum size is 10MB`);
    return;
  }

  // Check file type
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isDoc = ALLOWED_DOC_TYPES.includes(file.type) || file.name.endsWith('.txt') || file.name.endsWith('.doc') || file.name.endsWith('.docx');

  if (!isImage && !isDoc) {
    message.error(`File type not supported. Allowed: txt, doc, docx, jpg, jpeg, png`);
    return;
  }

  const attachment: Attachment = {
    file,
    name: file.name,
    size: file.size,
    type: isImage ? 'image' : 'document',
  };

  // Create preview for images
  if (isImage) {
    const reader = new FileReader();
    reader.onload = (e) => {
      attachment.preview = e.target?.result as string;
      attachments.value = [...attachments.value]; // Trigger reactivity
    };
    reader.readAsDataURL(file);
  }

  attachments.value.push(attachment);
}

function removeAttachment(index: number) {
  attachments.value.splice(index, 1);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Quick suggestions based on context
const suggestions = computed(() => {
  const contextSuggestions: Record<string, string[]> = {
    logs: ["Analyze recent errors", "Find error patterns", "What caused the failures?"],
    metrics: ["Detect anomalies", "Analyze trends", "Identify bottlenecks"],
    traces: ["Find slow requests", "Analyze latency", "Check dependencies"],
    exemplars: ["Find high-value exemplars", "Correlate metric spikes to traces", "Identify slow trace exemplars"],
    correlations: ["Find correlated signals", "Root cause analysis", "Build incident timeline"],
    alerts: ["Analyze alert patterns", "Find root cause", "Reduce alert fatigue"],
    agents: ["Check host health", "Identify resource hogs", "Agent connectivity issues"],
    "infra-overview": ["Overall infrastructure health", "Which host is most stressed?", "Capacity planning summary"],
    "infra-cpu": ["Identify high CPU hosts", "CPU throttling issues", "Optimize CPU usage"],
    "infra-memory": ["Check memory usage trends", "Detect OOM risks", "Find memory leaks"],
    "infra-storage": ["Low disk space alerts", "High I/O bottlenecks", "Storage capacity planning"],
    "infra-network": ["Bandwidth saturation", "Unusual traffic patterns", "Network latency issues"],
    "kubernetes-overview": ["Cluster health summary", "Resource utilization overview", "Any critical issues?"],
    "kubernetes-clusters": ["Compare cluster health", "Cluster resource capacity", "Unhealthy clusters"],
    "kubernetes-namespaces": ["Namespace resource usage", "Identify noisy namespaces", "Resource quota issues"],
    "kubernetes-nodes": ["Node health check", "Node resource pressure", "Identify overloaded nodes"],
    "kubernetes-pods": ["Failing pods", "Pod restart analysis", "OOMKilled containers"],
    "kubernetes-deployments": ["Deployment rollout status", "Failed deployments", "Replica count issues"],
    "kubernetes-pv": ["PV capacity usage", "PVC binding issues", "Storage class analysis"],
    "service-map": ["Critical path analysis", "Single points of failure", "Latency propagation"],
    "network-map": ["Network topology issues", "Unusual traffic flows", "Connectivity anomalies"],
    uptime: ["SLA compliance report", "Downtime patterns", "Response time trends"],
    "status-page": ["Incident summary", "Recent outages", "Recovery time analysis"],
    reports: ["SLA trends", "Performance regressions", "Key metrics summary"],
    iam: ["Over-privileged accounts", "Unused permissions", "RBAC improvements"],
    tenancy: ["Tenant isolation review", "Workspace resource usage", "Region assignment issues"],
    audit: ["Suspicious activities", "Policy violations", "Access anomalies"],
    retention: ["Storage cost impact", "Compliance gaps", "Retention policy optimization"],
    subscription: ["Feature utilization", "Plan optimization", "Usage trends"],
    "api-keys": ["Unused API keys", "Keys needing rotation", "Permission audit"],
    notifications: ["Delivery failure analysis", "Alert routing review", "Notification fatigue"],
    dashboard: ["Explain this data", "What stands out?", "Any concerns?"],
    // Alert sub-features
    "alert-rules": ["Misconfigured rules", "High false-positive rules", "Coverage gaps"],
    // Kubernetes sub-features
    "kubernetes-api-server": ["API server latency trends", "Request rate anomalies", "Error rate spikes"],
    "kubernetes-coredns": ["DNS resolution failures", "CoreDNS latency issues", "Cache hit rate analysis"],
    // IAM sub-features
    "iam-users": ["Inactive user accounts", "Over-privileged users", "Recent access anomalies"],
    "iam-roles": ["Unused roles", "Overlapping role permissions", "Privilege escalation risks"],
    "iam-permissions": ["Unused permissions", "Least-privilege gaps", "Sensitive permission audit"],
    "iam-matrix": ["Cross-role conflicts", "Permission coverage gaps", "Redundant assignments"],
    "iam-assignments": ["Orphaned assignments", "Expired access review", "Assignment anomalies"],
    // Tenancy sub-features
    "tenancy-regions": ["Region failover readiness", "Cross-region latency", "Region capacity issues"],
    "tenancy-organizations": ["Org resource usage", "Inactive organizations", "Billing allocation review"],
    "tenancy-workspaces": ["Workspace utilization", "Unused workspaces", "Resource quota gaps"],
    "tenancy-tenants": ["Tenant isolation issues", "High-usage tenants", "Tenant onboarding status"],
    // System sub-features
    "system-setup": ["Configuration health check", "Misconfigured modules", "System readiness status"],
    "system-channels": ["Channel delivery failures", "Duplicate channel configs", "Routing coverage gaps"],
    "ai-assistant": ["Provider performance comparison", "Token usage trends", "Model latency analysis"],
    // Account sub-features
    "account-profile": ["Profile completeness check", "Missing contact info", "Account verification status"],
    "account-security": ["Weak security settings", "MFA adoption status", "Security policy compliance"],
    "account-sessions": ["Suspicious active sessions", "Session duration anomalies", "Concurrent session review"],
    "account-notifications": ["Notification delivery issues", "Missed critical alerts", "Channel preference gaps"],
    "account-preferences": ["Preference optimization tips", "Theme and display settings", "Default workspace review"],
    "account-organization": ["Organization structure review", "Member role distribution", "Org policy compliance"],
    // Data masking
    "data-masking": ["PII exposure risks", "Masking rule coverage gaps", "Sensitive field detection"],
  };
  return contextSuggestions[currentContext.value] || contextSuggestions.dashboard;
});

// Auto-scroll to bottom when new messages arrive
watch(displayMessages, async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}, { deep: true });

async function handleSend() {
  if ((!inputMessage.value.trim() && attachments.value.length === 0) || isStreaming.value) return;

  const pendingAttachments = [...attachments.value];
  // Capture image previews BEFORE clearing the attachment list so they can be
  // stored in the ChatMessage and displayed as thumbnails in the chat history.
  const attachmentPreviews = pendingAttachments
    .filter((a) => a.type === 'image' && a.preview)
    .map((a) => ({ name: a.name, mediaType: a.file.type, preview: a.preview! }));
  let messageContent = inputMessage.value;
  inputMessage.value = "";
  attachments.value = [];

  // Read each attachment: images → base64 content blocks, text → appended to message
  const fileAttachments: SendMessageAttachment[] = [];

  await Promise.all(
    pendingAttachments.map(
      (a) =>
        new Promise<void>((resolve) => {
          const reader = new FileReader();
          if (a.type === "image") {
            reader.onload = (e) => {
              const dataUrl = e.target?.result as string;
              // Strip "data:<mime>;base64," prefix
              const commaIdx = dataUrl.indexOf(",");
              const data = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;
              fileAttachments.push({ mediaType: a.file.type, data, name: a.name });
              resolve();
            };
            reader.onerror = () => resolve(); // skip on error
            reader.readAsDataURL(a.file);
          } else {
            // Text / document: append content to message (truncated to stay within limits)
            const MAX_TEXT_CHARS = 6000;
            reader.onload = (e) => {
              const text = e.target?.result as string;
              const truncated = text.length > MAX_TEXT_CHARS
                ? text.slice(0, MAX_TEXT_CHARS) + `\n... [truncated, ${text.length - MAX_TEXT_CHARS} chars omitted]`
                : text;
              messageContent += `\n\n[File: ${a.name}]\n${truncated}`;
              resolve();
            };
            reader.onerror = () => {
              messageContent += `\n\n[Attached: ${a.name}]`;
              resolve();
            };
            reader.readAsText(a.file);
          }
        }),
    ),
  );

  sendMessageStream(
    messageContent,
    fileAttachments.length ? fileAttachments : undefined,
    () => {
      nextTick(() => {
        if (messagesContainer.value) {
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
        }
      });
    },
    attachmentPreviews.length ? attachmentPreviews : undefined,
  );
}

function sendQuickMessage(msg: string) {
  inputMessage.value = msg;
  handleSend();
}

function exportConversation() {
  const msgs = displayMessages.value;
  if (!msgs.length) return;

  const provider = defaultProvider.value;
  const modelName = provider?.name ?? "Unknown Model";
  const modelId   = provider?.modelId ?? "-";
  const contextLabel = CONTEXT_TYPES[currentContext.value]?.label ?? currentContext.value;
  const exportedAt = new Date().toLocaleString("en-US", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  });
  const title = activeConversation.value?.title ?? "AI Assistant Conversation";

  const lines: string[] = [
    `# ${title}`,
    ``,
    `| Field | Value |`,
    `|-------|-------|`,
    `| **Using Model** | ${modelName} (\`${modelId}\`) |`,
    `| **Context** | ${contextLabel} |`,
    `| **Exported At** | ${exportedAt} |`,
    `| **Messages** | ${msgs.length} |`,
    ``,
    `---`,
    ``,
  ];

  for (const msg of msgs) {
    const role = msg.role === "user" ? "**You**" : `**AI Assistant** _(${modelName})_`;
    const ts = msg.createdAt
      ? new Date(msg.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
      : "";
    lines.push(`### ${role}${ts ? `  <sub>${ts}</sub>` : ""}`);
    lines.push(``);
    lines.push(msg.content ?? "");
    lines.push(``);
    lines.push(`---`);
    lines.push(``);
  }

  const markdown = lines.join("\n");
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  const safeTitle = title.replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 60);
  a.href     = url;
  a.download = `telemetryflow-ai-${safeTitle}-${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
  message.success("Conversation exported as Markdown");
}

function goToSettings() {
  closeChat();
  router.push("/settings/ai-assistant");
}
</script>

<style scoped lang="scss">
// =============================================================================
// Responsive Breakpoints
// =============================================================================
$bp-xs: 480px;
$bp-sm: 640px;
$bp-md: 768px;

// Tailwind utility class replacements
.font-semibold {
  font-weight: 600;
}

.text-lg {
  font-size: 1.125rem;
  line-height: 1.75rem;
}

.text-sm {
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.mt-2 {
  margin-top: 0.5rem;
}

.mt-4 {
  margin-top: 1rem;
}

.opacity-70 {
  opacity: 0.7;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

// History panel + chat main layout
.chat-body {
  display: flex;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.chat-main {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  min-width: 0;
}

// History slide-in transition
.history-slide-enter-active,
.history-slide-leave-active {
  transition: width 0.22s ease, opacity 0.22s ease;
  overflow: hidden;
}

.history-slide-enter-from,
.history-slide-leave-to {
  width: 0 !important;
  opacity: 0;
}

.provider-selector {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: color 0.2s;
  font-size: 11px;

  @media (min-width: $bp-sm) {
    font-size: 12px;
  }

  &:hover {
    color: var(--n-primary-color);
  }
}

.streaming-indicator {
  color: var(--n-primary-color);
  font-size: 11px;

  @media (min-width: $bp-sm) {
    font-size: 12px;
  }
}

.attachment-preview {
  background: rgba(0, 0, 0, 0.02);
}

.attachment-item {
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.05);
  }
}

/* Action buttons - square with equal size */
.action-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;

  // Larger touch target on mobile
  @media (max-width: $bp-sm) {
    width: 40px;
    height: 40px;
  }

  &:hover:not(:disabled) {
    border-color: #6366f1;
    background: rgba(99, 102, 241, 0.1);
    color: #6366f1;
  }

  &--primary {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    border: none;
    color: #ffffff;

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #818cf8 0%, #a78bfa 100%);
      color: #ffffff;
    }
  }

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
}

.chat-tabs {
  background: #f8fafc;
  min-height: 36px;

  &::-webkit-scrollbar {
    height: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 2px;
  }
}

.chat-tab {
  transition: all 0.15s ease;
  font-size: 12px;

  @media (min-width: $bp-sm) {
    font-size: 13px;
  }

  &:first-child {
    margin-left: 4px;
  }
}

// =============================================================================
// Mobile-First Chat Window Responsive Styles
// =============================================================================

// Minimized state
.chat-window--minimized {
  bottom: 16px;
  right: 16px;
  width: 288px;
  height: 56px;
  border-radius: 8px;
  overflow: hidden;

  @media (min-width: $bp-sm) {
    bottom: 24px;
    right: 24px;
    width: 320px;
  }
}

// Fullscreen state
.chat-window--fullscreen {
  inset: 0;
  border-radius: 0;

  @media (min-width: $bp-sm) {
    inset: 16px;
    border-radius: 12px;
  }
}

// Normal state (non-minimized, non-fullscreen)
.chat-window--normal,
:deep(.chat-window--normal) {
  // Mobile: Full width bottom sheet
  bottom: 0;
  right: 0;
  left: 0;
  width: 100%;
  height: 75vh;
  max-height: 75vh;
  border-radius: 16px 16px 0 0;

  // Small tablets and up
  @media (min-width: $bp-sm) {
    bottom: 16px;
    right: 16px;
    left: auto;
    width: 380px;
    height: 500px;
    max-height: 75vh;
    border-radius: 12px;
  }

  // Tablets and up
  @media (min-width: $bp-md) {
    bottom: 24px;
    right: 24px;
    width: 480px;
    height: 560px;
    max-height: 80vh;
  }

  // Desktop
  @media (min-width: 1024px) {
    width: 520px;
    height: 600px;
  }
}

// Expand width when history panel is open (desktop only)
.chat-window--normal.chat-window--with-history {
  @media (min-width: $bp-md) {
    width: 700px;
  }

  @media (min-width: 1024px) {
    width: 740px;
  }
}
</style>

<!-- Unscoped dark mode styles -->
<style lang="scss">
// =============================================================================
// Responsive Breakpoints
// =============================================================================
$bp-xs: 480px;
$bp-sm: 640px;
$bp-md: 768px;

// Force dropdown to appear above chatbox (Naive UI renders to body)
.v-binder-follower-container {
  z-index: 2147483647 !important;
}

.n-dropdown-menu {
  z-index: 2147483647 !important;
}

// =============================================================================
// Light Mode Defaults (with responsive adjustments)
// =============================================================================

.chat-window {
  position: fixed;
  z-index: 2147483647;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  transition: all 0.2s ease;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  color: #1e293b;

  // Mobile: bottom sheet style
  @media (max-width: #{$bp-sm - 1px}) {
    border-radius: 16px 16px 0 0 !important;
    border-bottom: none;
  }
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  color: #1e293b;
  padding: 10px 12px !important;
  border-radius: 12px 12px 0 0;
  cursor: pointer;

  @media (min-width: $bp-sm) {
    padding: 12px 16px !important;
  }

  // Mobile: larger touch targets
  @media (max-width: #{$bp-sm - 1px}) {
    .n-button {
      min-width: 36px;
      min-height: 36px;
    }
  }
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  background: #ffffff;
  color: #1e293b;
  padding: 12px !important;

  @media (min-width: $bp-sm) {
    padding: 16px !important;
  }

  // Responsive empty state
  .text-lg {
    font-size: 1rem !important;

    @media (min-width: $bp-sm) {
      font-size: 1.125rem !important;
    }
  }
}

.chat-input-area {
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
  padding: 10px !important;

  @media (min-width: $bp-sm) {
    padding: 12px !important;
  }

  // Mobile: safe area padding for notched phones
  @media (max-width: #{$bp-sm - 1px}) {
    padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px)) !important;
  }
}

.chat-empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: #ffffff;
  color: #1e293b;
  padding: 16px !important;

  @media (min-width: $bp-sm) {
    padding: 24px !important;
  }

  h3 {
    font-size: 1rem !important;

    @media (min-width: $bp-sm) {
      font-size: 1.125rem !important;
    }
  }

  p {
    font-size: 0.8125rem !important;

    @media (min-width: $bp-sm) {
      font-size: 0.875rem !important;
    }
  }
}

.attachment-preview {
  background: #f8fafc;
  padding: 8px 12px !important;

  @media (min-width: $bp-sm) {
    padding: 8px 16px !important;
  }
}

// Dark mode - use lighter slate colors for better visibility
html.dark {
  .chat-window {
    background: #1e293b !important; // slate-800
    border: 1px solid #4f46e5 !important; // indigo-600 border
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.15), 0 10px 40px rgba(0, 0, 0, 0.4) !important;
    color: #f1f5f9 !important;
  }

  .chat-header {
    background: linear-gradient(135deg, #1e1b4b 0%, #1e293b 100%) !important; // indigo-950 to slate-800
    border-color: #334155 !important;
    color: #f1f5f9 !important;

    .font-semibold {
      color: #e0e7ff !important; // indigo-100
    }
  }

  .chat-messages {
    background: #1e293b !important; // slate-800
    color: #f1f5f9 !important;
  }

  .chat-input-area {
    border-color: #334155 !important;
    background: #0f172a !important; // slate-900 - darker for contrast
    color: #f1f5f9 !important;
    padding: 12px !important;
  }

  .chat-empty-state {
    color: #f1f5f9 !important;
    background: #1e293b !important; // same as chat-messages

    h3 {
      color: #e0e7ff !important; // indigo-100
    }

    p {
      color: #94a3b8 !important; // slate-400
    }

    // Configure Provider button
    .n-button--primary-type {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
      border: none !important;
      color: #ffffff !important;

      .n-button__content {
        color: #ffffff !important;
      }
    }
  }

  .attachment-preview {
    background: #1e293b !important;
    border-color: #475569 !important;
  }

  .provider-selector {
    color: #94a3b8 !important; // slate-400

    strong {
      color: #c7d2fe !important; // indigo-200
    }

    &:hover {
      color: #c7d2fe !important;
    }
  }

  // Action buttons dark mode
  .action-btn {
    border-color: #6366f1 !important;
    background: rgba(99, 102, 241, 0.1) !important;
    color: #a5b4fc !important;

    &:hover:not(:disabled):not(.action-btn--disabled) {
      border-color: #818cf8 !important;
      background: rgba(99, 102, 241, 0.25) !important;
      color: #c7d2fe !important;
    }

    &--primary {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
      border: none !important;
      color: #ffffff !important;

      &:hover:not(:disabled):not(.action-btn--disabled) {
        background: linear-gradient(135deg, #818cf8 0%, #a78bfa 100%) !important;
      }
    }

    &--disabled {
      opacity: 0.4 !important;
    }
  }

  // Naive UI button text color fixes for dark mode
  .n-button--primary-type {
    color: #ffffff !important;

    .n-button__content {
      color: #ffffff !important;
    }
  }

  .n-button--secondary-type {
    border-color: #6366f1 !important;
    color: #c7d2fe !important;

    .n-button__content {
      color: #c7d2fe !important;
    }

    &:hover {
      background: rgba(99, 102, 241, 0.15) !important;
      border-color: #818cf8 !important;
    }
  }

  // Quick suggestion buttons
  .chat-messages .n-button--secondary-type {
    background: rgba(99, 102, 241, 0.1) !important;
    border-color: #6366f1 !important;
    color: #e0e7ff !important;

    .n-button__content {
      color: #e0e7ff !important;
    }

    &:hover {
      background: rgba(99, 102, 241, 0.25) !important;
      border-color: #818cf8 !important;
    }
  }

  .chat-tabs {
    background: #0f172a !important; // slate-900
    border-color: #334155 !important;

    &::-webkit-scrollbar-thumb {
      background: #475569;
    }
  }

  .chat-tab {
    color: #94a3b8 !important; // slate-400

    &:hover {
      background: #1e293b !important;
      color: #e2e8f0 !important;
    }

    &.border-indigo-500 {
      color: #c7d2fe !important; // indigo-200 for active tab
      background: rgba(99, 102, 241, 0.15) !important;
    }
  }

  // Header button styling
  .chat-header {
    .n-button {
      color: #94a3b8 !important;

      &:hover {
        color: #e2e8f0 !important;
        background: rgba(99, 102, 241, 0.2) !important;
      }
    }
  }
}
</style>

<!-- Global override: Naive UI dropdown teleports to <body>, so scoped CSS can't reach it.
     Limit all dropdown menus to 10 rows (10 × 34px = 340px). Short dropdowns are unaffected.
     overflow: hidden on the outer menu lets the inner NScrollbar handle scrolling exclusively. -->
<style>
.n-dropdown-menu {
  max-height: 340px !important;
  overflow: hidden !important;
}

.n-dropdown-menu .n-scrollbar {
  max-height: 340px !important;
}

.n-dropdown-menu .n-scrollbar-container {
  max-height: 340px !important;
  overflow-y: auto !important;
}
</style>
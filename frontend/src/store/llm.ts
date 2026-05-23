/**
 * LLM Store
 * TASK-11: Pinia store for BYOLLM AI Insights module
 */

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { llmApi } from "@/api/llm";
import { config } from "@/config";
import { useAppStore } from "@/store/app";
import type {
  LLMProvider,
  Conversation,
  ConversationDetail,
  Insight,
  ContextType,
  CreateLLMProviderRequest,
  UpdateLLMProviderRequest,
  SendMessageRequest,
  SendMessageAttachment,
  GenerateInsightRequest,
  ListLLMProvidersQuery,
  ListConversationsQuery,
  StreamEvent,
} from "@/types/llm";

export const useLLMStore = defineStore("llm", () => {
  // ==================== STATE ====================

  // Providers
  const providers = ref<LLMProvider[]>([]);
  const defaultProvider = ref<LLMProvider | null>(null);
  const selectedProvider = ref<LLMProvider | null>(null);
  const providersLoading = ref(false);
  const providersTotal = ref(0);

  // Conversations
  const conversations = ref<Conversation[]>([]);
  const activeConversation = ref<ConversationDetail | null>(null);
  const conversationsLoading = ref(false);
  const conversationsTotal = ref(0);

  // Multi-tab chat state
  // BUGFIX: Setiap tab memiliki conversationUuid unik untuk isolasi conversation
  // Ini mencegah chat dari tab sebelumnya masuk ke tab baru
  interface ChatTab {
    id: string; // UUID untuk tab
    conversationUuid: string; // UUID unik untuk conversation di tab ini
    title: string;
    conversation: ConversationDetail | null;
    contextType: ContextType;
    contextId?: string;
    streamingMessage: string;
    isStreaming: boolean;
    streamingTabId?: string; // Track tab mana yang sedang streaming
  }

  const chatTabs = ref<ChatTab[]>([]);
  const activeTabId = ref<string | null>(null);
  const maxTabs = 8;

  // Chat state
  const chatOpen = ref(false);
  const chatMinimized = ref(false);
  const currentContext = ref<ContextType>("dashboard");
  const currentContextId = ref<string | undefined>(undefined);
  const streamingMessage = ref<string>("");
  const isStreaming = ref(false);

  // Insights
  const currentInsight = ref<Insight | null>(null);
  const insightLoading = ref(false);

  // General
  const error = ref<string | null>(null);

  // ==================== GETTERS ====================

  const hasDefaultProvider = computed(() => !!defaultProvider.value);

  const activeProviders = computed(() =>
    providers.value.filter((p) => p.isActive),
  );

  const recentConversations = computed(() => conversations.value.slice(0, 5));

  // Multi-tab getters
  const activeTab = computed(
    () => chatTabs.value.find((t) => t.id === activeTabId.value) || null,
  );

  const canCreateNewTab = computed(() => chatTabs.value.length < maxTabs);

  const currentMessages = computed(
    () => activeConversation.value?.messages || [],
  );

  const displayMessages = computed(() => {
    const messages = [...currentMessages.value];
    if (streamingMessage.value) {
      messages.push({
        id: "streaming",
        role: "assistant",
        content: streamingMessage.value,
        createdAt: new Date().toISOString(),
      });
    }
    return messages;
  });

  // ==================== PROVIDER ACTIONS ====================

  async function loadProviders(query: ListLLMProvidersQuery = {}) {
    providersLoading.value = true;
    error.value = null;
    try {
      const result = await llmApi.listProviders(query);
      providers.value = result?.items ?? [];
      providersTotal.value = result?.total ?? 0;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to load providers";
      providers.value = [];
      providersTotal.value = 0;
    } finally {
      providersLoading.value = false;
    }
  }

  async function loadDefaultProvider() {
    try {
      defaultProvider.value = await llmApi.getDefaultProvider();
    } catch (e) {
      console.error("Failed to load default provider:", e);
      defaultProvider.value = null;
    }
  }

  async function createProvider(
    data: CreateLLMProviderRequest,
  ): Promise<LLMProvider> {
    providersLoading.value = true;
    error.value = null;
    try {
      const provider = await llmApi.createProvider(data);
      providers.value.unshift(provider);
      if (data.isDefault) {
        defaultProvider.value = provider;
      }
      return provider;
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : "Failed to create provider";
      throw e;
    } finally {
      providersLoading.value = false;
    }
  }

  async function updateProvider(
    id: string,
    data: UpdateLLMProviderRequest,
  ): Promise<LLMProvider> {
    error.value = null;
    try {
      const updated = await llmApi.updateProvider(id, data);
      const index = providers.value.findIndex((p) => p.id === id);
      if (index !== -1) {
        providers.value[index] = updated;
      }
      if (defaultProvider.value?.id === id) {
        defaultProvider.value = updated;
      }
      if (selectedProvider.value?.id === id) {
        selectedProvider.value = updated;
      }
      return updated;
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : "Failed to update provider";
      throw e;
    }
  }

  async function setDefaultProvider(id: string): Promise<void> {
    error.value = null;
    try {
      await llmApi.setDefaultProvider(id);
      await loadProviders({ pageSize: config.limitDataMax });
      defaultProvider.value = providers.value.find((p) => p.isDefault) ?? null;
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : "Failed to set default provider";
      throw e;
    }
  }

  async function validateProvider(
    id: string,
  ): Promise<{ valid: boolean; message: string }> {
    try {
      return await llmApi.validateProvider(id);
    } catch (e) {
      return {
        valid: false,
        message: e instanceof Error ? e.message : "Validation failed",
      };
    }
  }

  async function deleteProvider(id: string): Promise<void> {
    error.value = null;
    try {
      await llmApi.deleteProvider(id);
      providers.value = providers.value.filter((p) => p.id !== id);
      if (defaultProvider.value?.id === id) {
        defaultProvider.value = null;
      }
      if (selectedProvider.value?.id === id) {
        selectedProvider.value = null;
      }
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : "Failed to delete provider";
      throw e;
    }
  }

  function selectProvider(provider: LLMProvider | null) {
    selectedProvider.value = provider;
  }

  // ==================== CONVERSATION ACTIONS ====================

  async function loadConversations(query: ListConversationsQuery = {}) {
    conversationsLoading.value = true;
    error.value = null;
    try {
      const result = await llmApi.listConversations(query);
      conversations.value = result?.items ?? [];
      conversationsTotal.value = result?.total ?? 0;
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : "Failed to load conversations";
      conversations.value = [];
      conversationsTotal.value = 0;
    } finally {
      conversationsLoading.value = false;
    }
  }

  async function loadConversation(id: string) {
    conversationsLoading.value = true;
    error.value = null;
    try {
      activeConversation.value = await llmApi.getConversation(id);
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : "Failed to load conversation";
      throw e;
    } finally {
      conversationsLoading.value = false;
    }
  }

  async function archiveConversation(id: string) {
    error.value = null;
    try {
      await llmApi.archiveConversation(id);
      const conv = conversations.value.find((c) => c.id === id);
      if (conv) {
        conv.isArchived = true;
      }
      if (activeConversation.value?.id === id) {
        activeConversation.value.isArchived = true;
      }
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : "Failed to archive conversation";
      throw e;
    }
  }

  async function deleteConversation(id: string) {
    error.value = null;
    try {
      await llmApi.deleteConversation(id);
      conversations.value = conversations.value.filter((c) => c.id !== id);
      if (activeConversation.value?.id === id) {
        activeConversation.value = null;
      }
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : "Failed to delete conversation";
      throw e;
    }
  }

  function clearActiveConversation() {
    activeConversation.value = null;
    streamingMessage.value = "";
  }

  /**
   * Load a conversation from history and set it as the active tab's conversation.
   * Called when the user clicks an item in the ChatHistory panel.
   */
  async function openHistoryConversation(id: string) {
    await loadConversation(id); // sets activeConversation.value
    // Sync into the currently active tab so switching tabs doesn't lose it
    if (activeTabId.value) {
      const tab = chatTabs.value.find((t) => t.id === activeTabId.value);
      if (tab && activeConversation.value) {
        tab.conversation = JSON.parse(JSON.stringify(activeConversation.value));
        const title = tab.conversation?.title;
        if (title) {
          tab.title = title.length > 30 ? title.substring(0, 30) + "…" : title;
        }
      }
    }
  }

  // ==================== CHAT ACTIONS ====================

  async function sendMessage(message: string): Promise<void> {
    if (!message.trim()) return;

    error.value = null;
    const appStore = useAppStore();
    const timeRange = appStore.globalTimeRange;
    const request: SendMessageRequest = {
      message,
      conversationId: activeConversation.value?.id,
      contextType: currentContext.value,
      contextId: currentContextId.value,
      timeFrom: new Date(timeRange.start).toISOString(),
      timeTo: new Date(timeRange.end).toISOString(),
    };

    try {
      const response = await llmApi.sendMessage(request);

      // Update or create conversation
      if (activeConversation.value) {
        activeConversation.value.messages.push(
          {
            id: `user-${Date.now()}`,
            role: "user",
            content: message,
            createdAt: new Date().toISOString(),
          },
          response.message,
        );
        activeConversation.value.messageCount += 2;
        activeConversation.value.lastMessageAt = response.message.createdAt;
      } else {
        activeConversation.value = {
          id: response.conversationId,
          title: message.substring(0, 100),
          contextType: currentContext.value,
          contextId: currentContextId.value,
          messageCount: 2,
          totalTokensUsed: response.usage?.totalTokens || 0,
          lastMessageAt: response.message.createdAt,
          isArchived: false,
          createdAt: new Date().toISOString(),
          messages: [
            {
              id: `user-${Date.now()}`,
              role: "user",
              content: message,
              createdAt: new Date().toISOString(),
            },
            response.message,
          ],
        };
        // Add to conversations list
        conversations.value.unshift({
          id: response.conversationId,
          title: message.substring(0, 100),
          contextType: currentContext.value,
          contextId: currentContextId.value,
          messageCount: 2,
          totalTokensUsed: response.usage?.totalTokens || 0,
          lastMessageAt: response.message.createdAt,
          isArchived: false,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to send message";
      throw e;
    }
  }

  function sendMessageStream(
    message: string,
    attachments?: SendMessageAttachment[],
    onComplete?: () => void,
    attachmentPreviews?: Array<{ name: string; mediaType: string; preview: string }>,
  ): () => void {
    if (!message.trim() && !attachments?.length) return () => {};

    error.value = null;
    streamingMessage.value = "";
    isStreaming.value = true;

    // PENTING: Simpan tab ID yang sedang streaming
    const streamingTabId = activeTabId.value;
    
    // PENTING: Gunakan conversationId dari tab yang aktif untuk isolasi
    const currentTab = chatTabs.value.find((t) => t.id === streamingTabId);
    const tabConversationId = currentTab?.conversation?.id;

    console.log(`Sending message in tab ${streamingTabId}:`, {
      tabId: streamingTabId,
      conversationUuid: currentTab?.conversationUuid,
      existingConversationId: tabConversationId,
      messagePreview: message.substring(0, 50),
    });

    // Include global time range so backend queries ClickHouse/PG for the correct interval
    const appStore = useAppStore();
    const timeRange = appStore.globalTimeRange;

    const request: SendMessageRequest = {
      message,
      conversationId: tabConversationId || activeConversation.value?.id,
      contextType: currentContext.value,
      contextId: currentContextId.value,
      timeFrom: new Date(timeRange.start).toISOString(),
      timeTo: new Date(timeRange.end).toISOString(),
      attachments: attachments?.length ? attachments : undefined,
    };

    // Add user message immediately — must push to BOTH activeConversation and
    // targetTab.conversation so the "end" event replacing activeConversation
    // with a JSON.parse(targetTab.conversation) copy does not drop this message.
    const userMsg = {
      id: `user-${Date.now()}`,
      role: "user" as const,
      content: message,
      createdAt: new Date().toISOString(),
      attachments: attachmentPreviews?.length ? attachmentPreviews : undefined,
    };
    if (activeConversation.value) {
      activeConversation.value.messages.push(userMsg);
    }
    if (currentTab?.conversation) {
      currentTab.conversation.messages.push({ ...userMsg });
    }

    const abort = llmApi.createMessageStream(
      request,
      (event: StreamEvent) => {
        // PENTING: Hanya update jika masih di tab yang sama
        const isStillActiveTab = activeTabId.value === streamingTabId;
        const targetTab = chatTabs.value.find((t) => t.id === streamingTabId);
        
        if (!targetTab) return;

        switch (event.type) {
          case "start":
            if (!targetTab.conversation) {
              // New conversation: initialize with the user message already pushed above
              const newConversation: ConversationDetail = {
                id: event.conversationId,
                title: message.substring(0, 100),
                contextType: currentContext.value,
                contextId: currentContextId.value,
                messageCount: 1,
                totalTokensUsed: 0,
                isArchived: false,
                createdAt: new Date().toISOString(),
                messages: [{ ...userMsg }],
              };

              targetTab.conversation = newConversation;

              if (isStillActiveTab) {
                activeConversation.value = JSON.parse(JSON.stringify(newConversation));
              }
            }
            // Update tab state saat streaming dimulai
            targetTab.isStreaming = true;
            if (isStillActiveTab) {
              isStreaming.value = true;
            }
            break;

          case "chunk":
            // Update streaming message di tab target
            targetTab.streamingMessage += event.content;
            
            // Update global state hanya jika masih di tab yang sama
            if (isStillActiveTab) {
              streamingMessage.value = targetTab.streamingMessage;
            }
            break;

          case "end":
            // Finalize the message di tab target
            if (targetTab.conversation) {
              targetTab.conversation.messages.push({
                id: event.messageId,
                role: "assistant",
                content: targetTab.streamingMessage,
                latencyMs: event.latencyMs,
                createdAt: new Date().toISOString(),
              });
              targetTab.conversation.messageCount += 1;
              targetTab.conversation.lastMessageAt = new Date().toISOString();
              
              // Auto-update tab title from first user message
              if (targetTab.title.startsWith("Chat ")) {
                const firstUserMsg = targetTab.conversation.messages.find(
                  (m) => m.role === "user",
                );
                if (firstUserMsg) {
                  targetTab.title =
                    firstUserMsg.content.substring(0, 30) +
                    (firstUserMsg.content.length > 30 ? "..." : "");
                }
              }
            }
            
            // Reset streaming state di tab target
            targetTab.streamingMessage = "";
            targetTab.isStreaming = false;
            
            // Update global state hanya jika masih di tab yang sama
            if (isStillActiveTab) {
              activeConversation.value = targetTab.conversation 
                ? JSON.parse(JSON.stringify(targetTab.conversation))
                : null;
              streamingMessage.value = "";
              isStreaming.value = false;
            }
            
            onComplete?.();
            break;

          case "error":
            error.value = event.message;
            targetTab.streamingMessage = "";
            targetTab.isStreaming = false;
            
            if (isStillActiveTab) {
              streamingMessage.value = "";
              isStreaming.value = false;
            }
            break;
        }
      },
      (err) => {
        error.value = err.message;
        const targetTab = chatTabs.value.find((t) => t.id === streamingTabId);
        if (targetTab) {
          targetTab.streamingMessage = "";
          targetTab.isStreaming = false;
          // Show the error as a message bubble in the conversation
          if (targetTab.conversation) {
            targetTab.conversation.messages.push({
              id: `error-${Date.now()}`,
              role: "assistant",
              content: err.message,
              isError: true,
              createdAt: new Date().toISOString(),
            });
          }
        }

        if (activeTabId.value === streamingTabId) {
          streamingMessage.value = "";
          isStreaming.value = false;
          if (activeConversation.value && targetTab?.conversation) {
            activeConversation.value = JSON.parse(JSON.stringify(targetTab.conversation));
          }
        }
      },
    );

    return abort;
  }

  // ==================== CHAT UI ACTIONS ====================

  function openChat() {
    chatOpen.value = true;
    chatMinimized.value = false;
  }

  function closeChat() {
    chatOpen.value = false;
    chatMinimized.value = false;
  }

  function minimizeChat() {
    chatMinimized.value = true;
  }

  function maximizeChat() {
    chatMinimized.value = false;
  }

  function toggleChat() {
    if (chatOpen.value && !chatMinimized.value) {
      closeChat();
    } else {
      openChat();
    }
  }

  function setContext(contextType: ContextType, contextId?: string) {
    currentContext.value = contextType;
    currentContextId.value = contextId;
  }

  // ==================== MULTI-TAB ACTIONS ====================

  // Helper functions untuk generate UUID
  function generateTabId(): string {
    return `tab-${Date.now()}-${crypto.randomUUID()}`;
  }

  function generateConversationUuid(): string {
    return `conv-${Date.now()}-${crypto.randomUUID()}`;
  }

  function startNewConversation() {
    // Reset conversation untuk tab yang aktif saja (isolated)
    activeConversation.value = null;
    streamingMessage.value = "";
    
    // Update tab yang aktif
    if (activeTabId.value) {
      const tab = chatTabs.value.find((t) => t.id === activeTabId.value);
      if (tab) {
        tab.conversation = null;
        tab.streamingMessage = "";
        // Generate UUID baru untuk conversation baru di tab ini
        tab.conversationUuid = generateConversationUuid();
        tab.title = `Chat ${chatTabs.value.indexOf(tab) + 1}`;
      }
    }
  }

  function createNewTab(contextType?: ContextType): string | null {
    if (chatTabs.value.length >= maxTabs) {
      console.warn(`Cannot create new tab: maximum ${maxTabs} tabs reached`);
      return null;
    }

    // PENTING: Simpan state tab yang sedang aktif SEBELUM create tab baru
    // Termasuk jika sedang streaming - streaming akan tetap berjalan di background
    if (activeTabId.value) {
      const currentTab = chatTabs.value.find((t) => t.id === activeTabId.value);
      if (currentTab) {
        // Simpan conversation yang sedang berjalan
        // Tidak perlu deep copy karena streaming event handler akan update tab langsung
        currentTab.conversation = activeConversation.value;
        
        console.log(`Saved current tab ${activeTabId.value} before creating new tab:`, {
          conversationId: currentTab.conversation?.id,
          messageCount: currentTab.conversation?.messages.length || 0,
          isStreaming: currentTab.isStreaming,
          streamingMessageLength: currentTab.streamingMessage.length,
        });
      }
    }

    const tabId = generateTabId();
    const conversationUuid = generateConversationUuid();
    
    console.log(`Creating new tab: ${tabId} with conversation UUID: ${conversationUuid}`);
    
    const newTab: ChatTab = {
      id: tabId,
      conversationUuid: conversationUuid,
      title: `Chat ${chatTabs.value.length + 1}`,
      conversation: null,
      contextType: contextType || currentContext.value,
      contextId: currentContextId.value,
      streamingMessage: "",
      isStreaming: false,
    };

    chatTabs.value.push(newTab);
    activeTabId.value = tabId;

    // Reset active conversation untuk tab baru (isolated)
    activeConversation.value = null;
    streamingMessage.value = "";
    isStreaming.value = false;

    console.log(`Tab created successfully. Total tabs: ${chatTabs.value.length}`);
    return tabId;
  }

  function switchTab(tabId: string) {
    const tab = chatTabs.value.find((t) => t.id === tabId);
    if (!tab) {
      console.error(`Tab not found: ${tabId}`);
      return;
    }

    console.log(`Switching from tab ${activeTabId.value} to ${tabId}`);

    // Save current tab state before switching (isolasi per tab)
    if (activeTabId.value) {
      const currentTab = chatTabs.value.find((t) => t.id === activeTabId.value);
      if (currentTab) {
        // Simpan state conversation ke tab yang sedang aktif dengan deep copy
        currentTab.conversation = activeConversation.value 
          ? JSON.parse(JSON.stringify(activeConversation.value))
          : null;
        currentTab.streamingMessage = streamingMessage.value;
        currentTab.isStreaming = isStreaming.value;
        
        console.log(`Saved state for tab ${currentTab.id}:`, {
          conversationId: currentTab.conversation?.id,
          messageCount: currentTab.conversation?.messages.length || 0,
        });
      }
    }

    // Switch to new tab - load conversation dari tab yang dipilih
    activeTabId.value = tabId;
    
    // PENTING: Load conversation yang spesifik untuk tab ini (isolated) dengan deep copy
    // Jangan share conversation antar tab
    activeConversation.value = tab.conversation 
      ? JSON.parse(JSON.stringify(tab.conversation))
      : null;
    streamingMessage.value = tab.streamingMessage;
    isStreaming.value = tab.isStreaming;
    currentContext.value = tab.contextType;
    currentContextId.value = tab.contextId;
    
    console.log(`Loaded state for tab ${tabId}:`, {
      conversationId: activeConversation.value?.id,
      messageCount: activeConversation.value?.messages.length || 0,
      conversationUuid: tab.conversationUuid,
    });
  }

  function closeTab(tabId: string) {
    const index = chatTabs.value.findIndex((t) => t.id === tabId);
    if (index === -1) return;

    // Don't close if streaming
    const tab = chatTabs.value[index];
    if (tab.isStreaming) return;

    chatTabs.value.splice(index, 1);

    // If closing active tab, switch to another tab
    if (activeTabId.value === tabId) {
      if (chatTabs.value.length > 0) {
        // Switch to the next tab or the previous one
        const newIndex = Math.min(index, chatTabs.value.length - 1);
        switchTab(chatTabs.value[newIndex].id);
      } else {
        activeTabId.value = null;
        activeConversation.value = null;
        streamingMessage.value = "";
        isStreaming.value = false;
      }
    }
  }

  function renameTab(tabId: string, newTitle: string) {
    const tab = chatTabs.value.find((t) => t.id === tabId);
    if (tab) {
      tab.title = newTitle.trim() || `Chat ${chatTabs.value.indexOf(tab) + 1}`;
    }
  }

  function updateActiveTabConversation() {
    if (activeTabId.value) {
      const tab = chatTabs.value.find((t) => t.id === activeTabId.value);
      if (tab) {
        // Deep copy untuk memastikan isolasi antar tab
        tab.conversation = activeConversation.value 
          ? JSON.parse(JSON.stringify(activeConversation.value))
          : null;
        
        // Auto-update title from first message
        if (
          tab.conversation?.messages.length &&
          tab.title.startsWith("Chat ")
        ) {
          const firstUserMsg = tab.conversation.messages.find(
            (m) => m.role === "user",
          );
          if (firstUserMsg) {
            tab.title =
              firstUserMsg.content.substring(0, 30) +
              (firstUserMsg.content.length > 30 ? "..." : "");
          }
        }
      }
    }
  }

  function initializeTabs() {
    if (chatTabs.value.length === 0) {
      createNewTab();
    }
  }

  // ==================== INSIGHT ACTIONS ====================

  async function generateInsight(
    request: GenerateInsightRequest,
  ): Promise<Insight> {
    insightLoading.value = true;
    error.value = null;
    try {
      currentInsight.value = await llmApi.generateInsight(request);
      return currentInsight.value;
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : "Failed to generate insight";
      throw e;
    } finally {
      insightLoading.value = false;
    }
  }

  async function generateChronology(
    contextType: ContextType,
    contextId?: string,
  ) {
    return generateInsight({
      insightType: "chronology",
      contextType,
      contextId,
    });
  }

  async function generateRootCause(
    contextType: ContextType,
    contextId?: string,
  ) {
    return generateInsight({
      insightType: "root-cause",
      contextType,
      contextId,
    });
  }

  async function generatePrediction(
    contextType: ContextType,
    contextId?: string,
  ) {
    return generateInsight({
      insightType: "prediction",
      contextType,
      contextId,
    });
  }

  async function generateRecommendations(
    contextType: ContextType,
    contextId?: string,
  ) {
    return generateInsight({
      insightType: "recommendation",
      contextType,
      contextId,
    });
  }

  async function detectPatterns(contextType: ContextType, contextId?: string) {
    return generateInsight({
      insightType: "pattern",
      contextType,
      contextId,
    });
  }

  function clearInsight() {
    currentInsight.value = null;
  }

  // ==================== INITIALIZATION ====================

  async function initialize() {
    await loadDefaultProvider();
    try {
      await loadConversations({ pageSize: 10, isArchived: false });
    } catch {
      // Silently handle — conversations may not be available yet
    }
  }

  // ==================== RETURN ====================

  return {
    // State
    providers,
    defaultProvider,
    selectedProvider,
    providersLoading,
    providersTotal,
    conversations,
    activeConversation,
    conversationsLoading,
    conversationsTotal,
    chatOpen,
    chatMinimized,
    currentContext,
    currentContextId,
    streamingMessage,
    isStreaming,
    currentInsight,
    insightLoading,
    error,

    // Getters
    hasDefaultProvider,
    activeProviders,
    recentConversations,
    currentMessages,
    displayMessages,
    activeTab,
    canCreateNewTab,

    // Provider actions
    loadProviders,
    loadDefaultProvider,
    createProvider,
    updateProvider,
    setDefaultProvider,
    validateProvider,
    deleteProvider,
    selectProvider,

    // Conversation actions
    loadConversations,
    loadConversation,
    openHistoryConversation,
    archiveConversation,
    deleteConversation,
    clearActiveConversation,

    // Chat actions
    sendMessage,
    sendMessageStream,
    openChat,
    closeChat,
    minimizeChat,
    maximizeChat,
    toggleChat,
    setContext,
    startNewConversation,

    // Multi-tab actions
    chatTabs,
    activeTabId,
    maxTabs,
    createNewTab,
    switchTab,
    closeTab,
    renameTab,
    updateActiveTabConversation,
    initializeTabs,

    // Insight actions
    generateInsight,
    generateChronology,
    generateRootCause,
    generatePrediction,
    generateRecommendations,
    detectPatterns,
    clearInsight,

    // Initialization
    initialize,
  };
});

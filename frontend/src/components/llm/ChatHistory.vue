<template>
  <div class="chat-history">
    <!-- Header -->
    <div class="history-header">
      <div class="history-header-title">
        <n-icon size="14" color="#6366f1">
          <HistoryIcon />
        </n-icon>
        <span>History</span>
      </div>
      <n-button quaternary circle size="tiny" @click="$emit('close')">
        <template #icon>
          <n-icon size="14">
            <CloseIcon />
          </n-icon>
        </template>
      </n-button>
    </div>

    <!-- Search -->
    <div class="history-search">
      <n-input v-model:value="searchQuery" placeholder="Search..." size="small" clearable>
        <template #prefix>
          <n-icon size="13" color="#9ca3af">
            <SearchIcon />
          </n-icon>
        </template>
      </n-input>
    </div>

    <!-- New Conversation -->
    <div class="history-new">
      <n-button block size="small" secondary @click="handleNewConversation">
        <template #icon>
          <n-icon>
            <PlusIcon />
          </n-icon>
        </template>
        New Chat
      </n-button>
    </div>

    <!-- List -->
    <div class="history-list">
      <div v-if="conversationsLoading && conversations.length === 0" class="history-loading">
        <n-spin size="small" />
        <span>Loading...</span>
      </div>

      <div v-else-if="filteredConversations.length === 0" class="history-empty">
        <n-icon size="32" color="#d1d5db">
          <ChatIcon />
        </n-icon>
        <p>{{ searchQuery ? 'No results' : 'No history yet' }}</p>
      </div>

      <div v-else class="history-items">
        <div
          v-for="conv in filteredConversations" :key="conv.id" class="history-item"
          :class="{ 'history-item--active': activeConversation?.id === conv.id }" @click="handleOpen(conv)"
        >
          <!-- Context badge -->
          <n-tag
            size="tiny" round :bordered="false" class="history-item-ctx"
            :style="{ background: contextColor(conv.contextType) + '22', color: contextColor(conv.contextType) }"
          >
            {{ contextLabel(conv.contextType) }}
          </n-tag>

          <!-- Title + meta -->
          <div class="history-item-body">
            <p class="history-item-title" :title="conv.title || 'Untitled'">
              {{ conv.title || 'Untitled' }}
            </p>
            <p class="history-item-meta">
              <span>{{ conv.messageCount }} msg{{ conv.messageCount !== 1 ? 's' : '' }}</span>
              <span class="dot">&middot;</span>
              <span>{{ relativeTime(conv.lastMessageAt || conv.createdAt) }}</span>
            </p>
          </div>

          <!-- Delete button -->
          <button class="history-item-del" title="Delete" @click.stop="handleDelete(conv.id)">
            <n-icon size="12">
              <TrashIcon />
            </n-icon>
          </button>
        </div>

        <!-- Load more -->
        <div v-if="hasMore" class="history-load-more">
          <n-button text size="tiny" :loading="conversationsLoading" @click="loadMore">
            Load more
          </n-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { NButton, NIcon, NInput, NSpin, NTag, useDialog, useMessage } from 'naive-ui';
import {
  TimeOutline as HistoryIcon,
  CloseOutline as CloseIcon,
  SearchOutline as SearchIcon,
  AddOutline as PlusIcon,
  ChatboxOutline as ChatIcon,
  TrashOutline as TrashIcon,
} from '@vicons/ionicons5';
import { useLLMStore } from '@/store';
import { CONTEXT_TYPES } from '@/types/llm';
import type { Conversation } from '@/types/llm';

const emit = defineEmits<{
  close: [];
}>();

const llmStore = useLLMStore();
const dialog = useDialog();
const message = useMessage();

const {
  conversations,
  conversationsLoading,
  conversationsTotal,
  activeConversation,
} = storeToRefs(llmStore);

const {
  loadConversations,
  openHistoryConversation,
  deleteConversation,
  startNewConversation,
} = llmStore;

// ── State ──────────────────────────────────────────────────────────────────────
const searchQuery = ref('');
const pageSize = 30;
const currentPage = ref(1);

// ── Computed ───────────────────────────────────────────────────────────────────
const filteredConversations = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  if (!q) return conversations.value;
  return conversations.value.filter((c) =>
    (c.title || '').toLowerCase().includes(q),
  );
});

const hasMore = computed(
  () => conversations.value.length < conversationsTotal.value && !searchQuery.value,
);

// ── Actions ────────────────────────────────────────────────────────────────────
async function load(reset = false) {
  if (reset) currentPage.value = 1;
  await loadConversations({
    pageSize,
    page: currentPage.value,
    isArchived: false,
  });
}

async function loadMore() {
  currentPage.value++;
  await loadConversations({
    pageSize,
    page: currentPage.value,
    isArchived: false,
  });
}

async function handleOpen(conv: Conversation) {
  try {
    await openHistoryConversation(conv.id);
    emit('close');
  } catch {
    message.error('Failed to load conversation');
  }
}

function handleNewConversation() {
  startNewConversation();
  emit('close');
}

function handleDelete(id: string) {
  dialog.warning({
    title: 'Delete Conversation',
    content: 'Are you sure you want to delete this conversation? This cannot be undone.',
    positiveText: 'Delete',
    negativeText: 'Cancel',
    onPositiveClick: async () => {
      try {
        await deleteConversation(id);
        message.success('Conversation deleted');
      } catch {
        message.error('Failed to delete conversation');
      }
    },
  });
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function contextLabel(ct: string): string {
  return CONTEXT_TYPES[ct as keyof typeof CONTEXT_TYPES]?.label?.split(' ')[0] || ct;
}

const CONTEXT_COLORS: Record<string, string> = {
  metrics: '#3b82f6',
  logs: '#10b981',
  traces: '#8b5cf6',
  alerts: '#ef4444',
  dashboard: '#6366f1',
  kubernetes: '#0ea5e9',
  infrastructure: '#f59e0b',
  uptime: '#22c55e',
  'service-map': '#06b6d4',
  'network-map': '#14b8a6',
  reports: '#a855f7',
};

function contextColor(ct: string): string {
  return CONTEXT_COLORS[ct] || '#6366f1';
}

function relativeTime(iso?: string): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Lifecycle ──────────────────────────────────────────────────────────────────
onMounted(() => load(true));

// Reload when search cleared
watch(searchQuery, (val) => {
  if (!val) load(true);
});
</script>

<style scoped>
.chat-history {
  width: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e2e8f0;
  background: #f8fafc;
  overflow: hidden;
}

/* ── Header ─────────────────────────────────────────────── */
.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.history-header-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

/* ── Search ─────────────────────────────────────────────── */
.history-search {
  padding: 8px 10px 4px;
  flex-shrink: 0;
}

/* ── New Chat ────────────────────────────────────────────── */
.history-new {
  padding: 4px 10px 8px;
  flex-shrink: 0;
  border-bottom: 1px solid #e2e8f0;
}

/* ── List ────────────────────────────────────────────────── */
.history-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 6px 0;

  &::-webkit-scrollbar {
    width: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 2px;
  }
}

.history-loading,
.history-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px 12px;
  color: #9ca3af;
  font-size: 12px;
  text-align: center;
}

.history-items {
  display: flex;
  flex-direction: column;
}

/* ── Item ────────────────────────────────────────────────── */
.history-item {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  cursor: pointer;
  transition: background 0.15s;
  border-left: 2px solid transparent;

  &:hover {
    background: rgba(99, 102, 241, 0.06);

    .history-item-del {
      opacity: 1;
    }
  }

  &.history-item--active {
    background: rgba(99, 102, 241, 0.1);
    border-left-color: #6366f1;
  }
}

.history-item-ctx {
  font-size: 10px;
  line-height: 1.2;
  width: fit-content;
}

.history-item-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-right: 18px;
  /* space for delete btn */
}

.history-item-title {
  font-size: 12px;
  font-weight: 500;
  color: #1e293b;
  margin: 0;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.3;
}

.history-item-meta {
  font-size: 10px;
  color: #9ca3af;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.dot {
  font-size: 10px;
}

.history-item-del {
  position: absolute;
  top: 6px;
  right: 6px;
  opacity: 0;
  transition: opacity 0.15s;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #ef4444;
  padding: 2px;
  border-radius: 4px;
  display: flex;
  align-items: center;

  &:hover {
    background: rgba(239, 68, 68, 0.1);
  }
}

/* ── Load more ───────────────────────────────────────────── */
.history-load-more {
  display: flex;
  justify-content: center;
  padding: 8px;
}

/* ── Dark mode ───────────────────────────────────────────── */
:global(html.dark) .chat-history {
  background: #1e2433;
  border-right-color: rgba(255, 255, 255, 0.1);
}

:global(html.dark) .history-header {
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

:global(html.dark) .history-header-title {
  color: #e2e8f0;
}

:global(html.dark) .history-new {
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

:global(html.dark) .history-item-title {
  color: #e2e8f0;
}

:global(html.dark) .history-item:hover {
  background: rgba(99, 102, 241, 0.12);
}

:global(html.dark) .history-item--active {
  background: rgba(99, 102, 241, 0.18);
}
</style>
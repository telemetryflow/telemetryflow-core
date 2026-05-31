<template>
  <div
    :class="[
      'flex gap-3',
      message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
    ]"
  >
    <!-- Avatar -->
    <div
      :class="[
        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
        message.isError
          ? 'bg-red-500'
          : message.role === 'user'
            ? 'bg-blue-500'
            : 'bg-gradient-to-br from-indigo-500 to-purple-600'
      ]"
    >
      <n-icon size="16" color="white">
        <AlertIcon v-if="message.isError" />
        <PersonIcon v-else-if="message.role === 'user'" />
        <SparklesIcon v-else />
      </n-icon>
    </div>

    <!-- Message Content -->
    <div
      :class="[
        'flex-1',
        message.role === 'user' ? 'max-w-[85%] text-right' : 'max-w-[95%] text-left'
      ]"
    >
      <div
        :class="[
          'inline-block px-4 py-2 rounded-2xl',
          message.isError
            ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700 rounded-bl-sm message-error'
            : message.role === 'user'
              ? 'bg-blue-500 text-white rounded-br-sm'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-sm message-assistant'
        ]"
      >
        <!-- Error message -->
        <template v-if="message.isError">
          <p class="whitespace-pre-wrap text-sm font-medium">{{ message.content }}</p>
        </template>

        <!-- User message: optional image thumbnails + text -->
        <template v-else-if="message.role === 'user'">
          <div v-if="message.attachments?.length" class="msg-attachments">
            <img
              v-for="att in message.attachments"
              :key="att.name"
              :src="att.preview"
              :alt="att.name"
              :title="att.name"
              class="msg-attachment-img"
            />
          </div>
          <p class="whitespace-pre-wrap text-sm">{{ message.content }}</p>
        </template>

        <!-- Assistant message: markdown rendered -->
        <template v-else>
          <div class="prose prose-sm dark:prose-invert max-w-none" v-html="renderedContent" />
        </template>
      </div>

      <!-- Message metadata + action buttons (assistant only) -->
      <div v-if="message.role === 'assistant'" class="message-footer">
        <div v-if="message.tokensUsed || message.latencyMs" class="message-meta">
          <span v-if="message.tokensUsed">{{ message.tokensUsed }} tokens</span>
          <span v-if="message.tokensUsed && message.latencyMs"> &middot; </span>
          <span v-if="message.latencyMs">{{ formatLatency(message.latencyMs) }}</span>
        </div>
        <div v-if="!message.isError" class="message-actions">
          <button class="action-btn" :class="{ copied }" :title="copied ? 'Copied!' : 'Copy'" @click="copyMessage">
            <Icon :icon="copied ? 'carbon:checkmark' : 'carbon:copy'" width="13" height="13" />
            <span>{{ copied ? 'Copied' : 'Copy' }}</span>
          </button>
          <button class="action-btn" title="Export to Word" @click="exportToWord">
            <Icon icon="carbon:document-word-processor" width="13" height="13" />
            <span>Export</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { NIcon } from "naive-ui";
import { Icon } from "@iconify/vue";
import {
  PersonOutline as PersonIcon,
  SparklesOutline as SparklesIcon,
  AlertCircleOutline as AlertIcon,
} from "@vicons/ionicons5";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { storeToRefs } from "pinia";
import { useLLMStore } from "@/store";
import type { ChatMessage } from "@/types/llm";

const llmStore = useLLMStore();
const { currentContext } = storeToRefs(llmStore);

const props = defineProps<{
  message: ChatMessage;
}>();

// Configure marked for safe rendering
marked.setOptions({
  breaks: true,
  gfm: true,
});

const renderedContent = computed(() => {
  if (props.message.role === "user") {
    return props.message.content;
  }
  // Render markdown and sanitize
  const html = marked(props.message.content) as string;
  return DOMPurify.sanitize(html);
});

function formatLatency(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(1)}s`;
}

// ── Action buttons ────────────────────────────────────────────────────────────

const copied = ref(false);

async function copyMessage() {
  try {
    await navigator.clipboard.writeText(props.message.content);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  } catch {
    // fallback for older browsers
    const ta = document.createElement("textarea");
    ta.value = props.message.content;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  }
}

function exportToWord() {
  const html = marked(props.message.content) as string;
  const safe = DOMPurify.sanitize(html);

  const timestamp = new Date().toLocaleString();
  const wordHtml = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>AI Assistant Response</title>
  <!--[if gte mso 9]>
  <xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml>
  <![endif]-->
  <style>
    body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.5; margin: 2cm; }
    h1, h2, h3 { color: #1e293b; }
    h1 { font-size: 18pt; }
    h2 { font-size: 15pt; }
    h3 { font-size: 13pt; }
    table { border-collapse: collapse; width: 100%; margin: 8pt 0; }
    th, td { border: 1px solid #cbd5e1; padding: 5pt 8pt; text-align: left; }
    th { background-color: #f1f5f9; font-weight: bold; }
    pre, code { font-family: Consolas, Courier New, monospace; font-size: 10pt; background: #f8fafc; padding: 2pt 4pt; }
    pre { padding: 8pt; display: block; }
    blockquote { border-left: 3px solid #6366f1; margin-left: 16pt; padding-left: 8pt; color: #475569; }
    .meta { color: #94a3b8; font-size: 9pt; margin-bottom: 12pt; border-bottom: 1px solid #e2e8f0; padding-bottom: 6pt; }
  </style>
</head>
<body>
  <div class="meta">AI Assistant Response &mdash; ${timestamp}</div>
  ${safe}
</body>
</html>`.trim();

  const blob = new Blob([wordHtml], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const dt = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  a.download = `telemetryflow-${currentContext.value}-${dt}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}
</script>

<style scoped>
/* Image thumbnails inside user message bubble */
.msg-attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.msg-attachment-img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

/* Footer: meta + actions */
.message-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  min-height: 20px;
}

.message-meta {
  font-size: 0.7rem;
  color: #9ca3af;
  flex-shrink: 0;
}

.message-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

/* Show actions on hover of the parent message row */
.flex:hover .message-actions {
  opacity: 1;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  border: 1px solid rgba(128, 128, 128, 0.25);
  border-radius: 4px;
  background: transparent;
  color: #9ca3af;
  font-size: 0.68rem;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
  white-space: nowrap;

  &:hover {
    color: #6366f1;
    border-color: #6366f1;
    background: rgba(99, 102, 241, 0.06);
  }

  &.copied {
    color: #22c55e;
    border-color: #22c55e;
    background: rgba(34, 197, 94, 0.06);
  }
}

:global(html.dark) .action-btn {
  color: #6b7280;
  border-color: rgba(255, 255, 255, 0.15);

  &:hover {
    color: #818cf8;
    border-color: #818cf8;
    background: rgba(129, 140, 248, 0.08);
  }

  &.copied {
    color: #4ade80;
    border-color: #4ade80;
    background: rgba(74, 222, 128, 0.08);
  }
}

/* Assistant message container */
.message-assistant {
  text-align: left;
  min-width: 200px;
}

.prose {
  font-size: 0.875rem;
  line-height: 1.5;
  text-align: left;
}

.prose :deep(h1),
.prose :deep(h2),
.prose :deep(h3) {
  font-weight: 600;
  margin-top: 1em;
  margin-bottom: 0.5em;
}

.prose :deep(h1) {
  font-size: 1.25rem;
}

.prose :deep(h2) {
  font-size: 1.125rem;
}

.prose :deep(h3) {
  font-size: 1rem;
}

.prose :deep(ul) {
  padding-left: 1.5rem;
  margin: 0.5em 0;
  list-style-type: disc;
}

.prose :deep(ol) {
  padding-left: 1.5rem;
  margin: 0.5em 0;
  list-style-type: decimal;
}

.prose :deep(ul ul) {
  list-style-type: circle;
}

.prose :deep(ul ul ul) {
  list-style-type: square;
}

.prose :deep(ol ol) {
  list-style-type: lower-alpha;
}

.prose :deep(ol ol ol) {
  list-style-type: lower-roman;
}

.prose :deep(li) {
  margin: 0.25em 0;
  display: list-item;
}

.prose :deep(li::marker) {
  color: #6366f1;
  font-weight: 500;
}

.prose :deep(code) {
  background: rgba(0, 0, 0, 0.1);
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.8em;
}

.prose :deep(pre) {
  background: rgba(0, 0, 0, 0.1);
  padding: 0.75rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 0.5em 0;
}

.prose :deep(pre code) {
  background: none;
  padding: 0;
}

.prose :deep(strong) {
  font-weight: 600;
}

.prose :deep(blockquote) {
  border-left: 3px solid #6366f1;
  padding-left: 1rem;
  margin: 0.5em 0;
  color: inherit;
  opacity: 0.9;
}

.prose :deep(p) {
  margin: 0.5em 0;
}

.prose :deep(p:first-child) {
  margin-top: 0;
}

.prose :deep(p:last-child) {
  margin-bottom: 0;
}

/* Table styles */
.prose :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 0.75em 0;
  font-size: 0.8em;
}

.prose :deep(th),
.prose :deep(td) {
  border: 1px solid rgba(128, 128, 128, 0.3);
  padding: 0.4rem 0.6rem;
  text-align: left;
}

.prose :deep(th) {
  background: rgba(0, 0, 0, 0.05);
  font-weight: 600;
}

.prose :deep(tr:nth-child(even)) {
  background: rgba(0, 0, 0, 0.02);
}

/* Dark mode table */
:global(html.dark) .prose :deep(th) {
  background: rgba(255, 255, 255, 0.1);
}

:global(html.dark) .prose :deep(tr:nth-child(even)) {
  background: rgba(255, 255, 255, 0.05);
}

:global(html.dark) .prose :deep(th),
:global(html.dark) .prose :deep(td) {
  border-color: rgba(255, 255, 255, 0.2);
}

/* Dark mode list markers */
:global(html.dark) .prose :deep(li::marker) {
  color: #818cf8;
}

/* Horizontal rule */
.prose :deep(hr) {
  border: none;
  border-top: 1px solid rgba(128, 128, 128, 0.3);
  margin: 1em 0;
}

/* Links */
.prose :deep(a) {
  color: #6366f1;
  text-decoration: underline;
}

.prose :deep(a:hover) {
  color: #4f46e5;
}

/* Task list / Checkbox list */
.prose :deep(ul.contains-task-list),
.prose :deep(ul:has(> li > input[type="checkbox"])) {
  list-style-type: none;
  padding-left: 0.5rem;
}

.prose :deep(li > input[type="checkbox"]) {
  margin-right: 0.5rem;
  accent-color: #6366f1;
}

/* Code block improvements */
.prose :deep(pre) {
  background: #1e293b;
  color: #e2e8f0;
}

:global(html.dark) .prose :deep(pre) {
  background: #0f172a;
}

:global(html.dark) .prose :deep(code) {
  background: rgba(255, 255, 255, 0.1);
}

/* Definition list */
.prose :deep(dl) {
  margin: 0.5em 0;
}

.prose :deep(dt) {
  font-weight: 600;
  margin-top: 0.5em;
}

.prose :deep(dd) {
  margin-left: 1.5rem;
  margin-bottom: 0.25em;
}
</style>
<template>
  <div class="rich-text-input">
    <!-- Formatting Toolbar -->
    <div class="toolbar flex items-center gap-1 px-2 py-1 border-b border-gray-200 dark:border-gray-600">
      <!-- Text Formatting -->
      <n-tooltip>
        <template #trigger>
          <n-button quaternary size="tiny" :disabled="disabled" @click="insertFormat('bold')">
            <template #icon>
              <n-icon size="16"><BoldIcon /></n-icon>
            </template>
          </n-button>
        </template>
        Bold (Ctrl+B)
      </n-tooltip>

      <n-tooltip>
        <template #trigger>
          <n-button quaternary size="tiny" :disabled="disabled" @click="insertFormat('italic')">
            <template #icon>
              <n-icon size="16"><ItalicIcon /></n-icon>
            </template>
          </n-button>
        </template>
        Italic (Ctrl+I)
      </n-tooltip>

      <n-tooltip>
        <template #trigger>
          <n-button quaternary size="tiny" :disabled="disabled" @click="insertFormat('code')">
            <template #icon>
              <n-icon size="16"><CodeIcon /></n-icon>
            </template>
          </n-button>
        </template>
        Code
      </n-tooltip>

      <n-divider vertical class="!mx-1" />

      <!-- Lists -->
      <n-tooltip>
        <template #trigger>
          <n-button quaternary size="tiny" :disabled="disabled" @click="insertFormat('bullet')">
            <template #icon>
              <n-icon size="16"><ListIcon /></n-icon>
            </template>
          </n-button>
        </template>
        Bullet List
      </n-tooltip>

      <n-tooltip>
        <template #trigger>
          <n-button quaternary size="tiny" :disabled="disabled" @click="insertFormat('number')">
            <template #icon>
              <n-icon size="16"><NumberListIcon /></n-icon>
            </template>
          </n-button>
        </template>
        Numbered List
      </n-tooltip>

      <n-divider vertical class="!mx-1" />

      <!-- Block Elements -->
      <n-tooltip>
        <template #trigger>
          <n-button quaternary size="tiny" :disabled="disabled" @click="insertFormat('heading')">
            <template #icon>
              <n-icon size="16"><HeadingIcon /></n-icon>
            </template>
          </n-button>
        </template>
        Heading
      </n-tooltip>

      <n-tooltip>
        <template #trigger>
          <n-button quaternary size="tiny" :disabled="disabled" @click="insertFormat('quote')">
            <template #icon>
              <n-icon size="16"><QuoteIcon /></n-icon>
            </template>
          </n-button>
        </template>
        Quote
      </n-tooltip>

      <n-tooltip>
        <template #trigger>
          <n-button quaternary size="tiny" :disabled="disabled" @click="insertFormat('codeblock')">
            <template #icon>
              <n-icon size="16"><CodeBlockIcon /></n-icon>
            </template>
          </n-button>
        </template>
        Code Block
      </n-tooltip>

      <n-divider vertical class="!mx-1" />

      <!-- Table -->
      <n-popover trigger="click" placement="top" :z-index="2147483647">
        <template #trigger>
          <n-tooltip>
            <template #trigger>
              <n-button quaternary size="tiny" :disabled="disabled">
                <template #icon>
                  <n-icon size="16"><TableIcon /></n-icon>
                </template>
              </n-button>
            </template>
            Insert Table
          </n-tooltip>
        </template>
        <div class="p-2">
          <div class="text-sm font-medium mb-2">Insert Table</div>
          <div class="flex items-center gap-2 mb-2">
            <n-input-number v-model:value="tableRows" size="small" :min="1" :max="10" placeholder="Rows" class="w-20" />
            <span>×</span>
            <n-input-number v-model:value="tableCols" size="small" :min="1" :max="10" placeholder="Cols" class="w-20" />
          </div>
          <n-button size="small" type="primary" block @click="insertTable">Insert</n-button>
        </div>
      </n-popover>

      <n-tooltip>
        <template #trigger>
          <n-button quaternary size="tiny" :disabled="disabled" @click="insertFormat('link')">
            <template #icon>
              <n-icon size="16"><LinkIcon /></n-icon>
            </template>
          </n-button>
        </template>
        Insert Link
      </n-tooltip>

      <div class="flex-1" />

      <!-- Preview Toggle -->
      <n-tooltip>
        <template #trigger>
          <n-button
            quaternary
            size="tiny"
            :type="showPreview ? 'primary' : 'default'"
            @click="showPreview = !showPreview"
          >
            <template #icon>
              <n-icon size="16"><PreviewIcon /></n-icon>
            </template>
          </n-button>
        </template>
        {{ showPreview ? 'Hide Preview' : 'Show Preview' }}
      </n-tooltip>
    </div>

    <!-- Input Area -->
    <div class="input-container">
      <textarea
        ref="textareaRef"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :class="['input-textarea', { 'input-textarea--resizable': resizable }]"
        :style="{ minHeight: minHeight + 'px', maxHeight: maxHeight + 'px' }"
        @input="handleInput"
        @keydown="handleKeydown"
      />
    </div>

    <!-- Preview (Optional) -->
    <div v-if="showPreview && modelValue" class="preview-container p-2 border-t border-gray-200 dark:border-gray-600">
      <div class="text-xs text-gray-500 mb-1">Preview:</div>
      <div class="preview-content prose prose-sm max-w-none" v-html="renderedPreview" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import { NButton, NIcon, NTooltip, NDivider, NPopover, NInputNumber } from "naive-ui";
import {
  TextOutline as BoldIcon,
  TextOutline as ItalicIcon,
  CodeSlashOutline as CodeIcon,
  ListOutline as ListIcon,
  ReorderFourOutline as NumberListIcon,
  TextOutline as HeadingIcon,
  ChatboxOutline as QuoteIcon,
  CodeOutline as CodeBlockIcon,
  GridOutline as TableIcon,
  LinkOutline as LinkIcon,
  EyeOutline as PreviewIcon,
} from "@vicons/ionicons5";
import { marked } from "marked";
import DOMPurify from "dompurify";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    placeholder?: string;
    disabled?: boolean;
    minHeight?: number;
    maxHeight?: number;
    resizable?: boolean;
  }>(),
  {
    placeholder: "Type a message...",
    disabled: false,
    minHeight: 40,
    maxHeight: 200,
    resizable: false,
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "submit"): void;
}>();

const textareaRef = ref<HTMLTextAreaElement | null>(null);
const showPreview = ref(false);
const tableRows = ref(3);
const tableCols = ref(3);

// Render markdown preview
const renderedPreview = computed(() => {
  if (!props.modelValue) return "";
  const html = marked(props.modelValue) as string;
  return DOMPurify.sanitize(html);
});

function handleInput(e: Event) {
  const target = e.target as HTMLTextAreaElement;
  emit("update:modelValue", target.value);
  autoResize();
}

function handleKeydown(e: KeyboardEvent) {
  // Submit on Enter (without Shift)
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    emit("submit");
    return;
  }

  // Keyboard shortcuts
  if (e.ctrlKey || e.metaKey) {
    switch (e.key.toLowerCase()) {
      case "b":
        e.preventDefault();
        insertFormat("bold");
        break;
      case "i":
        e.preventDefault();
        insertFormat("italic");
        break;
    }
  }
}

function autoResize() {
  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.style.height = "auto";
      const scrollHeight = textareaRef.value.scrollHeight;
      textareaRef.value.style.height = Math.min(scrollHeight, props.maxHeight) + "px";
    }
  });
}

function insertFormat(type: string) {
  if (!textareaRef.value) return;

  const textarea = textareaRef.value;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = props.modelValue.substring(start, end);
  const beforeText = props.modelValue.substring(0, start);
  const afterText = props.modelValue.substring(end);

  let insertText = "";
  let cursorOffset = 0;

  switch (type) {
    case "bold":
      insertText = `**${selectedText || "bold text"}**`;
      cursorOffset = selectedText ? insertText.length : 2;
      break;
    case "italic":
      insertText = `*${selectedText || "italic text"}*`;
      cursorOffset = selectedText ? insertText.length : 1;
      break;
    case "code":
      insertText = `\`${selectedText || "code"}\``;
      cursorOffset = selectedText ? insertText.length : 1;
      break;
    case "bullet":
      insertText = `\n- ${selectedText || "List item"}`;
      cursorOffset = insertText.length;
      break;
    case "number":
      insertText = `\n1. ${selectedText || "List item"}`;
      cursorOffset = insertText.length;
      break;
    case "heading":
      insertText = `\n## ${selectedText || "Heading"}`;
      cursorOffset = insertText.length;
      break;
    case "quote":
      insertText = `\n> ${selectedText || "Quote"}`;
      cursorOffset = insertText.length;
      break;
    case "codeblock":
      insertText = `\n\`\`\`\n${selectedText || "code"}\n\`\`\``;
      cursorOffset = selectedText ? insertText.length : 5;
      break;
    case "link":
      insertText = `[${selectedText || "link text"}](url)`;
      cursorOffset = selectedText ? insertText.length - 1 : insertText.length - 4;
      break;
  }

  const newValue = beforeText + insertText + afterText;
  emit("update:modelValue", newValue);

  // Set cursor position
  nextTick(() => {
    if (textareaRef.value) {
      const newPosition = start + cursorOffset;
      textareaRef.value.focus();
      textareaRef.value.setSelectionRange(newPosition, newPosition);
    }
  });
}

function insertTable() {
  if (!textareaRef.value) return;

  const textarea = textareaRef.value;
  const start = textarea.selectionStart;
  const beforeText = props.modelValue.substring(0, start);
  const afterText = props.modelValue.substring(start);

  // Build table markdown
  let table = "\n";

  // Header row
  const headers = Array(tableCols.value)
    .fill("")
    .map((_, i) => `Header ${i + 1}`)
    .join(" | ");
  table += `| ${headers} |\n`;

  // Separator row
  const separator = Array(tableCols.value)
    .fill("---")
    .join(" | ");
  table += `| ${separator} |\n`;

  // Data rows
  for (let r = 0; r < tableRows.value; r++) {
    const cells = Array(tableCols.value)
      .fill("")
      .map((_, c) => `Cell ${r + 1}-${c + 1}`)
      .join(" | ");
    table += `| ${cells} |\n`;
  }

  const newValue = beforeText + table + afterText;
  emit("update:modelValue", newValue);

  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.focus();
    }
  });
}

// Auto-resize on initial value
watch(
  () => props.modelValue,
  () => {
    autoResize();
  },
  { immediate: true }
);
</script>

<style scoped lang="scss">
.rich-text-input {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  overflow: hidden;
}

.toolbar {
  background: #f8fafc;
}

.input-textarea {
  width: 100%;
  padding: 8px 12px;
  border: none;
  outline: none;
  resize: none;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  background: transparent;
  color: inherit;

  &::placeholder {
    color: #9ca3af;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &--resizable {
    resize: vertical;
    overflow-y: auto;
  }
}

.preview-container {
  background: #f9fafb;
  max-height: 150px;
  overflow-y: auto;
}

.preview-content {
  font-size: 13px;
  line-height: 1.5;

  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0;

    th, td {
      border: 1px solid #e2e8f0;
      padding: 6px 10px;
      text-align: left;
    }

    th {
      background: #f1f5f9;
      font-weight: 600;
    }
  }

  :deep(code) {
    background: #f1f5f9;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
  }

  :deep(pre) {
    background: #1e293b;
    color: #e2e8f0;
    padding: 12px;
    border-radius: 6px;
    overflow-x: auto;

    code {
      background: transparent;
      padding: 0;
    }
  }

  :deep(blockquote) {
    border-left: 3px solid #6366f1;
    padding-left: 12px;
    margin: 8px 0;
    color: #64748b;
  }

  :deep(ul), :deep(ol) {
    padding-left: 20px;
    margin: 8px 0;
  }

  :deep(h1), :deep(h2), :deep(h3) {
    margin: 8px 0;
    font-weight: 600;
  }

  :deep(a) {
    color: #6366f1;
    text-decoration: underline;
  }
}
</style>

<style lang="scss">
// Dark mode styles
html.dark {
  .rich-text-input {
    border-color: #4f46e5 !important; // indigo-600 border for better visibility
    background: #1e293b !important; // slate-800
    box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.3);
  }

  .toolbar {
    background: #0f172a !important; // slate-900 - darker for contrast
    border-bottom: 1px solid #334155 !important;

    // Toolbar buttons styling
    .n-button {
      color: #94a3b8 !important; // slate-400

      &:hover:not(:disabled) {
        color: #e2e8f0 !important;
        background: rgba(99, 102, 241, 0.2) !important;
      }
    }

    // Dividers
    .n-divider {
      background-color: #334155 !important;
    }
  }

  .input-textarea {
    color: #f1f5f9 !important;
    background: #1e293b !important;

    &::placeholder {
      color: #64748b !important;
    }
  }

  .input-container {
    background: #1e293b !important;
  }

  .preview-container {
    background: #0f172a !important;
    border-color: #334155 !important;
  }

  .preview-content {
    color: #e2e8f0;

    :deep(table) {
      th, td {
        border-color: #475569;
      }

      th {
        background: #334155;
      }
    }

    :deep(code) {
      background: #475569;
    }

    :deep(blockquote) {
      color: #94a3b8;
    }
  }

  // Table popover styling
  .n-popover {
    background: #1e293b !important;
    border-color: #475569 !important;

    .n-button--primary-type {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
      border: none !important;
      color: #ffffff !important;

      .n-button__content {
        color: #ffffff !important;
      }

      &:hover {
        background: linear-gradient(135deg, #818cf8 0%, #a78bfa 100%) !important;
      }
    }
  }

  // Toolbar icon buttons
  .toolbar .n-button {
    .n-icon {
      color: inherit !important;
    }
  }
}
</style>

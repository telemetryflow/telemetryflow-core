<script setup lang="ts">
import { computed } from "vue";
import { Icon } from "@iconify/vue";
import QueryEditorRow from "./QueryEditorRow.vue";
import type { QueryRowState } from "@/composables/useQueryPanel";
import type { QueryTemplate, SignalSource } from "@/utils/query-templates";

interface Props {
  rows: QueryRowState[];
  loading?: boolean;
  collapsed?: boolean;
  templateSuggestions?: QueryTemplate[];
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  collapsed: true,
  templateSuggestions: () => [],
});

const emit = defineEmits<{
  (e: "update:collapsed", value: boolean): void;
  (e: "update-query", index: number, text: string): void;
  (e: "update-type", index: number, type: SignalSource): void;
  (e: "update-dialect", index: number, dialect: "tfql" | "promql"): void;
  (e: "update-legend", index: number, legend: string): void;
  (e: "toggle-query", index: number): void;
  (e: "run-query", index: number): void;
  (e: "run-all"): void;
  (e: "add-query"): void;
  (e: "remove-query", index: number): void;
  (e: "duplicate-query", index: number): void;
  (e: "select-template", index: number, templateId: string): void;
}>();

const enabledCount = computed(() => props.rows.filter((r) => r.enabled).length);
const totalCount = computed(() => props.rows.length);

function toggleCollapse() {
  emit("update:collapsed", !props.collapsed);
}
</script>

<template>
  <div class="query-editor-panel" :class="{ collapsed }">
    <!-- Toggle Bar -->
    <div class="toggle-bar" @click="toggleCollapse">
      <div class="toggle-left">
        <Icon
          :icon="collapsed ? 'carbon:chevron-right' : 'carbon:chevron-down'"
          :width="14"
          class="toggle-icon"
        />
        <span class="toggle-label">
          Queries ({{ enabledCount }}/{{ totalCount }})
        </span>
      </div>

      <div class="toggle-right" @click.stop>
        <n-button
          v-if="!collapsed"
          size="tiny"
          :loading="loading"
          @click="$emit('run-all')"
        >
          <template #icon>
            <Icon icon="carbon:play-filled-alt" :width="12" />
          </template>
          Run All
        </n-button>
      </div>
    </div>

    <!-- Expandable Content -->
    <transition name="slide">
      <div v-show="!collapsed" class="panel-content">
        <div class="rows-container">
          <QueryEditorRow
            v-for="(row, index) in rows"
            :key="row.label"
            :label="row.label"
            :color="row.color"
            :query="row.query"
            :query-type="row.queryType"
            :dialect="row.dialect"
            :legend="row.legend"
            :legend-format="row.legendFormat"
            :series-key="row.seriesKey"
            :enabled="row.enabled"
            :loading="row.loading"
            :error="row.error"
            :template-suggestions="templateSuggestions"
            @update:query="(v) => $emit('update-query', index, v)"
            @update:query-type="(v) => $emit('update-type', index, v)"
            @update:dialect="(v) => $emit('update-dialect', index, v)"
            @update:legend="(v) => $emit('update-legend', index, v)"
            @toggle="$emit('toggle-query', index)"
            @run="$emit('run-query', index)"
            @remove="$emit('remove-query', index)"
            @duplicate="$emit('duplicate-query', index)"
            @select-template="(tid) => $emit('select-template', index, tid)"
          />
        </div>

        <n-button
          block
          dashed
          size="small"
          class="add-query-btn"
          @click="$emit('add-query')"
        >
          <template #icon>
            <Icon icon="carbon:add" :width="14" />
          </template>
          Add Query
        </n-button>
      </div>
    </transition>
  </div>
</template>

<style scoped lang="scss">
.query-editor-panel {
  border-top: 1px solid var(--n-border-color);
  background: var(--n-action-color);
  border-radius: 0 0 8px 8px;
}

.toggle-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  cursor: pointer;
  user-select: none;
  min-height: 36px;

  &:hover {
    background: rgba(128, 128, 128, 0.05);
  }
}

.toggle-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.toggle-icon {
  color: var(--n-text-color-3);
  transition: transform 0.2s ease;
}

.toggle-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--n-text-color-2);
  letter-spacing: 0.3px;
}

.toggle-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-content {
  padding: 8px 12px 12px;
}

.rows-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}

.add-query-btn {
  opacity: 0.7;
  transition: opacity 0.15s ease;

  &:hover {
    opacity: 1;
  }
}

/* Slide transition */
.slide-enter-active,
.slide-leave-active {
  transition:
    max-height 0.3s ease,
    opacity 0.3s ease;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
}

.slide-enter-to,
.slide-leave-from {
  max-height: 600px;
  opacity: 1;
}
</style>

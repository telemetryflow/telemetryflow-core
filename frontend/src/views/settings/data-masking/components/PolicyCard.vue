<template>
  <div class="policy-card" :class="{ disabled: !policy.enabled }">
    <!-- Header: icon + menu -->
    <div class="card-header">
      <div class="card-icon">
        <Icon icon="carbon:policy" />
      </div>
      <n-dropdown trigger="click" :options="menuOptions" @select="handleMenuSelect">
        <n-button text size="small" @click.stop>
          <template #icon><Icon icon="carbon:overflow-menu-vertical" /></template>
        </n-button>
      </n-dropdown>
    </div>

    <!-- Content -->
    <div class="card-content">
      <h3 class="card-title">{{ policy.name }}</h3>
      <p class="card-description">
        {{ policy.description || `${policy.ruleCount} masking rules configured` }}
      </p>
    </div>

    <!-- Meta stats -->
    <div class="card-meta">
      <span class="meta-stat">
        <Icon icon="carbon:ruler" width="13" />
        {{ policy.activeRuleCount }}/{{ policy.ruleCount }} active
      </span>
      <span class="meta-stat">
        <Icon icon="carbon:time" width="13" />
        {{ timeAgo(policy.updatedAt) }}
      </span>
    </div>

    <!-- Tags + toggle -->
    <div class="card-tags">
      <n-tag
        :type="policy.enabled ? 'success' : 'default'"
        size="small"
        :bordered="false"
      >
        {{ policy.enabled ? 'Active' : 'Disabled' }}
      </n-tag>
      <div class="tag-spacer" />
      <n-switch
        v-if="canManage"
        :value="policy.enabled"
        :loading="saving"
        size="small"
        @update:value="$emit('toggle', policy.id, $event)"
        @click.stop
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue';
import { NTag, NSwitch, NButton, NDropdown } from 'naive-ui';
import { Icon } from '@iconify/vue';
import type { MaskingPolicy } from '@/types/data-masking';

const props = defineProps<{
  policy: MaskingPolicy;
  saving: boolean;
  canWrite?: boolean;
  canDelete?: boolean;
  canManage?: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggle', id: string, enabled: boolean): void;
  (e: 'edit', policy: MaskingPolicy): void;
  (e: 'delete', policy: MaskingPolicy): void;
  (e: 'test', policy: MaskingPolicy): void;
}>();

const menuOptions = computed(() => {
  const options: any[] = [];
  if (props.canWrite)  options.push({ label: 'Edit Policy', key: 'edit', icon: () => h(Icon, { icon: 'carbon:edit' }) });
  options.push({ label: 'Test Rules', key: 'test', icon: () => h(Icon, { icon: 'carbon:play' }) });
  if (props.canDelete) {
    options.push({ label: '', key: 'd1', type: 'divider' });
    options.push({ label: 'Delete Policy', key: 'delete', icon: () => h(Icon, { icon: 'carbon:trash-can' }) });
  }
  return options;
});

function handleMenuSelect(key: string) {
  if (key === 'edit')   emit('edit', props.policy);
  else if (key === 'test')   emit('test', props.policy);
  else if (key === 'delete') emit('delete', props.policy);
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
</script>

<style scoped lang="scss">
.policy-card {
  display: flex;
  flex-direction: column;
  background: var(--n-color-modal);
  border: 2px solid rgba(128, 128, 128, 0.3);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover {
    border-color: var(--n-primary-color);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }

  &.disabled {
    opacity: 0.6;
  }
}

// ── Header ───────────────────────────────────────────────────────────────────
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.card-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;

  :deep(svg) {
    width: 20px;
    height: 20px;
    color: white;
    fill: currentColor;
  }
}

// ── Content ──────────────────────────────────────────────────────────────────
.card-content {
  min-height: 72px;
  margin-bottom: 12px;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--n-text-color);
  line-height: 1.4;
}

.card-description {
  font-size: 0.875rem;
  color: var(--n-text-color-3);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2.625rem;
  line-height: 1.5;
}

// ── Meta ─────────────────────────────────────────────────────────────────────
.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: var(--n-text-color-3);
  margin-bottom: 12px;
}

.meta-stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
}

// ── Tags ─────────────────────────────────────────────────────────────────────
.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-height: 28px;
  align-items: center;
}

.tag-spacer {
  flex: 1;
}
</style>

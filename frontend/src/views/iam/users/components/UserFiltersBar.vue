<script setup lang="ts">
import { Icon } from "@iconify/vue";
import type { SelectOption } from "naive-ui";

defineProps<{
  orgOptions: SelectOption[];
  workspaceOptions: SelectOption[];
  tenantOptions: SelectOption[];
}>();

const search = defineModel<string>("search", { default: "" });
const status = defineModel<string | null>("status", { default: null });
const org = defineModel<string | null>("org", { default: null });
const workspace = defineModel<string | null>("workspace", { default: null });
const tenant = defineModel<string | null>("tenant", { default: null });

const statusOptions = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];
</script>

<template>
  <div class="filters-bar">
    <n-input
      v-model:value="search"
      placeholder="Search by name or email..."
      size="small"
      clearable
      class="search-input"
    >
      <template #prefix><Icon icon="carbon:search" /></template>
    </n-input>
    <n-select
      v-model:value="org"
      placeholder="Organization"
      clearable
      size="small"
      :options="orgOptions"
      class="filter-select"
    />
    <n-select
      v-model:value="workspace"
      placeholder="Workspace"
      clearable
      size="small"
      :options="workspaceOptions"
      class="filter-select"
    />
    <n-select
      v-model:value="tenant"
      placeholder="Tenant"
      clearable
      size="small"
      :options="tenantOptions"
      class="filter-select"
    />
    <n-select
      v-model:value="status"
      placeholder="Status"
      clearable
      size="small"
      :options="statusOptions"
      class="filter-select filter-select--sm"
    />
  </div>
</template>

<style scoped lang="scss">
.filters-bar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;

  .search-input {
    flex: 1;
    min-width: 200px;
  }

  .filter-select {
    width: 155px;

    &--sm {
      width: 115px;
    }
  }
}
</style>

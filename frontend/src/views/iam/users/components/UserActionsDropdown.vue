<script setup lang="ts">
import { h } from "vue";
import { Icon } from "@iconify/vue";
import { NButton, NDropdown } from "naive-ui";
import type { DropdownOption } from "naive-ui";
import type { User } from "@/types";

const props = defineProps<{
  user: User;
  canEdit: boolean;
  canDelete: boolean;
}>();

const emit = defineEmits<{
  view: [user: User];
  toggle: [user: User];
  delete: [user: User];
}>();

function getOptions(): DropdownOption[] {
  return [
    {
      label: "View",
      key: "view",
      icon: () => h(Icon, { icon: "carbon:magnify", width: 16, height: 16 }),
    },
    {
      label: props.user.isActive ? "Deactivate" : "Activate",
      key: "toggle",
      icon: () =>
        h(Icon, {
          icon: props.user.isActive ? "carbon:pause" : "carbon:play",
          width: 16,
          height: 16,
        }),
      show: props.canEdit,
    },
    { type: "divider", key: "d1" },
    {
      label: "Delete",
      key: "delete",
      icon: () =>
        h(Icon, {
          icon: "carbon:trash-can",
          width: 16,
          height: 16,
          style: "color:#ef4444",
        }),
      props: { style: "color:#ef4444" },
      show: props.canDelete,
    },
  ].filter((opt) => opt.show !== false);
}

function handleSelect(key: string) {
  switch (key) {
    case "view":
      emit("view", props.user);
      break;
    case "toggle":
      emit("toggle", props.user);
      break;
    case "delete":
      emit("delete", props.user);
      break;
  }
}
</script>

<template>
  <NDropdown :options="getOptions()" trigger="click" @select="handleSelect">
    <NButton size="small" quaternary class="action-menu-btn">
      <template #icon>
        <Icon icon="carbon:overflow-menu-vertical" :width="16" :height="16" />
      </template>
    </NButton>
  </NDropdown>
</template>

<style scoped>
.action-menu-btn {
  opacity: 0.6;
}
.action-menu-btn:hover {
  opacity: 1;
}
</style>

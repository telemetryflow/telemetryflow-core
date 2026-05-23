<script setup lang="ts">
import { h } from "vue";
import { Icon } from "@iconify/vue";
import { NButton, NDropdown } from "naive-ui";
import type { DropdownOption } from "naive-ui";
import type { User } from "@/types";

interface Props {
  user: User;
}

const props = defineProps<Props>();
const emit = defineEmits(["manageRoles", "viewDetails", "edit", "delete"]);

const options: DropdownOption[] = [
  {
    label: "Manage Roles",
    key: "manage",
    icon: () => h(Icon, { icon: "carbon:user-role", width: 16, height: 16 }),
  },
  {
    label: "View Details",
    key: "view",
    icon: () => h(Icon, { icon: "carbon:magnify", width: 16, height: 16 }),
  },
  {
    label: "Edit",
    key: "edit",
    icon: () => h(Icon, { icon: "carbon:edit", width: 16, height: 16 }),
  },
  { type: "divider", key: "d1" },
  {
    label: "Delete",
    key: "delete",
    icon: () => h(Icon, { icon: "carbon:trash-can", width: 16, height: 16 }),
    props: { class: "delete-action" },
  },
];

function handleActionSelect(key: string) {
  switch (key) {
    case "manage":
      emit("manageRoles", props.user);
      break;
    case "view":
      emit("viewDetails", props.user);
      break;
    case "edit":
      emit("edit", props.user);
      break;
    case "delete":
      emit("delete", props.user);
      break;
  }
}
</script>

<template>
  <n-dropdown :options="options" trigger="click" @select="handleActionSelect">
    <n-button size="small" quaternary>
      <template #icon>
        <Icon icon="carbon:overflow-menu-vertical" :width="16" :height="16" />
      </template>
    </n-button>
  </n-dropdown>
</template>

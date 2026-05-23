import { computed, type Ref } from "vue";

/**
 * Composable for line-numbered code editor/viewer
 * Provides line count calculation for displaying line numbers
 *
 * @param content - Reactive reference to the text content
 * @returns lineCount computed property
 */
export function useLineNumberedEditor(content: Ref<string>) {
  const lineCount = computed(() => {
    if (!content.value) return 1;
    return content.value.split("\n").length;
  });

  return {
    lineCount,
  };
}

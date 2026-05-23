import { computed, type Ref } from "vue";
import { formatJsonWithLineNumbers } from "@/utils";

/**
 * Composable for Raw JSON view in detail drawers.
 * Provides formatted JSON lines with syntax highlighting and clipboard copy.
 *
 * @param data - Reactive reference to the data object to display as JSON
 * @returns jsonLines (computed with lineNumbers[] and lines[]) and copyJson function
 */
export function useRawJsonView(data: Ref<unknown | null>) {
  const jsonLines = computed(() => {
    if (!data.value)
      return { lineNumbers: [] as number[], lines: [] as string[] };
    return formatJsonWithLineNumbers(data.value);
  });

  function copyJson() {
    if (!data.value) return;
    const json = JSON.stringify(data.value, null, 2);
    navigator.clipboard.writeText(json);
  }

  return {
    jsonLines,
    copyJson,
  };
}

import { ref, onMounted, onUnmounted } from "vue";

/**
 * Composable for detecting table scroll position
 * Used to show/hide scroll indicators on mobile
 */
export function useTableScroll(tableContainerRef: Ref<HTMLElement | null>) {
  const isScrolledToEnd = ref(false);

  const checkScrollPosition = () => {
    if (!tableContainerRef.value) return;

    const container = tableContainerRef.value.querySelector(
      ".n-data-table-wrapper",
    );
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    // Consider scrolled to end if within 10px of the end
    isScrolledToEnd.value = scrollLeft + clientWidth >= scrollWidth - 10;
  };

  onMounted(() => {
    if (!tableContainerRef.value) return;

    const container = tableContainerRef.value.querySelector(
      ".n-data-table-wrapper",
    );
    if (container) {
      container.addEventListener("scroll", checkScrollPosition);
      // Check initial position
      checkScrollPosition();
    }
  });

  onUnmounted(() => {
    if (!tableContainerRef.value) return;

    const container = tableContainerRef.value.querySelector(
      ".n-data-table-wrapper",
    );
    if (container) {
      container.removeEventListener("scroll", checkScrollPosition);
    }
  });

  return {
    isScrolledToEnd,
  };
}

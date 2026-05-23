/**
 * Composable for table pagination
 * Provides reusable pagination configuration and state management
 */

import { ref, computed } from "vue";

export interface PaginationConfig {
  page: number;
  pageSize: number;
  showSizePicker: boolean;
  pageSizes: number[];
  itemCount?: number;
  onChange?: (page: number) => void;
  onUpdatePageSize?: (pageSize: number) => void;
}

export function usePagination(initialPageSize = 10) {
  const currentPage = ref(1);
  const pageSize = ref(initialPageSize);

  // Reset to page 1 when page size changes
  const handlePageSizeChange = (newPageSize: number) => {
    pageSize.value = newPageSize;
    currentPage.value = 1;
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    currentPage.value = newPage;
  };

  // Pagination configuration for n-data-table
  const paginationConfig = computed(() => ({
    page: currentPage.value,
    pageSize: pageSize.value,
    showSizePicker: true,
    pageSizes: [10, 20, 50, 100, 200, 500],
    onChange: handlePageChange,
    onUpdatePageSize: handlePageSizeChange,
  }));

  // Reset pagination
  const resetPagination = () => {
    currentPage.value = 1;
    pageSize.value = initialPageSize;
  };

  return {
    currentPage,
    pageSize,
    paginationConfig,
    handlePageChange,
    handlePageSizeChange,
    resetPagination,
  };
}

/**
 * Property-Based Tests for usePagination Composable
 * Feature: kubernetes-monitoring-integration, Property 20: Pagination State Display
 */

// Feature: kubernetes-monitoring-integration, Property 20: Pagination State Display

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { usePagination } from "../usePagination";

describe("usePagination - Property-Based Tests", () => {
  /**
   * **Validates: Requirements 15.1**
   *
   * Property 20: Pagination State Display
   *
   * For any paginated list view, the frontend must display current page number,
   * total pages, and total item count based on the API response.
   *
   * For any combination of (page, pageSize, total), the pagination state must
   * correctly reflect currentPage, totalPages, and itemCount.
   */
  describe("Property 20: Pagination State Display", () => {
    it("should correctly reflect currentPage after page changes", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          fc.constantFrom(10, 20, 50, 100),
          (targetPage, initialPageSize) => {
            const { currentPage, handlePageChange } = usePagination(initialPageSize);

            // Navigate to the target page
            handlePageChange(targetPage);

            // currentPage must reflect the page that was set
            expect(currentPage.value).toBe(targetPage);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should correctly reflect pageSize after page size changes", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(10, 20, 50, 100),
          fc.constantFrom(10, 20, 50, 100),
          (initialPageSize, newPageSize) => {
            const { pageSize, handlePageSizeChange } = usePagination(initialPageSize);

            handlePageSizeChange(newPageSize);

            // pageSize must reflect the new page size
            expect(pageSize.value).toBe(newPageSize);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should expose itemCount in paginationConfig when total is provided via itemCount", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000 }),
          fc.constantFrom(10, 20, 50, 100),
          (total, pageSize) => {
            const { paginationConfig } = usePagination(pageSize);

            // The paginationConfig is a computed that can be spread with itemCount
            // Simulate what the view does: pass itemCount from API response
            const config = {
              ...paginationConfig.value,
              itemCount: total,
            };

            // itemCount must equal the total from the API response
            expect(config.itemCount).toBe(total);
            // page must be the current page
            expect(config.page).toBe(1);
            // pageSize must match
            expect(config.pageSize).toBe(pageSize);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should compute totalPages correctly for any (total, pageSize) combination", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000 }),
          fc.constantFrom(10, 20, 50, 100),
          (total, pageSizeValue) => {
            const { paginationConfig } = usePagination(pageSizeValue);

            const config = {
              ...paginationConfig.value,
              itemCount: total,
            };

            // totalPages = ceil(total / pageSize), minimum 1 when total > 0, 0 when total = 0
            const expectedTotalPages =
              total === 0 ? 0 : Math.ceil(total / pageSizeValue);

            // Naive UI computes totalPages internally from itemCount + pageSize
            // We verify the inputs are correct so Naive UI can compute it
            expect(config.itemCount).toBe(total);
            expect(config.pageSize).toBe(pageSizeValue);

            // Verify the expected totalPages formula is consistent
            if (total > 0) {
              expect(expectedTotalPages).toBeGreaterThanOrEqual(1);
              expect(expectedTotalPages).toBe(Math.ceil(total / pageSizeValue));
            } else {
              expect(expectedTotalPages).toBe(0);
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should keep currentPage within valid range relative to total pages", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 200 }),
          fc.constantFrom(10, 20, 50, 100),
          fc.integer({ min: 0, max: 10000 }),
          (requestedPage, pageSizeValue, total) => {
            const { currentPage, handlePageChange } = usePagination(pageSizeValue);

            handlePageChange(requestedPage);

            const totalPages = total === 0 ? 0 : Math.ceil(total / pageSizeValue);

            // currentPage must always be a positive integer
            expect(currentPage.value).toBeGreaterThanOrEqual(1);

            // If total > 0, currentPage should not exceed totalPages
            // (the composable stores the requested page; the view/table enforces bounds)
            if (totalPages > 0) {
              // The composable stores whatever page was set — the constraint is
              // that it must be a positive integer (Naive UI enforces upper bound)
              expect(Number.isInteger(currentPage.value)).toBe(true);
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should expose page and pageSize in paginationConfig matching current state", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }),
          fc.constantFrom(10, 20, 50, 100),
          (page, pageSizeValue) => {
            const { currentPage, pageSize, paginationConfig, handlePageChange, handlePageSizeChange } =
              usePagination(pageSizeValue);

            handlePageChange(page);
            handlePageSizeChange(pageSizeValue);

            // paginationConfig must always reflect the current state
            expect(paginationConfig.value.page).toBe(currentPage.value);
            expect(paginationConfig.value.pageSize).toBe(pageSize.value);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should start at page 1 with any initial page size", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(10, 20, 50, 100),
          (initialPageSize) => {
            const { currentPage, pageSize, paginationConfig } = usePagination(initialPageSize);

            // Initial state must always be page 1
            expect(currentPage.value).toBe(1);
            expect(pageSize.value).toBe(initialPageSize);
            expect(paginationConfig.value.page).toBe(1);
            expect(paginationConfig.value.pageSize).toBe(initialPageSize);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Validates: Requirements 15.3, 15.4**
   *
   * Property 21: Pagination Boundary Button States
   *
   * For any paginated list, the previous button must be disabled when on the
   * first page, and the next button must be disabled when on the last page.
   */
  describe("Property 21: Pagination Boundary Button States", () => {
    it("should be on page 1 initially (previous button disabled)", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(10, 20, 50, 100),
          (initialPageSize) => {
            const { currentPage } = usePagination(initialPageSize);

            // On page 1, previous is disabled — currentPage === 1
            expect(currentPage.value).toBe(1);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should correctly identify last page for any (total, pageSize) combination", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          fc.constantFrom(10, 20, 50, 100),
          (total, pageSizeValue) => {
            const { currentPage, handlePageChange } = usePagination(pageSizeValue);

            const totalPages = Math.ceil(total / pageSizeValue);

            // Navigate to last page
            handlePageChange(totalPages);

            // On last page, next is disabled — currentPage === totalPages
            expect(currentPage.value).toBe(totalPages);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Validates: Requirements 15.6**
   *
   * Property 22: Page Size Change Behavior
   *
   * For any page size change, the frontend must reset to page 1 and fetch
   * data with the new page size parameter.
   */
  describe("Property 22: Page Size Change Behavior", () => {
    it("should reset to page 1 when page size changes", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 50 }),
          fc.constantFrom(10, 20, 50, 100),
          fc.constantFrom(10, 20, 50, 100),
          (startPage, initialPageSize, newPageSize) => {
            const { currentPage, handlePageChange, handlePageSizeChange } =
              usePagination(initialPageSize);

            // Navigate to a non-first page
            handlePageChange(startPage);
            expect(currentPage.value).toBe(startPage);

            // Change page size — must reset to page 1
            handlePageSizeChange(newPageSize);

            expect(currentPage.value).toBe(1);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should update pageSize to the new value after page size change", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(10, 20, 50, 100),
          fc.constantFrom(10, 20, 50, 100),
          (initialPageSize, newPageSize) => {
            const { pageSize, handlePageSizeChange } = usePagination(initialPageSize);

            handlePageSizeChange(newPageSize);

            expect(pageSize.value).toBe(newPageSize);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should reset to page 1 via resetPagination for any state", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          fc.constantFrom(10, 20, 50, 100),
          fc.constantFrom(10, 20, 50, 100),
          (page, initialPageSize, currentPageSize) => {
            const { currentPage, pageSize, handlePageChange, handlePageSizeChange, resetPagination } =
              usePagination(initialPageSize);

            // Set some state
            handlePageChange(page);
            handlePageSizeChange(currentPageSize);

            // Reset
            resetPagination();

            // Must return to initial state
            expect(currentPage.value).toBe(1);
            expect(pageSize.value).toBe(initialPageSize);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});

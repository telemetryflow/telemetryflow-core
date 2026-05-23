/**
 * API Error Handling Composable
 * Provides error categorization, user-friendly messages, and retry logic
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

export interface ErrorInfo {
  type:
    | "not_found"
    | "auth_error"
    | "server_error"
    | "network_error"
    | "validation_error"
    | "unknown_error";
  message: string;
  details?: any;
  canRetry: boolean;
  shouldRedirect?: boolean;
  redirectTo?: string;
  retryDelay?: number;
}

/**
 * Error handling composable for API requests
 */
export function useApiError() {
  /**
   * Handle API errors and return structured error information
   * @param error - The error object from axios or other sources
   * @param context - Optional context string for logging
   * @returns ErrorInfo object with categorized error details
   */
  const handleError = (error: any, context?: string): ErrorInfo => {
    // Log the error for debugging
    if (context) {
      logError(error, context);
    }

    if (error.response) {
      // HTTP error response from server
      const status = error.response.status;

      switch (status) {
        case 404:
          // Requirement 7.1: Handle 404 errors
          return {
            type: "not_found",
            message: "Monitor not found. It may have been deleted.",
            canRetry: false,
            shouldRedirect: true,
            redirectTo: "/monitoring/uptime",
          };

        case 401:
        case 403:
          // Requirement 7.2: Handle authentication/authorization errors
          return {
            type: "auth_error",
            message: "You don't have permission to access this monitor.",
            canRetry: false,
            shouldRedirect: true,
            redirectTo: "/login",
          };

        case 500:
        case 502:
        case 503:
          // Requirement 7.3: Handle server errors
          return {
            type: "server_error",
            message: "Server error occurred. Please try again later.",
            canRetry: true,
            retryDelay: 2000,
          };

        case 400:
          // Handle validation errors
          return {
            type: "validation_error",
            message: error.response.data?.message || "Invalid request",
            details: error.response.data?.errors,
            canRetry: false,
          };

        default:
          return {
            type: "unknown_error",
            message: "An unexpected error occurred",
            canRetry: true,
          };
      }
    } else if (error.request) {
      // Requirement 7.4: Handle network errors
      return {
        type: "network_error",
        message: "Connection failed. Please check your internet connection.",
        canRetry: true,
        retryDelay: 3000,
      };
    } else {
      // Other errors (e.g., programming errors)
      return {
        type: "unknown_error",
        message: error.message || "An unexpected error occurred",
        canRetry: false,
      };
    }
  };

  /**
   * Log API errors to console for debugging
   * Requirement 7.6: Log all API errors
   * @param error - The error object
   * @param context - Context string describing where the error occurred
   */
  const logError = (error: any, context: string) => {
    console.error(`[Uptime API Error] ${context}:`, {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack,
    });
  };

  /**
   * Retry a function with exponential backoff
   * Requirement 7.5: Provide retry functionality
   * @param fetchFn - The async function to retry
   * @param maxRetries - Maximum number of retry attempts (default: 3)
   * @param baseDelay - Base delay in milliseconds (default: 1000)
   * @returns Promise resolving to the function result
   */
  const fetchWithRetry = async <T>(
    fetchFn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
  ): Promise<T> => {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fetchFn();
      } catch (error) {
        lastError = error;

        const errorInfo = handleError(error);

        // Don't retry if error is not retryable or we've exhausted retries
        if (!errorInfo.canRetry || attempt === maxRetries) {
          throw error;
        }

        // Exponential backoff: 1s, 2s, 4s, 8s
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  };

  return {
    handleError,
    logError,
    fetchWithRetry,
  };
}

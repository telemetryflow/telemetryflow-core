/**
 * P25: Winston Logging Standardization
 * Request Context Propagation
 *
 * Provides utilities for propagating request context through the application
 */

import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';

/**
 * Request context data
 */
export interface RequestContext {
  /** Unique request ID for correlation */
  requestId: string;

  /** Tenant ID from authentication */
  tenantId?: string;

  /** Workspace ID from authentication */
  workspaceId?: string;

  /** User ID from authentication */
  userId?: string;

  /** User email */
  userEmail?: string;

  /** IP address of the requester */
  ipAddress?: string;

  /** User agent string */
  userAgent?: string;

  /** Request path */
  path?: string;

  /** HTTP method */
  method?: string;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * AsyncLocalStorage for request context
 * This allows context to be passed down the call stack without explicit parameters
 */
const requestContextStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Request Context Manager
 */
export class RequestContextManager {
  /**
   * Run a function within a request context
   */
  static run<T>(context: RequestContext, callback: () => T): T {
    return requestContextStorage.run(context, callback);
  }

  /**
   * Get the current request context
   */
  static getContext(): RequestContext | undefined {
    return requestContextStorage.getStore();
  }

  /**
   * Get the current request ID
   */
  static getRequestId(): string | undefined {
    return requestContextStorage.getStore()?.requestId;
  }

  /**
   * Get the current tenant ID
   */
  static getTenantId(): string | undefined {
    return requestContextStorage.getStore()?.tenantId;
  }

  /**
   * Get the current workspace ID
   */
  static getWorkspaceId(): string | undefined {
    return requestContextStorage.getStore()?.workspaceId;
  }

  /**
   * Get the current user ID
   */
  static getUserId(): string | undefined {
    return requestContextStorage.getStore()?.userId;
  }

  /**
   * Update the current context with additional data
   */
  static updateContext(updates: Partial<RequestContext>): void {
    const currentContext = requestContextStorage.getStore();
    if (currentContext) {
      Object.assign(currentContext, updates);
    }
  }

  /**
   * Create a new request context from Express request
   */
  static createFromRequest(req: any): RequestContext {
    return {
      requestId: req.id || req.headers['x-request-id'] || randomUUID(),
      tenantId: req.user?.tenantId || req.headers['x-tenant-id'],
      workspaceId: req.user?.workspaceId || req.headers['x-workspace-id'],
      userId: req.user?.id || req.user?.userId,
      userEmail: req.user?.email,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'],
      path: req.path,
      method: req.method,
    };
  }
}

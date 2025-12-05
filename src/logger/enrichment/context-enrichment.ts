/**
 * P25: Winston Logging Standardization
 * Context Enrichment Utilities
 *
 * Provides utilities for enriching logs with tenant, user, and request context
 */

import { LogMetadata } from '../interfaces/logger-config.interface';
import { RequestContextManager } from '../context/request-context';

/**
 * Tenant context for multi-tenancy
 */
export interface TenantContext {
  tenantId?: string;
  workspaceId?: string;
  organizationId?: string;
}

/**
 * User context for audit and authentication
 */
export interface UserContext {
  userId?: string;
  userEmail?: string;
  userName?: string;
  userRoles?: string[];
}

/**
 * Enrichment utilities for log metadata
 */
export class LogEnrichment {
  /**
   * Enrich metadata with current request context
   */
  static withRequestContext(metadata?: LogMetadata): LogMetadata {
    const context = RequestContextManager.getContext();

    return {
      ...metadata,
      requestId: context?.requestId,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      path: context?.path,
      method: context?.method,
    };
  }

  /**
   * Enrich metadata with tenant context
   */
  static withTenantContext(
    tenantContext: TenantContext,
    metadata?: LogMetadata,
  ): LogMetadata {
    return {
      ...metadata,
      tenantId: tenantContext.tenantId,
      workspaceId: tenantContext.workspaceId,
      organizationId: tenantContext.organizationId,
    };
  }

  /**
   * Enrich metadata with user context
   */
  static withUserContext(
    userContext: UserContext,
    metadata?: LogMetadata,
  ): LogMetadata {
    return {
      ...metadata,
      userId: userContext.userId,
      userEmail: userContext.userEmail,
      userName: userContext.userName,
      userRoles: userContext.userRoles,
    };
  }

  /**
   * Enrich metadata with all available context
   */
  static withFullContext(
    tenantContext?: TenantContext,
    userContext?: UserContext,
    metadata?: LogMetadata,
  ): LogMetadata {
    let enriched = LogEnrichment.withRequestContext(metadata);

    if (tenantContext) {
      enriched = LogEnrichment.withTenantContext(tenantContext, enriched);
    }

    if (userContext) {
      enriched = LogEnrichment.withUserContext(userContext, enriched);
    }

    return enriched;
  }

  /**
   * Extract tenant context from request
   */
  static getTenantContextFromRequest(): TenantContext | undefined {
    const context = RequestContextManager.getContext();
    if (!context) return undefined;

    return {
      tenantId: context.tenantId,
      workspaceId: context.workspaceId,
    };
  }

  /**
   * Extract user context from request
   */
  static getUserContextFromRequest(): UserContext | undefined {
    const context = RequestContextManager.getContext();
    if (!context) return undefined;

    return {
      userId: context.userId,
      userEmail: context.userEmail,
    };
  }
}

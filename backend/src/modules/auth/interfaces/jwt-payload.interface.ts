/**
 * JWT Payload Interface
 * Defines the structure of data stored in JWT tokens
 */
export interface JwtPayload {
  /** User ID (subject) */
  sub: string;
  /** User email */
  email: string;
  /** User's role names */
  roles: string[];
  /** User's permission names */
  permissions: string[];
  /** Tenant ID for multi-tenancy */
  tenantId: string | null;
  /** Organization ID */
  organizationId: string | null;
  /** Session ID for session tracking */
  sessionId?: string;
  /** Token issued at (Unix timestamp) */
  iat?: number;
  /** Token expiration (Unix timestamp) */
  exp?: number;
}

/**
 * Authenticated user attached to request
 */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
  tenantId: string | null;
  organizationId: string | null;
  sessionId?: string;
}

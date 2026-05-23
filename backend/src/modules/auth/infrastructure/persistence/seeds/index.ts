/**
 * Auth Module Seeds Index
 *
 * Auth module typically doesn't need seeds in production.
 * Seeds here are for development/testing purposes only.
 */

import type { PostgresSeed } from '../../../../../database/shared/interfaces';

/**
 * All Auth module seeds (empty for production)
 */
export const AuthSeeds: (new () => PostgresSeed)[] = [];

/**
 * Auth Module seed configuration
 */
export const AuthSeedConfig = {
  moduleName: 'auth',
  database: 'postgres' as const,
  seeds: AuthSeeds,
};

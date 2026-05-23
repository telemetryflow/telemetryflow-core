/**
 * LLMProvider Repository Interface
 * Defines the contract for LLM provider persistence
 */

import { LLMProvider } from "../aggregates/LLMProvider";

export const LLM_PROVIDER_REPOSITORY = Symbol("LLM_PROVIDER_REPOSITORY");

export interface FindLLMProvidersOptions {
  page?: number;
  pageSize?: number;
  providerType?: string;
  isActive?: boolean;
  search?: string;
}

export interface FindLLMProvidersResult {
  items: LLMProvider[];
  total: number;
}

export interface ILLMProviderRepository {
  /**
   * Find a provider by its ID
   */
  findById(id: string): Promise<LLMProvider | null>;

  /**
   * Find providers by organization with optional filtering
   */
  findByOrganization(
    organizationId: string,
    options?: FindLLMProvidersOptions,
  ): Promise<FindLLMProvidersResult>;

  /**
   * Find the default provider for an organization
   */
  findDefaultByOrganization(
    organizationId: string,
  ): Promise<LLMProvider | null>;

  /**
   * Find a provider by name within an organization
   */
  findByName(organizationId: string, name: string): Promise<LLMProvider | null>;

  /**
   * Save a provider (create or update)
   */
  save(provider: LLMProvider): Promise<void>;

  /**
   * Delete a provider by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Check if a provider name exists in an organization
   */
  existsByName(
    organizationId: string,
    name: string,
    excludeId?: string,
  ): Promise<boolean>;

  /**
   * Clear the default flag for all providers in an organization
   * except the one specified by excludeId
   */
  clearDefaultForOrganization(
    organizationId: string,
    excludeId?: string,
  ): Promise<void>;

  /**
   * Count providers by organization
   */
  countByOrganization(organizationId: string): Promise<number>;
}

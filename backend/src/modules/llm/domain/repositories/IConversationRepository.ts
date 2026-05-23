/**
 * Conversation Repository Interface
 * Defines the contract for conversation persistence
 */

import { Conversation, ContextType } from "../aggregates/Conversation";

export const CONVERSATION_REPOSITORY = Symbol("CONVERSATION_REPOSITORY");

export interface FindConversationsOptions {
  page?: number;
  pageSize?: number;
  contextType?: ContextType;
  isArchived?: boolean;
  search?: string;
}

export interface FindConversationsResult {
  items: Conversation[];
  total: number;
}

export interface IConversationRepository {
  /**
   * Find a conversation by its ID
   */
  findById(id: string): Promise<Conversation | null>;

  /**
   * Find a conversation by ID with messages loaded
   */
  findByIdWithMessages(id: string): Promise<Conversation | null>;

  /**
   * Find conversations by user with optional filtering
   */
  findByUser(
    organizationId: string,
    userId: string,
    options?: FindConversationsOptions,
  ): Promise<FindConversationsResult>;

  /**
   * Find conversations by context
   */
  findByContext(
    organizationId: string,
    contextType: ContextType,
    contextId?: string,
  ): Promise<Conversation[]>;

  /**
   * Save a conversation (create or update)
   */
  save(conversation: Conversation): Promise<void>;

  /**
   * Delete a conversation by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Count conversations by user
   */
  countByUser(organizationId: string, userId: string): Promise<number>;

  /**
   * Get total tokens used by user in a time period
   */
  getTotalTokensUsed(
    organizationId: string,
    userId: string,
    since?: Date,
  ): Promise<number>;
}

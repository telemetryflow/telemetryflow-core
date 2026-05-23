/**
 * Conversation Repository Implementation
 */

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  IConversationRepository,
  FindConversationsOptions,
  FindConversationsResult,
} from "../../domain/repositories/IConversationRepository";
import {
  Conversation,
  ContextType,
} from "../../domain/aggregates/Conversation";
import { Message } from "../../domain/entities/Message";
import { ConversationId, MessageId } from "../../domain/value-objects";
import { ConversationEntity } from "../entities/Conversation.entity";
import { MessageEntity } from "../entities/Message.entity";

@Injectable()
export class ConversationRepository implements IConversationRepository {
  constructor(
    @InjectRepository(ConversationEntity)
    private readonly conversationRepo: Repository<ConversationEntity>,
    @InjectRepository(MessageEntity)
    private readonly messageRepo: Repository<MessageEntity>,
  ) {}

  async findById(id: string): Promise<Conversation | null> {
    const entity = await this.conversationRepo.findOne({ where: { id } });
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async findByIdWithMessages(id: string): Promise<Conversation | null> {
    const entity = await this.conversationRepo.findOne({
      where: { id },
      relations: ["messages"],
      order: { messages: { createdAt: "ASC" } },
    });
    if (!entity) return null;
    return this.toDomain(entity, entity.messages);
  }

  async findByUser(
    organizationId: string,
    userId: string,
    options: FindConversationsOptions = {},
  ): Promise<FindConversationsResult> {
    const {
      page = 1,
      pageSize = 20,
      contextType,
      isArchived,
      search,
    } = options;

    const queryBuilder = this.conversationRepo
      .createQueryBuilder("conv")
      .where("conv.organization_id = :organizationId", { organizationId })
      .andWhere("conv.user_id = :userId", { userId });

    if (contextType) {
      queryBuilder.andWhere("conv.context_type = :contextType", {
        contextType,
      });
    }

    if (isArchived !== undefined) {
      queryBuilder.andWhere("conv.is_archived = :isArchived", { isArchived });
    }

    if (search) {
      queryBuilder.andWhere("conv.title ILIKE :search", {
        search: `%${search}%`,
      });
    }

    queryBuilder.orderBy("conv.last_message_at", "DESC", "NULLS LAST");

    const total = await queryBuilder.getCount();

    queryBuilder.skip((page - 1) * pageSize).take(pageSize);

    const entities = await queryBuilder.getMany();

    return {
      items: entities.map((e) => this.toDomain(e)),
      total,
    };
  }

  async findByContext(
    organizationId: string,
    contextType: ContextType,
    contextId?: string,
  ): Promise<Conversation[]> {
    const queryBuilder = this.conversationRepo
      .createQueryBuilder("conv")
      .where("conv.organization_id = :organizationId", { organizationId })
      .andWhere("conv.context_type = :contextType", { contextType });

    if (contextId) {
      queryBuilder.andWhere("conv.context_id = :contextId", { contextId });
    }

    queryBuilder.orderBy("conv.created_at", "DESC");

    const entities = await queryBuilder.getMany();
    return entities.map((e) => this.toDomain(e));
  }

  async save(conversation: Conversation): Promise<void> {
    const entity = this.toEntity(conversation);
    await this.conversationRepo.save(entity);

    // Save messages
    const messages = conversation.getMessages();
    if (messages.length > 0) {
      const messageEntities = messages.map((m) => this.toMessageEntity(m));
      await this.messageRepo.save(messageEntities);
    }
  }

  async delete(id: string): Promise<void> {
    // Messages will be cascade deleted
    await this.conversationRepo.delete(id);
  }

  async countByUser(organizationId: string, userId: string): Promise<number> {
    return this.conversationRepo.count({
      where: { organizationId, userId },
    });
  }

  async getTotalTokensUsed(
    organizationId: string,
    userId: string,
    since?: Date,
  ): Promise<number> {
    const queryBuilder = this.conversationRepo
      .createQueryBuilder("conv")
      .select("SUM(conv.total_tokens_used)", "total")
      .where("conv.organization_id = :organizationId", { organizationId })
      .andWhere("conv.user_id = :userId", { userId });

    if (since) {
      queryBuilder.andWhere("conv.created_at >= :since", { since });
    }

    const result = await queryBuilder.getRawOne();
    return Number(result?.total || 0);
  }

  private toDomain(
    entity: ConversationEntity,
    messageEntities?: MessageEntity[],
  ): Conversation {
    const conversation = Conversation.reconstitute({
      id: ConversationId.create(entity.id),
      organizationId: entity.organizationId,
      userId: entity.userId,
      providerId: entity.providerId,
      title: entity.title || undefined,
      contextType: entity.contextType as ContextType,
      contextId: entity.contextId || undefined,
      metadata: entity.metadata || undefined,
      messages: [],
      messageCount: entity.messageCount,
      totalTokensUsed: Number(entity.totalTokensUsed),
      lastMessageAt: entity.lastMessageAt || undefined,
      isArchived: entity.isArchived,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });

    if (messageEntities && messageEntities.length > 0) {
      const messages = messageEntities.map((m) => this.toMessageDomain(m));
      conversation.setMessages(messages);
    }

    return conversation;
  }

  private toEntity(conversation: Conversation): ConversationEntity {
    const entity = new ConversationEntity();
    entity.id = conversation.getId();
    entity.organizationId = conversation.getOrganizationId();
    entity.userId = conversation.getUserId();
    entity.providerId = conversation.getProviderId();
    entity.title = conversation.getTitle() || null;
    entity.contextType = conversation.getContextType();
    entity.contextId = conversation.getContextId() || null;
    entity.metadata = conversation.getMetadata() || null;
    entity.messageCount = conversation.getMessageCount();
    entity.totalTokensUsed = conversation.getTotalTokensUsed();
    entity.lastMessageAt = conversation.getLastMessageAt() || null;
    entity.isArchived = conversation.isArchived();
    entity.createdAt = conversation.getCreatedAt();
    entity.updatedAt = conversation.getUpdatedAt();
    return entity;
  }

  private toMessageDomain(entity: MessageEntity): Message {
    return Message.reconstitute({
      id: MessageId.create(entity.id),
      conversationId: entity.conversationId,
      role: entity.role as "system" | "user" | "assistant",
      content: entity.content,
      tokensUsed: entity.tokensUsed || undefined,
      modelId: entity.modelId || undefined,
      latencyMs: entity.latencyMs || undefined,
      metadata: entity.metadata || undefined,
      createdAt: entity.createdAt,
    });
  }

  private toMessageEntity(message: Message): MessageEntity {
    const entity = new MessageEntity();
    entity.id = message.getId();
    entity.conversationId = message.getConversationId();
    entity.role = message.getRole();
    entity.content = message.getContent();
    entity.tokensUsed = message.getTokensUsed() || null;
    entity.modelId = message.getModelId() || null;
    entity.latencyMs = message.getLatencyMs() || null;
    entity.metadata = message.getMetadata() || null;
    entity.createdAt = message.getCreatedAt();
    return entity;
  }
}

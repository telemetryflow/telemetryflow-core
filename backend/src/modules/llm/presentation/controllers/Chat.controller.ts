/**
 * Chat Controller
 * Handles chat interactions with LLM providers
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  BadRequestException,
  NotFoundException,
  Res,
} from "@nestjs/common";
import { Response } from "express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../auth/guards/permissions.guard";
import { RequirePermissions } from "../../../auth/decorators/permissions.decorator";
import { LLMRateLimiterGuard, LLMRateLimit } from "../../infrastructure/guards";
import type { AuthenticatedUser } from "../../../auth/interfaces/jwt-payload.interface";
import { SendMessageRequestDto, ListConversationsQueryDto } from "../dto";
import { LLMProviderRepository } from "../../infrastructure/repositories/LLMProvider.repository";
import { ConversationRepository } from "../../infrastructure/repositories/Conversation.repository";
import { LLMEncryptionService } from "../../application/services/EncryptionService";
import { PromptBuilderService } from "../../application/services/PromptBuilder.service";
import { ContextCollectorService } from "../../application/services/ContextCollector.service";
import { LLMAdapterFactory } from "../../infrastructure/providers/LLMAdapterFactory";
import {
  Conversation,
  ContextType,
} from "../../domain/aggregates/Conversation";
import { Message } from "../../domain/entities/Message";
import { ConversationId, MessageId } from "../../domain/value-objects";
import type { ChatMessage } from "../../infrastructure/providers/ILLMAdapter";

@ApiTags("llm-chat")
@ApiBearerAuth()
@Controller("llm/chat")
@UseGuards(JwtAuthGuard, PermissionsGuard, LLMRateLimiterGuard)
export class ChatController {
  constructor(
    private readonly providerRepo: LLMProviderRepository,
    private readonly conversationRepo: ConversationRepository,
    private readonly encryptionService: LLMEncryptionService,
    private readonly promptBuilder: PromptBuilderService,
    private readonly contextCollector: ContextCollectorService,
    private readonly adapterFactory: LLMAdapterFactory,
  ) {}

  @Post("message")
  @RequirePermissions("llm:chat")
  @ApiOperation({
    summary: "Send chat message",
    description: "Send a message to the LLM and receive a response",
  })
  @ApiBody({ type: SendMessageRequestDto })
  @ApiResponse({ status: 200, description: "Message response" })
  @ApiResponse({ status: 400, description: "Invalid request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async sendMessage(
    @Request() req: { user: AuthenticatedUser },
    @Body() dto: SendMessageRequestDto,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }

    // Get provider (specified or default)
    const provider = dto.providerId
      ? await this.providerRepo.findById(dto.providerId)
      : await this.providerRepo.findDefaultByOrganization(
          req.user.organizationId,
        );

    if (!provider) {
      throw new BadRequestException(
        dto.providerId
          ? "LLM provider not found"
          : "No default LLM provider configured. Please configure one in Settings > AI Assistant.",
      );
    }

    if (provider.getOrganizationId() !== req.user.organizationId) {
      throw new NotFoundException("LLM provider not found");
    }

    if (!provider.isActive()) {
      throw new BadRequestException("LLM provider is not active");
    }

    // Get or create conversation
    let conversation: Conversation;
    if (dto.conversationId) {
      const existing = await this.conversationRepo.findByIdWithMessages(
        dto.conversationId,
      );
      if (
        !existing ||
        existing.getOrganizationId() !== req.user.organizationId
      ) {
        throw new NotFoundException("Conversation not found");
      }
      conversation = existing;
    } else {
      conversation = Conversation.create({
        organizationId: req.user.organizationId,
        userId: req.user.userId,
        providerId: provider.getId(),
        contextType: dto.contextType,
        contextId: dto.contextId,
        metadata: dto.metadata,
      });
    }

    // Add user message to conversation
    conversation.addMessage("user", dto.message);

    // Resolve time range — use DTO values if provided, else last 1 hour
    const now = new Date();
    const timeRange = {
      from: dto.timeFrom
        ? new Date(dto.timeFrom)
        : new Date(now.getTime() - 60 * 60 * 1000),
      to: dto.timeTo ? new Date(dto.timeTo) : now,
    };

    // Collect telemetry context from ClickHouse materialized views + PostgreSQL
    const telemetryCtx = await this.contextCollector.collectContext({
      organizationId: req.user.organizationId,
      userId: req.user.userId,
      contextType: dto.contextType,
      contextId: dto.contextId,
      timeRange,
    });

    // Build system prompt — ALWAYS include context so the LLM can accurately
    // report what data is (or isn't) available instead of asking the user for it
    const systemPrompt =
      this.promptBuilder.buildSystemPrompt(dto.contextType) +
      "\n\n" +
      this.promptBuilder.buildContextPrompt(telemetryCtx);

    const chatMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...conversation.getMessages().map((m) => ({
        role: m.getRole(),
        content: m.getContent(),
      })),
    ];

    // Attach file data to the last user message so the model can see them
    if (dto.attachments?.length) {
      const lastMsg = chatMessages[chatMessages.length - 1];
      if (lastMsg?.role === "user") {
        lastMsg.attachments = dto.attachments;
      }
    }

    // Get adapter and send request
    const adapter = this.adapterFactory.getAdapter(
      provider.getProviderType().toString(),
      provider.getBaseUrl(),
    );
    const apiKey = this.encryptionService.decrypt(
      provider.getEncryptedApiKey().getValue(),
    );
    const modelConfig = provider.getModelConfig();

    const startTime = Date.now();
    const result = await adapter.chat(apiKey, {
      model: provider.getModelId(),
      messages: chatMessages,
      temperature: modelConfig.getTemperature(),
      maxTokens: modelConfig.getMaxTokens(),
      topP: modelConfig.getTopP(),
      samplingMode: modelConfig.getSamplingMode(),
    });
    const latencyMs = Date.now() - startTime;

    // Add assistant message
    const assistantMessage = conversation.addMessage(
      "assistant",
      result.content,
      {
        tokensUsed: result.tokensUsed.total,
        modelId: provider.getModelId(),
        latencyMs,
      },
    );

    // Update conversation title if first message
    if (conversation.getMessageCount() === 2) {
      const title =
        dto.message.substring(0, 100) + (dto.message.length > 100 ? "..." : "");
      conversation.updateTitle(title);
    }

    // Save conversation and update provider usage
    await this.conversationRepo.save(conversation);
    provider.recordUsage();
    await this.providerRepo.save(provider);

    return {
      conversationId: conversation.getId(),
      message: {
        id: assistantMessage.getId(),
        role: assistantMessage.getRole(),
        content: assistantMessage.getContent(),
        tokensUsed: assistantMessage.getTokensUsed(),
        modelId: assistantMessage.getModelId(),
        latencyMs: assistantMessage.getLatencyMs(),
        createdAt: assistantMessage.getCreatedAt(),
      },
      tokensUsed: result.tokensUsed,
    };
  }

  @Post("stream")
  @RequirePermissions("llm:chat")
  @ApiOperation({
    summary: "Send chat message (streaming)",
    description: "Send a message and receive streaming response via SSE",
  })
  @ApiBody({ type: SendMessageRequestDto })
  @ApiResponse({ status: 200, description: "SSE stream" })
  async sendMessageStream(
    @Request() req: { user: AuthenticatedUser },
    @Body() dto: SendMessageRequestDto,
    @Res() res: Response,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }

    // Get provider
    const provider = dto.providerId
      ? await this.providerRepo.findById(dto.providerId)
      : await this.providerRepo.findDefaultByOrganization(
          req.user.organizationId,
        );

    if (!provider) {
      throw new BadRequestException(
        dto.providerId
          ? "LLM provider not found"
          : "No default LLM provider configured",
      );
    }

    if (provider.getOrganizationId() !== req.user.organizationId) {
      throw new NotFoundException("LLM provider not found");
    }

    if (!provider.isActive()) {
      throw new BadRequestException("LLM provider is not active");
    }

    // Get or create conversation
    let conversation: Conversation;
    if (dto.conversationId) {
      const existing = await this.conversationRepo.findByIdWithMessages(
        dto.conversationId,
      );
      if (
        !existing ||
        existing.getOrganizationId() !== req.user.organizationId
      ) {
        throw new NotFoundException("Conversation not found");
      }
      conversation = existing;
    } else {
      conversation = Conversation.create({
        organizationId: req.user.organizationId,
        userId: req.user.userId,
        providerId: provider.getId(),
        contextType: dto.contextType,
        contextId: dto.contextId,
        metadata: dto.metadata,
      });
    }

    // Add user message
    conversation.addMessage("user", dto.message);

    // Resolve time range — use DTO values if provided, else last 1 hour
    const now = new Date();
    const timeRange = {
      from: dto.timeFrom
        ? new Date(dto.timeFrom)
        : new Date(now.getTime() - 60 * 60 * 1000),
      to: dto.timeTo ? new Date(dto.timeTo) : now,
    };

    // Collect telemetry context from ClickHouse materialized views + PostgreSQL
    const telemetryCtx = await this.contextCollector.collectContext({
      organizationId: req.user.organizationId,
      userId: req.user.userId,
      contextType: dto.contextType,
      contextId: dto.contextId,
      timeRange,
    });

    // Build system prompt — ALWAYS include context so the LLM can accurately
    // report what data is (or isn't) available instead of asking the user for it
    const systemPrompt =
      this.promptBuilder.buildSystemPrompt(dto.contextType) +
      "\n\n" +
      this.promptBuilder.buildContextPrompt(telemetryCtx);

    const chatMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...conversation.getMessages().map((m) => ({
        role: m.getRole(),
        content: m.getContent(),
      })),
    ];

    // Attach file data to the last user message so the model can see them
    if (dto.attachments?.length) {
      const lastMsg = chatMessages[chatMessages.length - 1];
      if (lastMsg?.role === "user") {
        lastMsg.attachments = dto.attachments;
      }
    }

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    // Send conversation ID first
    res.write(
      `data: ${JSON.stringify({ type: "start", conversationId: conversation.getId() })}\n\n`,
    );

    // Persist conversation immediately so the ID is valid even if stream fails
    await this.conversationRepo.save(conversation);

    // Get adapter and stream
    const adapter = this.adapterFactory.getAdapter(
      provider.getProviderType().toString(),
      provider.getBaseUrl(),
    );
    const apiKey = this.encryptionService.decrypt(
      provider.getEncryptedApiKey().getValue(),
    );
    const modelConfig = provider.getModelConfig();

    let fullContent = "";
    const startTime = Date.now();

    try {
      const stream = adapter.chatStream(apiKey, {
        model: provider.getModelId(),
        messages: chatMessages,
        temperature: modelConfig.getTemperature(),
        maxTokens: modelConfig.getMaxTokens(),
        topP: modelConfig.getTopP(),
        samplingMode: modelConfig.getSamplingMode(),
      });

      let result;
      for await (const chunk of stream) {
        fullContent += chunk;
        res.write(
          `data: ${JSON.stringify({ type: "chunk", content: chunk })}\n\n`,
        );
        result = chunk;
      }

      const latencyMs = Date.now() - startTime;

      // Create assistant message
      const assistantMessage = conversation.addMessage(
        "assistant",
        fullContent,
        {
          modelId: provider.getModelId(),
          latencyMs,
        },
      );

      // Update title if first message
      if (conversation.getMessageCount() === 2) {
        const title =
          dto.message.substring(0, 100) +
          (dto.message.length > 100 ? "..." : "");
        conversation.updateTitle(title);
      }

      // Save
      await this.conversationRepo.save(conversation);
      provider.recordUsage();
      await this.providerRepo.save(provider);

      // Send completion
      res.write(
        `data: ${JSON.stringify({
          type: "end",
          messageId: assistantMessage.getId(),
          latencyMs,
        })}\n\n`,
      );
    } catch (error) {
      res.write(
        `data: ${JSON.stringify({
          type: "error",
          message: error instanceof Error ? error.message : "Stream failed",
        })}\n\n`,
      );
    }

    res.end();
  }

  @Get("conversations")
  @RequirePermissions("llm:read")
  @ApiOperation({
    summary: "List conversations",
    description: "Get all conversations for the current user",
  })
  @ApiResponse({ status: 200, description: "List of conversations" })
  async listConversations(
    @Request() req: { user: AuthenticatedUser },
    @Query() queryDto: ListConversationsQueryDto,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }

    const result = await this.conversationRepo.findByUser(
      req.user.organizationId,
      req.user.userId,
      {
        page: queryDto.page,
        pageSize: queryDto.pageSize,
        contextType: queryDto.contextType as ContextType,
        isArchived: queryDto.isArchived,
        search: queryDto.search,
      },
    );

    return {
      items: result.items.map((c) => this.toConversationSummary(c)),
      total: result.total,
      page: queryDto.page,
      pageSize: queryDto.pageSize,
    };
  }

  @Get("conversations/:id")
  @RequirePermissions("llm:read")
  @ApiOperation({
    summary: "Get conversation",
    description: "Get conversation with all messages",
  })
  @ApiParam({ name: "id", description: "Conversation ID" })
  @ApiResponse({ status: 200, description: "Conversation with messages" })
  @ApiResponse({ status: 404, description: "Conversation not found" })
  async getConversation(
    @Request() req: { user: AuthenticatedUser },
    @Param("id") id: string,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }

    const conversation = await this.conversationRepo.findByIdWithMessages(id);

    if (
      !conversation ||
      conversation.getOrganizationId() !== req.user.organizationId ||
      conversation.getUserId() !== req.user.userId
    ) {
      throw new NotFoundException("Conversation not found");
    }

    return this.toConversationDetail(conversation);
  }

  @Post("conversations/:id/archive")
  @RequirePermissions("llm:write")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Archive conversation",
    description: "Archive a conversation",
  })
  @ApiParam({ name: "id", description: "Conversation ID" })
  @ApiResponse({ status: 200, description: "Conversation archived" })
  async archiveConversation(
    @Request() req: { user: AuthenticatedUser },
    @Param("id") id: string,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }

    const conversation = await this.conversationRepo.findById(id);

    if (
      !conversation ||
      conversation.getOrganizationId() !== req.user.organizationId ||
      conversation.getUserId() !== req.user.userId
    ) {
      throw new NotFoundException("Conversation not found");
    }

    conversation.archive();
    await this.conversationRepo.save(conversation);

    return { message: "Conversation archived" };
  }

  @Delete("conversations/:id")
  @RequirePermissions("llm:delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete conversation",
    description: "Permanently delete a conversation",
  })
  @ApiParam({ name: "id", description: "Conversation ID" })
  @ApiResponse({ status: 204, description: "Conversation deleted" })
  async deleteConversation(
    @Request() req: { user: AuthenticatedUser },
    @Param("id") id: string,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }

    const conversation = await this.conversationRepo.findById(id);

    if (
      !conversation ||
      conversation.getOrganizationId() !== req.user.organizationId ||
      conversation.getUserId() !== req.user.userId
    ) {
      throw new NotFoundException("Conversation not found");
    }

    await this.conversationRepo.delete(id);
  }

  private toConversationSummary(conversation: Conversation) {
    return {
      id: conversation.getId(),
      title: conversation.getTitle(),
      contextType: conversation.getContextType(),
      contextId: conversation.getContextId(),
      messageCount: conversation.getMessageCount(),
      totalTokensUsed: conversation.getTotalTokensUsed(),
      lastMessageAt: conversation.getLastMessageAt(),
      isArchived: conversation.isArchived(),
      createdAt: conversation.getCreatedAt(),
    };
  }

  private toConversationDetail(conversation: Conversation) {
    return {
      ...this.toConversationSummary(conversation),
      messages: conversation.getMessages().map((m) => ({
        id: m.getId(),
        role: m.getRole(),
        content: m.getContent(),
        tokensUsed: m.getTokensUsed(),
        modelId: m.getModelId(),
        latencyMs: m.getLatencyMs(),
        createdAt: m.getCreatedAt(),
      })),
    };
  }
}

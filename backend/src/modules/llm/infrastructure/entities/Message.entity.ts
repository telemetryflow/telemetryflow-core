/**
 * Message TypeORM Entity
 */

import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { ConversationEntity } from "./Conversation.entity";

@Entity("llm_messages")
@Index(["conversationId"])
@Index(["conversationId", "createdAt"])
export class MessageEntity {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ type: "uuid", name: "conversation_id" })
  conversationId: string;

  @Column({ type: "varchar", length: 20 })
  role: string;

  @Column({ type: "text" })
  content: string;

  @Column({ type: "int", nullable: true, name: "tokens_used" })
  tokensUsed: number | null;

  @Column({ type: "varchar", length: 100, nullable: true, name: "model_id" })
  modelId: string | null;

  @Column({ type: "int", nullable: true, name: "latency_ms" })
  latencyMs: number | null;

  @Column({ type: "jsonb", nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt: Date;

  @ManyToOne(() => ConversationEntity, (conversation) => conversation.messages)
  @JoinColumn({ name: "conversation_id" })
  conversation: ConversationEntity;
}

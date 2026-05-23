/**
 * Conversation TypeORM Entity
 */

import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from "typeorm";
import { MessageEntity } from "./Message.entity";

@Entity("llm_conversations")
@Index(["organizationId", "userId"])
@Index(["contextType", "contextId"])
@Index(["providerId"])
@Index(["organizationId", "userId", "lastMessageAt"])
export class ConversationEntity {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ type: "uuid", name: "organization_id" })
  organizationId: string;

  @Column({ type: "uuid", name: "user_id" })
  userId: string;

  @Column({ type: "uuid", name: "provider_id" })
  providerId: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  title: string | null;

  @Column({ type: "varchar", length: 50, name: "context_type" })
  contextType: string;

  @Column({ type: "varchar", length: 255, nullable: true, name: "context_id" })
  contextId: string | null;

  @Column({ type: "jsonb", nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: "int", default: 0, name: "message_count" })
  messageCount: number;

  @Column({ type: "bigint", default: 0, name: "total_tokens_used" })
  totalTokensUsed: number;

  @Column({ type: "timestamptz", nullable: true, name: "last_message_at" })
  lastMessageAt: Date | null;

  @Column({ type: "boolean", default: false, name: "is_archived" })
  isArchived: boolean;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updatedAt: Date;

  @OneToMany(() => MessageEntity, (message) => message.conversation)
  messages: MessageEntity[];
}

/**
 * ContextSnapshot TypeORM Entity
 * Stores telemetry context associated with a message
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
import { MessageEntity } from "./Message.entity";

@Entity("llm_context_snapshots")
@Index(["messageId"])
export class ContextSnapshotEntity {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ type: "uuid", name: "message_id" })
  messageId: string;

  @Column({ type: "varchar", length: 50, name: "context_type" })
  contextType: string;

  @Column({ type: "jsonb", name: "context_data" })
  contextData: Record<string, unknown>;

  @Column({ type: "text", nullable: true })
  summary: string | null;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt: Date;

  @ManyToOne(() => MessageEntity)
  @JoinColumn({ name: "message_id" })
  message: MessageEntity;
}

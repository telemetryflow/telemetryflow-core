import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

/**
 * NotificationTemplate Entity
 *
 * Stores reusable notification templates (email, slack, webhook)
 * with Handlebars template content and variable definitions.
 * Supports both system-level templates (organization_id is null)
 * and organization-specific custom templates.
 */
@Entity("notification_templates")
@Index(["organizationId", "name"], { unique: true })
@Index(["organizationId", "type"])
@Index(["isSystem"])
export class NotificationTemplateEntity {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ name: "organization_id", type: "uuid", nullable: true })
  @Index()
  organizationId: string | null;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 20 })
  type: string;

  @Column({ length: 500 })
  subject: string;

  @Column({ type: "text" })
  body: string;

  @Column({ type: "jsonb", default: [] })
  variables: string[];

  @Column({ name: "is_system", default: false })
  isSystem: boolean;

  @Column({ default: true })
  enabled: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;
}

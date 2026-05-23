import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from "typeorm";
import { MaskingRuleProps } from "../../../domain/value-objects/MaskingRule";

@Entity("data_masking_policies")
@Index(["organizationId", "enabled"])
@Index(["organizationId", "workspaceId"])
export class DataMaskingPolicyEntity {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ name: "organization_id", type: "uuid" })
  @Index()
  organizationId: string;

  @Column({ name: "workspace_id", type: "uuid", nullable: true })
  workspaceId: string | null;

  @Column({ length: 255 })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @Column({ name: "is_enabled", type: "boolean", default: true })
  enabled: boolean;

  @Column({ type: "jsonb", default: [] })
  rules: MaskingRuleProps[];

  @Column({ name: "created_by", type: "uuid" })
  createdBy: string;

  @Column({ name: "updated_by", type: "uuid", nullable: true })
  updatedBy: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt: Date | null;
}

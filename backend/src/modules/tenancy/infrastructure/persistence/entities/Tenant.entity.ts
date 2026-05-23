import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { WorkspaceEntity } from "./Workspace.entity";

@Entity("tenants")
@Index(["workspaceId"])
export class TenantEntity {
  @PrimaryGeneratedColumn("uuid", { name: "tenant_id" })
  tenantId: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 50, unique: true })
  code: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ name: "workspace_id", type: "uuid" })
  workspaceId: string;

  @ManyToOne(() => WorkspaceEntity, (ws) => ws.tenants)
  @JoinColumn({ name: "workspace_id" })
  workspace: WorkspaceEntity;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at", nullable: true })
  deletedAt: Date;
}

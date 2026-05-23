import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";
import { OrganizationEntity } from "./Organization.entity";
import { TenantEntity } from "./Tenant.entity";

@Entity("workspaces")
@Index(["organizationId"])
export class WorkspaceEntity {
  @PrimaryGeneratedColumn("uuid", { name: "workspace_id" })
  workspaceId: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 50, unique: true })
  code: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ name: "organization_id", type: "uuid" })
  organizationId: string;

  @ManyToOne(() => OrganizationEntity, (org) => org.workspaces)
  @JoinColumn({ name: "organization_id" })
  organization: OrganizationEntity;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at", nullable: true })
  deletedAt: Date;

  @OneToMany(() => TenantEntity, (tenant) => tenant.workspace)
  tenants: TenantEntity[];
}

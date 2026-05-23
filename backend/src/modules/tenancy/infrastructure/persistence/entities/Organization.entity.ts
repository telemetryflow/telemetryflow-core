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
import { RegionEntity } from "./Region.entity";
import { WorkspaceEntity } from "./Workspace.entity";

@Entity("organizations")
@Index(["code"])
@Index(["regionId"])
export class OrganizationEntity {
  @PrimaryGeneratedColumn("uuid", { name: "organization_id" })
  organizationId: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 50, unique: true })
  code: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ length: 255, nullable: true })
  domain: string;

  @Column({ name: "region_id", type: "uuid" })
  regionId: string;

  @ManyToOne(() => RegionEntity, (region) => region.organizations)
  @JoinColumn({ name: "region_id" })
  region: RegionEntity;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at", nullable: true })
  deletedAt: Date;

  @OneToMany(() => WorkspaceEntity, (ws) => ws.organization)
  workspaces: WorkspaceEntity[];
}

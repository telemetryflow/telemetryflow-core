import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from "typeorm";

@Entity("invite_tokens")
@Index(["token"], { unique: true })
@Index(["created_by"])
@Index(["expires_at"])
export class InviteTokenEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255, unique: true })
  token: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  email: string;

  @Column({ type: "uuid" })
  created_by: string;

  @Column({ type: "uuid", nullable: true })
  organization_id: string;

  @Column({ type: "timestamptz" })
  expires_at: Date;

  @Column({ type: "int", default: 1 })
  max_uses: number;

  @Column({ type: "int", default: 0 })
  used_count: number;

  @CreateDateColumn({ name: "created_at" })
  created_at: Date;
}

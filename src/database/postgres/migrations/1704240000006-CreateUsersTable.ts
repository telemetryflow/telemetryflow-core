import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1704240000006 implements MigrationInterface {
  name = 'CreateUsersTable1704240000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "email" varchar NOT NULL UNIQUE,
        "password" varchar NOT NULL,
        "firstName" varchar NOT NULL,
        "lastName" varchar NOT NULL,
        "isActive" boolean DEFAULT true,
        "organization_id" uuid,
        "tenant_id" uuid,
        "group_user_id" uuid,
        "timezone" varchar(50) DEFAULT 'UTC',
        "locale" varchar(10) DEFAULT 'en-US',
        "lastLoginAt" timestamp,
        "loginCount" integer DEFAULT 0,
        "passwordHistory" jsonb DEFAULT '[]',
        "passwordChangedAt" timestamp,
        "failedLoginAttempts" integer DEFAULT 0,
        "lockedUntil" timestamp,
        "lastFailedLoginAt" timestamp,
        "mfa_enabled" boolean DEFAULT false,
        "mfa_secret" varchar(255),
        "mfa_backup_codes" jsonb,
        "mfa_enrolled_at" timestamp,
        "mfa_last_used_at" timestamp,
        "force_password_change" boolean DEFAULT false,
        "password_change_reason" varchar(255),
        "avatar" varchar(500),
        "emailVerified" boolean DEFAULT false,
        "createdAt" timestamp DEFAULT now(),
        "updatedAt" timestamp DEFAULT now(),
        "deletedAt" timestamp,
        CONSTRAINT "FK_users_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("organization_id"),
        CONSTRAINT "FK_users_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("tenant_id"),
        CONSTRAINT "FK_users_group" FOREIGN KEY ("group_user_id") REFERENCES "groups"("id")
      )
    `);
    
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_users_email_deletedAt" ON "users"("email", "deletedAt")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateIAMTables1733191200000 implements MigrationInterface {
    name = 'CreateIAMTables1733191200000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable UUID extension
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // Create regions table
        await queryRunner.query(`
            CREATE TABLE "regions" (
                "region_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "code" character varying(50) NOT NULL,
                "description" text,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "deletedAt" TIMESTAMP,
                CONSTRAINT "PK_regions" PRIMARY KEY ("region_id"),
                CONSTRAINT "UQ_regions_code" UNIQUE ("code")
            )
        `);

        // Create organizations table
        await queryRunner.query(`
            CREATE TABLE "organizations" (
                "organization_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "code" character varying(50) NOT NULL,
                "description" text,
                "domain" character varying(255),
                "isActive" boolean NOT NULL DEFAULT true,
                "region_id" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "deletedAt" TIMESTAMP,
                CONSTRAINT "PK_organizations" PRIMARY KEY ("organization_id"),
                CONSTRAINT "UQ_organizations_code" UNIQUE ("code")
            )
        `);

        // Create tenants table
        await queryRunner.query(`
            CREATE TABLE "tenants" (
                "id" uuid NOT NULL,
                "name" character varying NOT NULL,
                "slug" character varying NOT NULL,
                "description" character varying,
                "is_active" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "PK_tenants" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_tenants_slug" UNIQUE ("slug")
            )
        `);

        // Create workspaces table
        await queryRunner.query(`
            CREATE TABLE "workspaces" (
                "id" uuid NOT NULL,
                "name" character varying NOT NULL,
                "slug" character varying NOT NULL,
                "description" character varying,
                "organization_id" uuid,
                "is_active" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "PK_workspaces" PRIMARY KEY ("id")
            )
        `);

        // Create roles table
        await queryRunner.query(`
            CREATE TABLE "roles" (
                "id" uuid NOT NULL,
                "name" character varying NOT NULL,
                "description" character varying,
                "tenant_id" uuid,
                "is_system" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "PK_roles" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_roles_name" UNIQUE ("name")
            )
        `);

        // Create permissions table
        await queryRunner.query(`
            CREATE TABLE "permissions" (
                "id" uuid NOT NULL,
                "name" character varying NOT NULL,
                "description" character varying,
                "resource" character varying,
                "action" character varying,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "PK_permissions" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_permissions_name" UNIQUE ("name")
            )
        `);

        // Create users table
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL,
                "email" character varying NOT NULL,
                "password" character varying NOT NULL,
                "firstName" character varying NOT NULL,
                "lastName" character varying NOT NULL,
                "isActive" boolean NOT NULL DEFAULT true,
                "organization_id" uuid,
                "tenant_id" uuid,
                "group_user_id" uuid,
                "timezone" character varying DEFAULT 'UTC',
                "locale" character varying DEFAULT 'en-US',
                "lastLoginAt" TIMESTAMP,
                "loginCount" integer DEFAULT 0,
                "passwordHistory" jsonb DEFAULT '[]',
                "passwordChangedAt" TIMESTAMP,
                "failedLoginAttempts" integer DEFAULT 0,
                "lockedUntil" TIMESTAMP,
                "lastFailedLoginAt" TIMESTAMP,
                "mfa_enabled" boolean DEFAULT false,
                "mfa_secret" character varying,
                "mfa_backup_codes" jsonb,
                "mfa_enrolled_at" TIMESTAMP,
                "mfa_last_used_at" TIMESTAMP,
                "force_password_change" boolean DEFAULT false,
                "password_change_reason" character varying,
                "avatar" character varying,
                "emailVerified" boolean DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "deletedAt" TIMESTAMP,
                CONSTRAINT "PK_users" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_users_email" UNIQUE ("email")
            )
        `);

        // Create groups table
        await queryRunner.query(`
            CREATE TABLE "groups" (
                "id" uuid NOT NULL,
                "name" character varying NOT NULL,
                "description" character varying,
                "organization_id" uuid,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "PK_groups" PRIMARY KEY ("id")
            )
        `);

        // Create junction tables
        await queryRunner.query(`
            CREATE TABLE "role_permissions" (
                "role_id" uuid NOT NULL,
                "permission_id" uuid NOT NULL,
                CONSTRAINT "PK_role_permissions" PRIMARY KEY ("role_id", "permission_id")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "user_roles" (
                "user_id" uuid NOT NULL,
                "role_id" uuid NOT NULL,
                CONSTRAINT "PK_user_roles" PRIMARY KEY ("user_id", "role_id")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "user_permissions" (
                "user_id" uuid NOT NULL,
                "permission_id" uuid NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_user_permissions" PRIMARY KEY ("user_id", "permission_id")
            )
        `);

        // Add foreign keys
        await queryRunner.query(`
            ALTER TABLE "role_permissions" 
            ADD CONSTRAINT "FK_role_permissions_role" 
            FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "role_permissions" 
            ADD CONSTRAINT "FK_role_permissions_permission" 
            FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "user_roles" 
            ADD CONSTRAINT "FK_user_roles_user" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "user_roles" 
            ADD CONSTRAINT "FK_user_roles_role" 
            FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "user_permissions" 
            ADD CONSTRAINT "FK_user_permissions_user" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "user_permissions" 
            ADD CONSTRAINT "FK_user_permissions_permission" 
            FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE
        `);

        // Create indexes
        await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);
        await queryRunner.query(`CREATE INDEX "IDX_users_organization" ON "users" ("organization_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_organizations_code" ON "organizations" ("code")`);
        await queryRunner.query(`CREATE INDEX "IDX_regions_code" ON "regions" ("code")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "user_permissions" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "user_roles" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "role_permissions" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "groups" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "permissions" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "roles" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "workspaces" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "tenants" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "organizations" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "regions" CASCADE`);
    }
}

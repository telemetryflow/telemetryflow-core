import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWorkspacesTable1704240000003 implements MigrationInterface {
  name = 'CreateWorkspacesTable1704240000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "workspaces" (
        "workspace_id" uuid PRIMARY KEY,
        "name" varchar(255) NOT NULL,
        "code" varchar(50) NOT NULL UNIQUE,
        "description" text,
        "isActive" boolean DEFAULT true,
        "datasource_config" jsonb,
        "organization_id" uuid NOT NULL,
        "createdAt" timestamp DEFAULT now(),
        "updatedAt" timestamp DEFAULT now(),
        "deletedAt" timestamp,
        CONSTRAINT "FK_workspaces_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("organization_id")
      )
    `);
    
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_workspaces_organization_id" ON "workspaces"("organization_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "workspaces" CASCADE`);
  }
}

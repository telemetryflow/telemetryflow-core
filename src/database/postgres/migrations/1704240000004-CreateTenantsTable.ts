import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTenantsTable1704240000004 implements MigrationInterface {
  name = 'CreateTenantsTable1704240000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tenants" (
        "tenant_id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar(255) NOT NULL,
        "code" varchar(50) NOT NULL UNIQUE,
        "domain" varchar(255),
        "isActive" boolean DEFAULT true,
        "workspace_id" uuid NOT NULL,
        "createdAt" timestamp DEFAULT now(),
        "updatedAt" timestamp DEFAULT now(),
        "deletedAt" timestamp,
        CONSTRAINT "FK_tenants_workspace" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("workspace_id")
      )
    `);
    
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_tenants_workspace_id" ON "tenants"("workspace_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "tenants" CASCADE`);
  }
}

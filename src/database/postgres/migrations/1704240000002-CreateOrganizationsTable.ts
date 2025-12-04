import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrganizationsTable1704240000002 implements MigrationInterface {
  name = 'CreateOrganizationsTable1704240000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "organizations" (
        "organization_id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar(255) NOT NULL,
        "code" varchar(50) NOT NULL UNIQUE,
        "description" text,
        "domain" varchar(255),
        "isActive" boolean DEFAULT true,
        "region_id" uuid NOT NULL,
        "createdAt" timestamp DEFAULT now(),
        "updatedAt" timestamp DEFAULT now(),
        "deletedAt" timestamp,
        CONSTRAINT "FK_organizations_region" FOREIGN KEY ("region_id") REFERENCES "regions"("id")
      )
    `);
    
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_organizations_code" ON "organizations"("code")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_organizations_region_id" ON "organizations"("region_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "organizations" CASCADE`);
  }
}

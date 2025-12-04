import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGroupsTable1704240000005 implements MigrationInterface {
  name = 'CreateGroupsTable1704240000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "groups" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar(255) NOT NULL,
        "description" text,
        "organizationId" uuid,
        "createdAt" timestamp with time zone DEFAULT now(),
        "updatedAt" timestamp with time zone DEFAULT now(),
        "deletedAt" timestamp with time zone,
        CONSTRAINT "FK_groups_organization" FOREIGN KEY ("organizationId") REFERENCES "organizations"("organization_id")
      )
    `);
    
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_groups_organizationId" ON "groups"("organizationId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_groups_name" ON "groups"("name")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_groups_deletedAt" ON "groups"("deletedAt")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "groups" CASCADE`);
  }
}

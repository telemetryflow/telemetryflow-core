import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDataMaskingPoliciesTable1723000000001 implements MigrationInterface {
  name = "CreateDataMaskingPoliciesTable1723000000001";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "data_masking_policies" (
        "id"              UUID          NOT NULL DEFAULT gen_random_uuid(),
        "organization_id" UUID          NOT NULL,
        "workspace_id"    UUID,
        "name"            VARCHAR(255)  NOT NULL,
        "description"     TEXT,
        "is_enabled"      BOOLEAN       NOT NULL DEFAULT TRUE,
        "rules"           JSONB         NOT NULL DEFAULT '[]',
        "created_by"      UUID          NOT NULL,
        "updated_by"      UUID,
        "created_at"      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        "updated_at"      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        "deleted_at"      TIMESTAMPTZ,
        CONSTRAINT "pk_data_masking_policies" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_dmp_org_enabled"
        ON "data_masking_policies" ("organization_id", "is_enabled")
        WHERE "deleted_at" IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_dmp_org_workspace"
        ON "data_masking_policies" ("organization_id", "workspace_id")
        WHERE "deleted_at" IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_dmp_org_created"
        ON "data_masking_policies" ("organization_id", "created_at" DESC)
        WHERE "deleted_at" IS NULL
    `);

    await queryRunner.query(`
      COMMENT ON TABLE "data_masking_policies" IS
        'PII masking policies — each policy contains an ordered list of masking rules applied to log records at ingestion time'
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_dmp_org_created"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_dmp_org_workspace"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_dmp_org_enabled"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "data_masking_policies"`);
  }
}

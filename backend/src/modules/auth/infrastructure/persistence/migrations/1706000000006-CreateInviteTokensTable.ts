import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInviteTokensTable1706000000006 implements MigrationInterface {
  name = "CreateInviteTokensTable1706000000006";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "invite_tokens" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "token" character varying(255) NOT NULL,
        "email" character varying(255),
        "created_by" UUID NOT NULL,
        "organization_id" UUID,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "max_uses" integer NOT NULL DEFAULT 1,
        "used_count" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_invite_tokens" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_invite_tokens_token" ON "invite_tokens" ("token")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_invite_tokens_created_by" ON "invite_tokens" ("created_by")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_invite_tokens_expires_at" ON "invite_tokens" ("expires_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "invite_tokens"`);
  }
}

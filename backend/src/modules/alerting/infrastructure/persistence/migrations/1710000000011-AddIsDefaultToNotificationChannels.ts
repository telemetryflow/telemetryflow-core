import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsDefaultToNotificationChannels1710000000011
  implements MigrationInterface
{
  name = "AddIsDefaultToNotificationChannels1710000000011";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE notification_channels
      ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT FALSE
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE notification_channels
      DROP COLUMN IF EXISTS is_default
    `);
  }
}

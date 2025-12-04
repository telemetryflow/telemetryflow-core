import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRBACTables1704240000007 implements MigrationInterface {
  name = 'CreateRBACTables1704240000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Permissions
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "permissions" (
        "id" uuid PRIMARY KEY,
        "name" varchar NOT NULL UNIQUE,
        "description" varchar,
        "resource" varchar,
        "action" varchar,
        "createdAt" timestamp DEFAULT now(),
        "updatedAt" timestamp DEFAULT now(),
        "deletedAt" timestamp
      )
    `);

    // Roles
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "roles" (
        "id" uuid PRIMARY KEY,
        "name" varchar NOT NULL UNIQUE,
        "description" varchar,
        "is_system" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        "deleted_at" timestamp
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "roles" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permissions" CASCADE`);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRegionsTable1704240000001 implements MigrationInterface {
  name = 'CreateRegionsTable1704240000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "regions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "code" varchar NOT NULL UNIQUE,
        "name" varchar NOT NULL,
        "description" text,
        "is_active" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "regions" CASCADE`);
  }
}

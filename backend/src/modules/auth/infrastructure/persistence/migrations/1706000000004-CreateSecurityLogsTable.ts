import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

/**
 * Migration: CreateSecurityLogsTable
 *
 * Creates the security_logs table for logging all authentication and security events.
 * This table supports security auditing, threat detection, and compliance reporting.
 *
 * Requirements: 4.8, 6.7, 10.6, 10.7
 */
export class CreateSecurityLogsTable1706000000004
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create security_logs table
    await queryRunner.createTable(
      new Table({
        name: "security_logs",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "user_id",
            type: "uuid",
            isNullable: true,
          },
          {
            name: "event_type",
            type: "varchar",
            length: "50",
          },
          {
            name: "ip_address",
            type: "varchar",
            length: "45",
          },
          {
            name: "user_agent",
            type: "text",
            isNullable: true,
          },
          {
            name: "success",
            type: "boolean",
            default: false,
          },
          {
            name: "error_message",
            type: "text",
            isNullable: true,
          },
          {
            name: "metadata",
            type: "jsonb",
            isNullable: true,
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
        ],
      }),
      true,
    );

    // Create indexes for efficient querying
    await queryRunner.createIndex(
      "security_logs",
      new TableIndex({
        name: "IDX_security_logs_user_id",
        columnNames: ["user_id"],
      }),
    );

    await queryRunner.createIndex(
      "security_logs",
      new TableIndex({
        name: "IDX_security_logs_event_type",
        columnNames: ["event_type"],
      }),
    );

    await queryRunner.createIndex(
      "security_logs",
      new TableIndex({
        name: "IDX_security_logs_ip_address",
        columnNames: ["ip_address"],
      }),
    );

    await queryRunner.createIndex(
      "security_logs",
      new TableIndex({
        name: "IDX_security_logs_created_at",
        columnNames: ["created_at"],
      }),
    );

    await queryRunner.createIndex(
      "security_logs",
      new TableIndex({
        name: "IDX_security_logs_user_id_event_type",
        columnNames: ["user_id", "event_type"],
      }),
    );

    await queryRunner.createIndex(
      "security_logs",
      new TableIndex({
        name: "IDX_security_logs_user_id_created_at",
        columnNames: ["user_id", "created_at"],
      }),
    );

    // Add foreign key constraint to users table
    await queryRunner.query(`
      ALTER TABLE security_logs
      ADD CONSTRAINT FK_security_logs_user_id
      FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE SET NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraint
    await queryRunner.query(`
      ALTER TABLE security_logs
      DROP CONSTRAINT IF EXISTS FK_security_logs_user_id;
    `);

    // Drop indexes
    await queryRunner.dropIndex("security_logs", "IDX_security_logs_user_id");
    await queryRunner.dropIndex(
      "security_logs",
      "IDX_security_logs_event_type",
    );
    await queryRunner.dropIndex(
      "security_logs",
      "IDX_security_logs_ip_address",
    );
    await queryRunner.dropIndex(
      "security_logs",
      "IDX_security_logs_created_at",
    );
    await queryRunner.dropIndex(
      "security_logs",
      "IDX_security_logs_user_id_event_type",
    );
    await queryRunner.dropIndex(
      "security_logs",
      "IDX_security_logs_user_id_created_at",
    );

    // Drop table
    await queryRunner.dropTable("security_logs");
  }
}

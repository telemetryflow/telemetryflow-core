import "dotenv/config";
import { DataSource } from "typeorm";
import { DatabaseConfig } from "./config/database.config";

export default new DataSource({
  type: "postgres",
  host: DatabaseConfig.postgres.host,
  port: DatabaseConfig.postgres.port,
  username: DatabaseConfig.postgres.username,
  password: DatabaseConfig.postgres.password,
  database: DatabaseConfig.postgres.database,
  entities: [
    "backend/src/modules/**/infrastructure/persistence/entities/**/*.entity.ts",
  ],
  migrations: [
    // Flat PG migrations (iam, auth, agent, alerting, etc.)
    "backend/src/modules/**/infrastructure/persistence/migrations/[0-9]*.ts",
    // Nested PG migrations in postgres/ (kubernetes, vm)
    "backend/src/modules/**/infrastructure/persistence/migrations/postgres/[0-9]*.ts",
    // Nested PG migrations in postgresql/ (service-map, network-map, uptime, etc.)
    "backend/src/modules/**/infrastructure/persistence/migrations/postgresql/[0-9]*.ts",
  ],
  migrationsTableName: "migrations",
  logging: process.env.NODE_ENV === "development",
  synchronize: false, // Disabled: Use migrations instead
});

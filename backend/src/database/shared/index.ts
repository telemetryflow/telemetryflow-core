/**
 * Database Shared Module
 *
 * Exports base classes and interfaces for modular migrations and seeds.
 */

// Interfaces
export * from "./interfaces";

// PostgreSQL (TypeORM) base classes
export { BaseMigration } from "./BaseMigration";
export { BaseSeed } from "./BaseSeed";

// ClickHouse base classes
export { BaseClickHouseMigration } from "./BaseClickHouseMigration";
export { BaseClickHouseSeed } from "./BaseClickHouseSeed";

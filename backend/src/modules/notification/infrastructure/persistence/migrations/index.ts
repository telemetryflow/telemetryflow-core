import { MigrationInterface } from "typeorm";
import { CreateNotificationTables1707000000001 } from "./1707000000001-CreateNotificationTables";

export const NotificationMigrations: (new () => MigrationInterface)[] = [
  CreateNotificationTables1707000000001,
];

export { CreateNotificationTables1707000000001 };

import type { StatPanelDefinition } from "./types";

// Allocated ID range: DBM20451-DBM20460
export const DBM_AWS_RDS_MYSQL_STAT_PANELS: StatPanelDefinition[] = [
  {
    statPanelId: "DBM20451", module: "DBM", title: "Total Instances",
    icon: "carbon:data-base", color: "primary", unit: "", size: "default", hasTrend: false, hasTimeRange: false,
    description: "Total registered RDS MySQL/MariaDB instances",
    dataSource: "dbAwsRdsMysqlStore.overview?.totalInstances",
    view: "/db-monitoring/aws-rds-mysql", position: "overview-top",
  },
  {
    statPanelId: "DBM20452", module: "DBM", title: "Healthy",
    icon: "carbon:checkmark-filled", color: "success", unit: "", size: "default", hasTrend: false, hasTimeRange: false,
    description: "Instances with available status",
    dataSource: "dbAwsRdsMysqlStore.overview?.healthyInstances",
    view: "/db-monitoring/aws-rds-mysql", position: "overview-top",
  },
  {
    statPanelId: "DBM20453", module: "DBM", title: "Warning",
    icon: "carbon:warning", color: "warning", unit: "", size: "default", hasTrend: false, hasTimeRange: false,
    description: "Instances in warning state",
    dataSource: "dbAwsRdsMysqlStore.overview?.warningInstances",
    view: "/db-monitoring/aws-rds-mysql", position: "overview-top",
  },
  {
    statPanelId: "DBM20454", module: "DBM", title: "Critical",
    icon: "carbon:close-filled", color: "error", unit: "", size: "default", hasTrend: false, hasTimeRange: false,
    description: "Instances in critical state",
    dataSource: "dbAwsRdsMysqlStore.overview?.criticalInstances",
    view: "/db-monitoring/aws-rds-mysql", position: "overview-top",
  },
  {
    statPanelId: "DBM20455", module: "DBM", title: "MySQL Instances",
    icon: "carbon:data-base", color: "info", unit: "", size: "default", hasTrend: false, hasTimeRange: false,
    description: "Number of MySQL engine instances",
    dataSource: "dbAwsRdsMysqlStore.overview?.mysqlInstances",
    view: "/db-monitoring/aws-rds-mysql", position: "overview-top",
  },
  {
    statPanelId: "DBM20456", module: "DBM", title: "MariaDB Instances",
    icon: "carbon:data-base", color: "info", unit: "", size: "default", hasTrend: false, hasTimeRange: false,
    description: "Number of MariaDB engine instances",
    dataSource: "dbAwsRdsMysqlStore.overview?.mariadbInstances",
    view: "/db-monitoring/aws-rds-mysql", position: "overview-top",
  },
  {
    statPanelId: "DBM20457", module: "DBM", title: "Read Replicas",
    icon: "carbon:replicate", color: "info", unit: "", size: "default", hasTrend: false, hasTimeRange: false,
    description: "Number of read replicas",
    dataSource: "dbAwsRdsMysqlStore.overview?.replicaInstances",
    view: "/db-monitoring/aws-rds-mysql", position: "overview-top",
  },
  {
    statPanelId: "DBM20458", module: "DBM", title: "Total Storage",
    icon: "carbon:hard-disk", color: "primary", unit: "GB", size: "default", hasTrend: false, hasTimeRange: false,
    description: "Total allocated storage across all instances",
    dataSource: "dbAwsRdsMysqlStore.overview?.totalStorage",
    view: "/db-monitoring/aws-rds-mysql", position: "overview-top",
  },
];

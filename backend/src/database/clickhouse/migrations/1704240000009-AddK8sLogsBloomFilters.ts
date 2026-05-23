import { ClickHouseClient } from "@clickhouse/client";
import { BaseClickHouseMigration } from "@/database/shared/BaseClickHouseMigration";

/**
 * Add Bloom Filter Indexes on logs Table for Kubernetes Attributes
 *
 * Pod logs ingested via SyncClusterState are written to both:
 *   1. kubernetes_pod_logs  — K8s-specific view with 7-day TTL
 *   2. logs (this table)    — unified log search with 30-day TTL
 *
 * When written to the main logs table, K8s resource attributes are stored as:
 *   resource_attributes['k8s.cluster.id']
 *   resource_attributes['k8s.namespace.name']
 *   resource_attributes['k8s.pod.name']
 *   resource_attributes['k8s.container.name']
 *   resource_attributes['k8s.node.name']
 *   resource_attributes['k8s.deployment.name']
 *
 * Bloom filter indexes enable efficient point-lookups and IN-list queries on
 * Map values, avoiding full table scans when filtering pod logs by cluster,
 * namespace, or pod name in the unified Logs view.
 *
 * Granularity = 1: one bloom filter per granule (8192 rows) — optimal for
 * high-cardinality string fields like pod names and cluster IDs.
 */
export class AddK8sLogsBloomFilters1704240000009 extends BaseClickHouseMigration {
  name = "AddK8sLogsBloomFilters1704240000009";
  moduleName = "core";

  async up(client: ClickHouseClient, database: string): Promise<void> {
    this.log("Adding Kubernetes bloom filter indexes to logs table...");

    // cluster.id — low cardinality, but used as primary partition filter
    await client.command({
      query: `
        ALTER TABLE ${database}.logs
          ADD INDEX IF NOT EXISTS idx_log_k8s_cluster_id
          (resource_attributes['k8s.cluster.id'])
          TYPE bloom_filter(0.01)
          GRANULARITY 1
      `,
    });

    // namespace.name — medium cardinality, common filter in pod log search
    await client.command({
      query: `
        ALTER TABLE ${database}.logs
          ADD INDEX IF NOT EXISTS idx_log_k8s_namespace
          (resource_attributes['k8s.namespace.name'])
          TYPE bloom_filter(0.01)
          GRANULARITY 1
      `,
    });

    // pod.name — high cardinality, most specific filter
    await client.command({
      query: `
        ALTER TABLE ${database}.logs
          ADD INDEX IF NOT EXISTS idx_log_k8s_pod_name
          (resource_attributes['k8s.pod.name'])
          TYPE bloom_filter(0.01)
          GRANULARITY 1
      `,
    });

    // container.name — for multi-container pod filtering
    await client.command({
      query: `
        ALTER TABLE ${database}.logs
          ADD INDEX IF NOT EXISTS idx_log_k8s_container_name
          (resource_attributes['k8s.container.name'])
          TYPE bloom_filter(0.01)
          GRANULARITY 1
      `,
    });

    // deployment.name — for deployment-level log aggregation
    await client.command({
      query: `
        ALTER TABLE ${database}.logs
          ADD INDEX IF NOT EXISTS idx_log_k8s_deployment_name
          (resource_attributes['k8s.deployment.name'])
          TYPE bloom_filter(0.01)
          GRANULARITY 1
      `,
    });

    // Materialize the new indexes on existing data
    this.log("Materializing bloom filter indexes on existing log data...");
    await client.command({
      query: `ALTER TABLE ${database}.logs MATERIALIZE INDEX idx_log_k8s_cluster_id`,
    });
    await client.command({
      query: `ALTER TABLE ${database}.logs MATERIALIZE INDEX idx_log_k8s_namespace`,
    });
    await client.command({
      query: `ALTER TABLE ${database}.logs MATERIALIZE INDEX idx_log_k8s_pod_name`,
    });
    await client.command({
      query: `ALTER TABLE ${database}.logs MATERIALIZE INDEX idx_log_k8s_container_name`,
    });
    await client.command({
      query: `ALTER TABLE ${database}.logs MATERIALIZE INDEX idx_log_k8s_deployment_name`,
    });

    this.log("Kubernetes bloom filter indexes added and materialized.");
  }

  async down(client: ClickHouseClient, database: string): Promise<void> {
    this.log("Dropping Kubernetes bloom filter indexes from logs table...");

    for (const idx of [
      "idx_log_k8s_cluster_id",
      "idx_log_k8s_namespace",
      "idx_log_k8s_pod_name",
      "idx_log_k8s_container_name",
      "idx_log_k8s_deployment_name",
    ]) {
      await client.command({
        query: `ALTER TABLE ${database}.logs DROP INDEX IF EXISTS ${idx}`,
      });
    }

    this.log("Kubernetes bloom filter indexes dropped.");
  }
}

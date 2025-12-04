export interface ClickHouseAuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  metadata: string;
  ip_address: string;
  user_agent: string;
  timestamp: Date;
}

export const AUDIT_LOG_SCHEMA = `
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID,
  user_id UUID,
  action String,
  resource_type String,
  resource_id String,
  metadata String,
  ip_address String,
  user_agent String,
  timestamp DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (user_id, timestamp)
TTL timestamp + INTERVAL 90 DAY
SETTINGS index_granularity = 8192;

CREATE INDEX IF NOT EXISTS idx_action ON audit_logs(action) TYPE bloom_filter GRANULARITY 1;
CREATE INDEX IF NOT EXISTS idx_resource ON audit_logs(resource_type) TYPE bloom_filter GRANULARITY 1;
`;

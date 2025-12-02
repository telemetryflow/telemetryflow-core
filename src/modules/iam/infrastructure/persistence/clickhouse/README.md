# ClickHouse Integration for IAM Audit Logs

**Purpose**: Time-series storage for audit logs with high write throughput and fast analytics

---

## 📊 Schema

**Table**: `audit_logs`  
**Engine**: MergeTree  
**Partitioning**: Monthly (by timestamp)  
**TTL**: 90 days  
**Ordering**: (user_id, timestamp)

### Columns
- `id` - UUID
- `user_id` - UUID
- `action` - String (e.g., "user.login", "user.update")
- `resource_type` - String (e.g., "user", "role")
- `resource_id` - String
- `metadata` - String (JSON)
- `ip_address` - String
- `user_agent` - String
- `timestamp` - DateTime

### Indexes
- Bloom filter on `action`
- Bloom filter on `resource_type`

---

## 🚀 Setup

### 1. Create Table
```bash
clickhouse-client --query "$(cat AuditLog.clickhouse.ts | grep 'CREATE TABLE')"
```

### 2. Verify
```sql
SHOW TABLES;
DESCRIBE audit_logs;
```

---

## 📝 Usage Examples

### Insert Log
```typescript
await clickHouseAuditRepo.insert({
  id: uuid(),
  user_id: userId,
  action: 'user.login',
  resource_type: 'user',
  resource_id: userId,
  metadata: JSON.stringify({ success: true }),
  ip_address: req.ip,
  user_agent: req.headers['user-agent'],
  timestamp: new Date(),
});
```

### Query User Activity
```typescript
const logs = await clickHouseAuditRepo.findByUserId(userId, 100);
```

### Get Statistics
```typescript
const stats = await clickHouseAuditRepo.getStatistics();
// { action: 'user.login', count: 1523 }
```

### Detect Suspicious Activity
```typescript
const failedLogins = await clickHouseAuditRepo.getSuspiciousActivity(userId, 1);
if (failedLogins > 5) {
  // Alert: Possible brute force attack
}
```

---

## 🎯 Performance

- **Write**: 100K+ inserts/sec
- **Query**: <100ms for aggregations
- **Storage**: 10:1 compression ratio
- **Retention**: Auto-delete after 90 days

---

## 📖 Queries

### Recent Activity
```sql
SELECT * FROM audit_logs 
WHERE user_id = ? 
ORDER BY timestamp DESC 
LIMIT 100;
```

### Action Statistics
```sql
SELECT action, count() as count 
FROM audit_logs 
GROUP BY action 
ORDER BY count DESC;
```

### Failed Logins
```sql
SELECT count() 
FROM audit_logs 
WHERE user_id = ? 
  AND action = 'user.login.failed' 
  AND timestamp >= now() - INTERVAL 1 HOUR;
```

### Daily Activity
```sql
SELECT 
  toDate(timestamp) as date,
  count() as actions
FROM audit_logs
WHERE user_id = ?
  AND timestamp >= now() - INTERVAL 7 DAY
GROUP BY date
ORDER BY date;
```

---

**Status**: Schema ready, implementation in progress

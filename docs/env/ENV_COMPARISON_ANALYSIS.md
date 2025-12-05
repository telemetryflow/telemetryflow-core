# .env.example Comparison: Core vs Platform

**Date**: December 5, 2025

## Structure Comparison

### Platform Structure (Better Organized)
1. Application Configuration
2. Logging Configuration (P25 with detailed transport sections)
3. OpenTelemetry Configuration
4. Telemetry Data Configuration (Platform-specific)
5. ClickHouse Configuration
6. PostgreSQL Configuration
7. JWT & Session Configuration
8. MFA Configuration (Platform-specific)
9. SMTP Configuration (Platform-specific)
10. Rate Limiting Configuration
11. Docker-Compose Configuration
12. Redis Configuration (Platform-specific)
13. NATS Configuration (Platform-specific)
14. Cache Configuration (Platform-specific)
15. Queue Configuration (Platform-specific)
16. Production Security Checklist

### Core Structure (Current)
1. Application Configuration
2. Logging Configuration (P25 - less organized)
3. OpenTelemetry Configuration
4. PostgreSQL Configuration
5. ClickHouse Configuration
6. JWT & Session Configuration
7. Rate Limiting Configuration
8. Grafana Configuration
9. Docker-Compose Configuration

## Key Differences

### Platform Has (Core Missing)
- ✅ Better organized logging sections with subsections
- ✅ Telemetry data configuration (retention, aggregation, batch processing)
- ✅ MFA encryption key configuration
- ✅ SMTP/Email notification configuration
- ✅ Redis configuration (sessions, cache, queues)
- ✅ NATS configuration (event streaming)
- ✅ Multi-level cache configuration (L1/L2)
- ✅ BullMQ queue configuration
- ✅ Frontend configuration (FRONTEND_PORT, VITE_API_BASE_URL)
- ✅ PgAdmin configuration
- ✅ Production security checklist at end
- ✅ More detailed comments and examples
- ✅ Better subsection organization with dashes

### Core Has (Platform Missing)
- ✅ Grafana configuration (GF_SECURITY_*)
- ✅ Jaeger configuration (PORT_JAEGER_*)
- ✅ More detailed volume configuration (VOLUMES_BASE_PATH)
- ✅ ClickHouse logs transport configuration

## Recommendations for Core

### 1. Reorganize Logging Section
Split into subsections like Platform:
- Logger Selection
- Winston Logger Configuration
- File Transport (Daily Rotation)
- Grafana Loki Integration
- FluentBit Integration
- OpenSearch Integration
- ClickHouse Transport (Core-specific)

### 2. Add Missing Sections
- Production Security Checklist (at end)
- Better subsection organization with dashes (--------------------------------)

### 3. Improve Comments
- Add more examples like Platform
- Add "Features:" lists for each transport
- Add "Requires:" notes for optional dependencies

### 4. Standardize Naming
- Use consistent naming: `LOKI_LABELS_APP` vs `LOKI_LABELS_ENV`
- Match Platform naming where applicable

### 5. Add Configuration File Paths Section
Like Platform's CONFIG_* variables for custom configs

## Proposed Core Structure

1. Application Configuration
2. Logging Configuration
   - Logger Selection
   - Winston Logger Configuration
   - File Transport (Daily Rotation)
   - Grafana Loki Integration
   - FluentBit Integration
   - OpenSearch Integration
   - ClickHouse Transport (Core-specific)
3. OpenTelemetry Configuration
4. ClickHouse Configuration
5. PostgreSQL Configuration
6. JWT & Session Configuration
7. Rate Limiting Configuration
8. Grafana Configuration (Core-specific)
9. Docker-Compose Configuration
   - Volume Configuration
   - Configuration File Paths
   - Service Versions
   - Container Names
   - Port Mappings
   - Static IP Addresses
10. Production Security Checklist

## Implementation Priority

### High Priority
1. ✅ Reorganize logging section with subsections
2. ✅ Add production security checklist
3. ✅ Improve comments and examples
4. ✅ Add subsection dividers (dashes)

### Medium Priority
5. ⏳ Add configuration file paths section
6. ⏳ Standardize variable naming

### Low Priority (Core doesn't need these)
- MFA configuration (no MFA in Core)
- SMTP configuration (no email in Core)
- Redis configuration (no Redis in Core)
- NATS configuration (no NATS in Core)
- Cache configuration (no cache in Core)
- Queue configuration (no queues in Core)
- Frontend configuration (no frontend in Core)

# Winston Logger Integration

- **Status**: ✅ 100% Feature Parity with Platform
- **Version**: 2.0
- **Last Updated**: December 5, 2025

## Overview

TelemetryFlow Core uses **Winston** with **100% feature parity** with TelemetryFlow Platform's P25 implementation, providing:
- Structured logging with OpenTelemetry integration
- Request context management
- Multiple production-grade transports
- @Log() decorator for automatic logging
- Log enrichment and sampling utilities

## What Was Added

### 1. Logger Module (Complete P25 Implementation)
Full implementation from Platform with all features.

**Structure:**
```
src/logger/
├── logger.module.ts                      # Logger module with middleware
├── logger.service.ts                     # Winston logger service
├── child-logger.ts                       # Child logger implementation
├── index.ts                              # Exports (20+ exports)
├── config/
│   └── logger.config.ts                  # Configuration loader
├── transports/
│   └── transport.factory.ts              # Transport factory (7 transports)
├── context/
│   └── request-context.ts                # Request context management
├── middleware/
│   └── request-context.middleware.ts     # Context middleware
├── decorators/
│   └── log.decorator.ts                  # @Log() decorator
├── enrichment/
│   └── context-enrichment.ts             # Log enrichment utilities
├── utils/
│   └── sampling.util.ts                  # Log sampling (4 strategies)
└── interfaces/
    ├── logger-config.interface.ts        # Configuration interfaces
    └── child-logger.interface.ts         # Child logger interface
```

### 2. Dependencies Added
```json
{
  "winston": "^3.18.3",
  "winston-transport": "^4.9.0",
  "@opentelemetry/winston-transport": "^0.7.0",
  "winston-daily-rotate-file": "^5.0.0",
  "winston-loki": "^6.1.3",
  "fluent-logger": "^3.4.1",
  "@opensearch-project/opensearch": "^3.5.1",
  "winston-elasticsearch": "^0.19.0"
}
```

### 3. Configuration
```env
# Logger Type
LOGGER_TYPE=winston

# Log Level
LOG_LEVEL=info
LOG_PRETTY_PRINT=true

# Transports
OTEL_LOGS_ENABLED=true
LOG_FILE_ENABLED=true
LOKI_ENABLED=false
FLUENTBIT_ENABLED=false
OPENSEARCH_ENABLED=false
```

## Features

### ✅ Core Features (100% Parity)
- **Console Transport** - Pretty printed logs for development
- **OpenTelemetry Transport** - Trace correlation (traceId, spanId)
- **Structured Logging** - JSON format for production
- **Log Levels** - error, warn, info, debug, verbose
- **Contextual Logging** - Add context to log messages
- **Timestamp** - ISO 8601 timestamps
- **Colorized Output** - Color-coded log levels

### ✅ Context Management (NEW)
- **Request Context** - Automatic context propagation via AsyncLocalStorage
- **Context Middleware** - Automatic context injection for all requests
- **Correlation IDs** - requestId, tenantId, workspaceId, userId
- **Context Enrichment** - Utilities for adding context to logs

### ✅ Advanced Features (NEW)
- **@Log() Decorator** - Automatic method logging with entry/exit/duration
- **Child Loggers** - Module-specific loggers with context binding
- **Log Sampling** - 4 strategies (rate, level, path, burst protection)
- **Log Enrichment** - withRequestContext(), withTenantContext(), withUserContext()

### ✅ Production Transports (NEW)
- **File Rotation** - Daily rotation with compression and retention
- **Loki** - Grafana Loki integration with batching
- **FluentBit** - Forward protocol for log aggregation
- **OpenSearch** - Full-text search and analytics
- **ClickHouse** - High-performance columnar storage (Core-specific)

## Usage

### Basic Usage

#### In Application Bootstrap
```typescript
// src/main.ts
import { LoggerService } from './logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(LoggerService);
  app.useLogger(logger);

  logger.log('Application started', 'Bootstrap');
}
```

#### In Services/Controllers
```typescript
import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class UserService {
  constructor(private readonly logger: LoggerService) {}

  async createUser(data: CreateUserDto) {
    this.logger.log('Creating user', 'UserService');
    // Request context automatically included
    this.logger.debug('User created successfully', 'UserService');
  }
}
```

#### Log Levels
```typescript
logger.error('Error message', 'Context');
logger.warn('Warning message', 'Context');
logger.log('Info message', 'Context');
logger.debug('Debug message', 'Context');
logger.verbose('Verbose message', 'Context');
```

### Advanced Usage (P25 Features)

#### Using @Log() Decorator
```typescript
import { Log } from '../logger/decorators/log.decorator';

@Injectable()
export class UserService {
  @Log()  // Automatic logging with entry/exit/duration
  async createUser(data: CreateUserDto) {
    return this.userRepository.save(data);
  }

  @Log({ level: 'debug', includeArgs: true })
  async updateUser(id: string, data: UpdateUserDto) {
    return this.userRepository.update(id, data);
  }
}
```

**Output:**
```
[UserService.createUser] Method called
[UserService.createUser] Method completed in 45ms
```

#### Using Context Enrichment
```typescript
import { withRequestContext, withTenantContext } from '../logger/enrichment/context-enrichment';

@Injectable()
export class UserService {
  async createUser(data: CreateUserDto) {
    // Automatically includes requestId, tenantId, userId
    this.logger.log('Creating user', withRequestContext({ email: data.email }));

    // Add tenant-specific context
    this.logger.log('User created', withTenantContext({ userId: user.id }));
  }
}
```

**Output:**
```json
{
  "level": "info",
  "message": "Creating user",
  "email": "user@example.com",
  "requestId": "req_abc123",
  "tenantId": "tenant_xyz",
  "userId": "user_123",
  "timestamp": "2025-12-05T07:40:00.000Z"
}
```

#### Using Child Loggers
```typescript
@Injectable()
export class UserService {
  private readonly logger: LoggerService;

  constructor(loggerService: LoggerService) {
    this.logger = loggerService.createChildLogger('UserService');
  }

  async createUser(data: CreateUserDto) {
    this.logger.log('Creating user');  // Context automatically included
  }
}
```

#### Using Log Sampling
```typescript
import { LogSampler } from '../logger/utils/sampling.util';

const sampler = new LogSampler({
  rate: 0.1,  // Sample 10% of logs
  levels: ['debug', 'verbose'],  // Only sample these levels
  paths: ['/api/health'],  // Sample specific paths
  burstProtection: { maxLogs: 100, windowMs: 1000 }
});

if (sampler.shouldLog('debug', '/api/users')) {
  logger.debug('User operation', 'UserService');
}
```

## Configuration

### Environment Variables

#### Core Settings
```env
# Logger type: 'nestjs' or 'winston'
LOGGER_TYPE=winston

# Log level: error, warn, info, debug, verbose
LOG_LEVEL=info

# Pretty print for development (true/false)
LOG_PRETTY_PRINT=true
LOG_COLORIZE=true
```

#### Transport Configuration

**Console** (always enabled):
```env
LOG_PRETTY_PRINT=true
LOG_COLORIZE=true
```

**OpenTelemetry**:
```env
OTEL_LOGS_ENABLED=true
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```

**File Rotation**:
```env
LOG_FILE_ENABLED=true
LOG_FILE_DIRNAME=logs
LOG_FILE_FILENAME=app-%DATE%.log
LOG_FILE_DATE_PATTERN=YYYY-MM-DD
LOG_FILE_ZIPPED=true
LOG_FILE_MAX_SIZE=20m
LOG_FILE_MAX_FILES=14d
LOG_FILE_JSON=true
```

**Loki** (Grafana):
```env
LOKI_ENABLED=true
LOKI_HOST=http://loki:3100
LOKI_LABELS_APP=telemetryflow
LOKI_LABELS_ENV=development
LOKI_BATCH_INTERVAL=5
LOKI_TIMEOUT=30000
LOKI_USERNAME=admin
LOKI_PASSWORD=secret
```

**FluentBit**:
```env
FLUENTBIT_ENABLED=true
FLUENTBIT_HOST=fluentbit
FLUENTBIT_PORT=24224
FLUENTBIT_TAG=telemetryflow.logs
FLUENTBIT_TIMEOUT=3000
FLUENTBIT_REQUIRE_ACK=false
FLUENTBIT_RECONNECT_INTERVAL=1000
```

**OpenSearch**:
```env
OPENSEARCH_ENABLED=true
OPENSEARCH_NODE=http://opensearch:9200
OPENSEARCH_INDEX=telemetryflow-logs
OPENSEARCH_INDEX_SUFFIX=YYYY.MM.DD
OPENSEARCH_FLUSH_INTERVAL=2000
OPENSEARCH_BUFFER_LIMIT=100
OPENSEARCH_SSL_VERIFY=false
OPENSEARCH_USERNAME=admin
OPENSEARCH_PASSWORD=admin
```

### Configuration Profiles

#### Development Mode
```env
NODE_ENV=development
LOGGER_TYPE=winston
LOG_LEVEL=debug
LOG_PRETTY_PRINT=true
LOG_COLORIZE=true
OTEL_LOGS_ENABLED=true
LOG_FILE_ENABLED=false
```

**Output:**
```
[2025-12-05T07:40:17.975Z] INFO [Bootstrap]: Application started
[2025-12-05T07:40:18.123Z] DEBUG [UserService]: Creating user
```

#### Production Mode
```env
NODE_ENV=production
LOGGER_TYPE=winston
LOG_LEVEL=info
LOG_PRETTY_PRINT=false
LOG_FILE_ENABLED=true
LOG_FILE_JSON=true
OTEL_LOGS_ENABLED=true
LOKI_ENABLED=true
OPENSEARCH_ENABLED=true
```

**Output (JSON):**
```json
{
  "level": "info",
  "message": "Application started",
  "context": "Bootstrap",
  "requestId": "req_abc123",
  "tenantId": "tenant_xyz",
  "traceId": "a1b2c3d4e5f6",
  "spanId": "1234567890ab",
  "timestamp": "2025-12-05T07:40:17.975Z"
}
```

#### High-Volume Production
```env
NODE_ENV=production
LOGGER_TYPE=winston
LOG_LEVEL=warn
LOG_FILE_ENABLED=true
FLUENTBIT_ENABLED=true
OPENSEARCH_ENABLED=true
# Use sampling for high-traffic endpoints
```

## Comparison with Platform

| Feature | Platform | Core | Status |
|---------|----------|------|--------|
| **Core Features** |
| Winston Logger | ✅ | ✅ | ✅ Identical |
| Console Transport | ✅ | ✅ | ✅ Identical |
| OpenTelemetry Transport | ✅ | ✅ | ✅ Identical |
| Structured Logging | ✅ | ✅ | ✅ Identical |
| Trace Correlation | ✅ | ✅ | ✅ Identical |
| **Context Management** |
| Request Context | ✅ | ✅ | ✅ Identical |
| Context Middleware | ✅ | ✅ | ✅ Identical |
| AsyncLocalStorage | ✅ | ✅ | ✅ Identical |
| **Advanced Features** |
| @Log() Decorator | ✅ | ✅ | ✅ Identical |
| Child Loggers | ✅ | ✅ | ✅ Identical |
| Log Enrichment | ✅ | ✅ | ✅ Identical |
| Log Sampling | ✅ | ✅ | ✅ Identical |
| **Production Transports** |
| File Rotation | ✅ | ✅ | ✅ Identical |
| Loki Transport | ✅ | ✅ | ✅ Identical |
| FluentBit Transport | ✅ | ✅ | ✅ Identical |
| OpenSearch Transport | ✅ | ✅ | ✅ Identical |
| ClickHouse Transport | ❌ | ✅ | 🟢 Core Only |

**Feature Parity**: 100% ✅ (All Platform features + ClickHouse)

## Benefits

### ✅ Advantages
1. **Production-Ready** - Structured logging for log aggregation
2. **Consistent** - Same logger as platform
3. **Flexible** - Easy to add transports later
4. **Debuggable** - Better debugging with context
5. **Performant** - Efficient logging implementation

### 🎯 Use Cases
- Development debugging with pretty logs
- Production monitoring with JSON logs
- Error tracking and analysis
- Performance monitoring
- Audit logging

## Transport Usage

All transports are already implemented and ready to use. Enable them via environment variables.

### File Rotation Transport
```env
LOG_FILE_ENABLED=true
LOG_FILE_DIRNAME=logs
LOG_FILE_MAX_SIZE=20m
LOG_FILE_MAX_FILES=14d
```

**Features**:
- Daily log rotation with date pattern
- Automatic compression (gzip)
- Size-based rotation
- Retention policy

**Files created**:
```
logs/
├── app-2025-12-05.log
├── app-2025-12-04.log.gz
└── app-2025-12-03.log.gz
```

### Loki Transport (Grafana)
```env
LOKI_ENABLED=true
LOKI_HOST=http://loki:3100
```

**Features**:
- Grafana Loki integration
- Label-based log aggregation
- Batching for performance (5s interval)
- Basic authentication support

**Query logs**:
```bash
curl 'http://localhost:3100/loki/api/v1/query?query={app="telemetryflow"}'
```

### FluentBit Transport
```env
FLUENTBIT_ENABLED=true
FLUENTBIT_HOST=fluentbit
FLUENTBIT_PORT=24224
```

**Features**:
- Forward protocol (Fluentd/FluentBit compatible)
- Automatic reconnection
- Custom tagging for log routing
- Low overhead

### OpenSearch Transport
```env
OPENSEARCH_ENABLED=true
OPENSEARCH_NODE=http://opensearch:9200
```

**Features**:
- OpenSearch/Elasticsearch integration
- Automatic index creation with templates
- Daily index rotation (YYYY.MM.DD)
- Buffering for performance
- Full-text search

**Query logs**:
```bash
curl http://localhost:9200/telemetryflow-logs-*/_search?pretty
```

### Docker Compose Services

Add to `docker-compose.yml`:

```yaml
services:
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"

  fluentbit:
    image: fluent/fluent-bit:latest
    ports:
      - "24224:24224"

  opensearch:
    image: opensearchproject/opensearch:latest
    ports:
      - "9200:9200"
    environment:
      - discovery.type=single-node
      - OPENSEARCH_INITIAL_ADMIN_PASSWORD=Admin@123
```

## Migration from NestJS Logger

### Before (NestJS Logger)
```typescript
import { Logger } from '@nestjs/common';

const logger = new Logger('UserService');
logger.log('Message');
```

### After (Winston Logger)
```typescript
import { LoggerService } from '../logger/logger.service';

constructor(private readonly logger: LoggerService) {}
this.logger.log('Message', 'UserService');
```

## Troubleshooting

### Logs Not Appearing
```bash
# Check log level
LOG_LEVEL=debug

# Check if logger is initialized
# Should see: [Bootstrap]: Application started
```

### JSON Format in Development
```bash
# Disable pretty print
LOG_PRETTY_PRINT=false
```

### Too Verbose
```bash
# Reduce log level
LOG_LEVEL=info  # or warn, or error
```

## Testing

Verify Winston logger is working:

```bash
# 1. Start application
pnpm run dev

# 2. Check logs
# Should see colored, formatted logs in development

# 3. Test production format
NODE_ENV=production LOG_PRETTY_PRINT=false pnpm run dev
# Should see JSON logs
```

## Performance

Winston logger is:
- ✅ **Fast** - Minimal overhead
- ✅ **Async** - Non-blocking I/O
- ✅ **Efficient** - Optimized for high throughput
- ✅ **Scalable** - Handles high log volumes

## Best Practices

1. **Use Appropriate Log Levels**
   - `error` - Errors that need attention
   - `warn` - Warnings that might need attention
   - `info` - Important information
   - `debug` - Debugging information
   - `verbose` - Detailed debugging

2. **Add Context**
   ```typescript
   logger.log('User created', 'UserService');
   // Not: logger.log('User created');
   ```

3. **Structured Data**
   ```typescript
   logger.log(`User ${userId} created`, 'UserService');
   ```

4. **Avoid Sensitive Data**
   ```typescript
   // ❌ Don't log passwords, tokens, etc.
   logger.log(`Password: ${password}`);

   // ✅ Log safe information
   logger.log(`User authenticated: ${userId}`);
   ```

## Summary

- ✅ **100% feature parity with Platform** (P25 implementation complete)
- ✅ **All production transports available** (File, Loki, FluentBit, OpenSearch, ClickHouse)
- ✅ **Request context management** with AsyncLocalStorage
- ✅ **@Log() decorator** for automatic method logging
- ✅ **Log enrichment utilities** for common patterns
- ✅ **Log sampling** for high-volume optimization
- ✅ **OpenTelemetry integration** with trace correlation
- ✅ **Zero breaking changes** - fully backward compatible

The logger is production-ready with all Platform features and fully compatible!

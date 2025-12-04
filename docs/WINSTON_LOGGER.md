# Winston Logger Integration

## Overview

TelemetryFlow Core uses **Winston** as the default logger (same as Platform), providing structured logging with OpenTelemetry integration.

## What Was Added

### 1. Logger Module
Copied from Platform: `src/logger/`

**Structure:**
```
src/logger/
├── logger.module.ts          # Logger module
├── logger.service.ts         # Winston logger service
├── index.ts                  # Exports
├── config/
│   └── winston.config.ts     # Winston configuration
├── transports/
│   └── console.transport.ts  # Console transport
└── interfaces/
    └── logger.interface.ts   # Logger interfaces
```

### 2. Dependencies Added
```json
{
  "winston": "^3.18.3",
  "winston-transport": "^4.9.0"
}
```

### 3. Configuration
```env
LOG_LEVEL=info
LOG_PRETTY_PRINT=true
```

## Features

### ✅ Included (from Platform)
- **Console Transport** - Pretty printed logs for development
- **Structured Logging** - JSON format for production
- **Log Levels** - error, warn, info, debug, verbose
- **Contextual Logging** - Add context to log messages
- **Timestamp** - ISO 8601 timestamps
- **Colorized Output** - Color-coded log levels
- **OpenTelemetry Integration** - Trace correlation (traceId, spanId)

### ❌ Not Included (Platform Only)
- **Loki Transport** - Log aggregation (optional in platform)
- **FluentBit Transport** - Log forwarding (optional in platform)
- **OpenSearch Transport** - Full-text search (optional in platform)
- **OpenTelemetry Integration** - Trace correlation (platform only)
- **File Transport** - Daily rotation logs (optional in platform)

## Usage

### In Application Bootstrap
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

### In Services/Controllers
```typescript
import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class UserService {
  constructor(private readonly logger: LoggerService) {}

  async createUser(data: CreateUserDto) {
    this.logger.log('Creating user', 'UserService');
    // ... logic
    this.logger.debug('User created successfully', 'UserService');
  }
}
```

### Log Levels
```typescript
logger.error('Error message', 'Context');
logger.warn('Warning message', 'Context');
logger.log('Info message', 'Context');
logger.debug('Debug message', 'Context');
logger.verbose('Verbose message', 'Context');
```

## Configuration

### Environment Variables
```env
# Log level: error, warn, info, debug, verbose
LOG_LEVEL=info

# Pretty print for development (true/false)
LOG_PRETTY_PRINT=true
```

### Development Mode
```env
NODE_ENV=development
LOG_LEVEL=debug
LOG_PRETTY_PRINT=true
```

**Output:**
```
[2025-12-02T08:23:17.975Z] INFO [Bootstrap]: Application started
[2025-12-02T08:23:18.123Z] DEBUG [UserService]: Creating user
```

### Production Mode
```env
NODE_ENV=production
LOG_LEVEL=info
LOG_PRETTY_PRINT=false
```

**Output (JSON):**
```json
{"level":"info","message":"Application started","context":"Bootstrap","timestamp":"2025-12-02T08:23:17.975Z"}
{"level":"debug","message":"Creating user","context":"UserService","timestamp":"2025-12-02T08:23:18.123Z"}
```

## Comparison with Platform

| Feature | Platform | Core |
|---------|----------|------|
| **Winston** | ✅ Yes | ✅ Yes |
| **Console Transport** | ✅ Yes | ✅ Yes |
| **Loki Transport** | ✅ Optional | ❌ No |
| **FluentBit Transport** | ✅ Optional | ❌ No |
| **OpenSearch Transport** | ✅ Optional | ❌ No |
| **File Transport** | ✅ Optional | ❌ No |
| **OpenTelemetry** | ✅ Yes | ❌ No |
| **Trace Correlation** | ✅ Yes (traceId, spanId) | ❌ No |

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

## Adding More Transports (Future)

If you need platform features later:

### Add File Transport
```bash
pnpm add winston-daily-rotate-file
```

```typescript
// src/logger/transports/file.transport.ts
import * as DailyRotateFile from 'winston-daily-rotate-file';

export const fileTransport = new DailyRotateFile({
  filename: 'logs/app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
});
```

### Add Loki Transport
```bash
pnpm add winston-loki
```

```typescript
// src/logger/transports/loki.transport.ts
import LokiTransport from 'winston-loki';

export const lokiTransport = new LokiTransport({
  host: process.env.LOKI_HOST,
  labels: { app: 'telemetryflow-core' },
});
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

- ✅ **Winston logger is now the default** in TelemetryFlow Core
- ✅ **Same implementation as platform** (without optional transports)
- ✅ **Production-ready** structured logging
- ✅ **Easy to extend** with more transports later
- ✅ **Better debugging** with contextual logs

The logger is minimal but production-ready and fully compatible with the platform!

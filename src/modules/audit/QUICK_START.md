# Audit Module - Quick Start

## Import

```typescript
import { AuditService, AuditEventType, AuditEventResult } from '@/modules/audit';
```

## Inject

```typescript
constructor(private readonly auditService: AuditService) {}
```

## Usage

### Authentication Events

```typescript
// Login success
await this.auditService.logAuth('login', AuditEventResult.SUCCESS, {
  userId: user.id,
  userEmail: user.email,
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
});

// Login failure
await this.auditService.logAuth('login', AuditEventResult.FAILURE, {
  userEmail: email,
  ipAddress: req.ip,
  errorMessage: 'Invalid credentials',
});

// Logout
await this.auditService.logAuth('logout', AuditEventResult.SUCCESS, {
  userId: user.id,
});
```

### Authorization Events

```typescript
// Access granted
await this.auditService.logAuthz('access_resource', AuditEventResult.SUCCESS, {
  userId: user.id,
  resource: '/api/users',
});

// Access denied
await this.auditService.logAuthz('access_denied', AuditEventResult.DENIED, {
  userId: user.id,
  resource: '/api/admin',
  errorMessage: 'Insufficient permissions',
});
```

### Data Operations

```typescript
// Create
await this.auditService.logData('create_user', AuditEventResult.SUCCESS, {
  userId: admin.id,
  resource: 'users',
  metadata: { targetUserId: newUser.id },
});

// Update
await this.auditService.logData('update_user', AuditEventResult.SUCCESS, {
  userId: admin.id,
  resource: `users/${targetUser.id}`,
  metadata: { changes: ['email', 'role'] },
});

// Delete
await this.auditService.logData('delete_user', AuditEventResult.SUCCESS, {
  userId: admin.id,
  resource: `users/${targetUser.id}`,
});
```

### System Events

```typescript
// Startup
await this.auditService.logSystem('startup', AuditEventResult.SUCCESS);

// Configuration change
await this.auditService.logSystem('config_change', AuditEventResult.SUCCESS, {
  metadata: { setting: 'max_connections', oldValue: 100, newValue: 200 },
});

// Error
await this.auditService.logSystem('error', AuditEventResult.FAILURE, {
  errorMessage: error.message,
  metadata: { stack: error.stack },
});
```

## Event Types

- `AuditEventType.AUTH` - Authentication events
- `AuditEventType.AUTHZ` - Authorization events
- `AuditEventType.DATA` - Data modification events
- `AuditEventType.SYSTEM` - System events

## Event Results

- `AuditEventResult.SUCCESS` - Operation succeeded
- `AuditEventResult.FAILURE` - Operation failed (technical error)
- `AuditEventResult.DENIED` - Operation denied (authorization)

## Options

```typescript
interface CreateAuditLogOptions {
  userId?: string;              // User ID
  userEmail?: string;           // User email
  eventType: AuditEventType;    // Event type (required)
  action: string;               // Action name (required)
  resource?: string;            // Resource identifier
  result: AuditEventResult;     // Result (required)
  ipAddress?: string;           // Client IP
  userAgent?: string;           // User agent
  metadata?: Record<string, any>; // Additional data
  errorMessage?: string;        // Error message
  tenantId?: string;            // Tenant ID
  organizationId?: string;      // Organization ID
}
```

## Best Practices

1. **Always log authentication events** (login, logout, token refresh)
2. **Log authorization failures** (access denied, permission checks)
3. **Log sensitive data operations** (create, update, delete)
4. **Include context** (userId, ipAddress, resource)
5. **Don't log sensitive data** (passwords, tokens, PII)
6. **Use metadata for additional context** (structured data)
7. **Handle errors gracefully** (audit failures shouldn't block operations)

## Examples

### Login Flow

```typescript
async login(email: string, password: string, req: Request) {
  try {
    const user = await this.validateUser(email, password);
    
    await this.auditService.logAuth('login', AuditEventResult.SUCCESS, {
      userId: user.id,
      userEmail: user.email,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    
    return this.generateToken(user);
  } catch (error) {
    await this.auditService.logAuth('login', AuditEventResult.FAILURE, {
      userEmail: email,
      ipAddress: req.ip,
      errorMessage: error.message,
    });
    throw error;
  }
}
```

### Authorization Guard

```typescript
async canActivate(context: ExecutionContext): Promise<boolean> {
  const request = context.switchToHttp().getRequest();
  const user = request.user;
  const hasPermission = await this.checkPermission(user);
  
  if (!hasPermission) {
    await this.auditService.logAuthz('access_denied', AuditEventResult.DENIED, {
      userId: user.id,
      resource: request.url,
      errorMessage: 'Insufficient permissions',
    });
    return false;
  }
  
  await this.auditService.logAuthz('access_granted', AuditEventResult.SUCCESS, {
    userId: user.id,
    resource: request.url,
  });
  
  return true;
}
```

### CRUD Operations

```typescript
async createUser(dto: CreateUserDto, admin: User) {
  try {
    const user = await this.userRepository.save(dto);
    
    await this.auditService.logData('create_user', AuditEventResult.SUCCESS, {
      userId: admin.id,
      resource: 'users',
      metadata: {
        targetUserId: user.id,
        targetUserEmail: user.email,
      },
    });
    
    return user;
  } catch (error) {
    await this.auditService.logData('create_user', AuditEventResult.FAILURE, {
      userId: admin.id,
      resource: 'users',
      errorMessage: error.message,
    });
    throw error;
  }
}
```

## See Also

- [Full Documentation](./README.md)
- [Implementation Guide](../../../docs/AUDIT_MODULE.md)
- [ClickHouse Configuration](../../../config/clickhouse/README.md)

# API Key Service

The `ApiKeyService` provides a high-level interface for managing API keys programmatically. It wraps the CQRS command/query handlers to provide a simpler API for other modules.

## Features

- **API Key Creation**: Create new API keys with permissions and scopes
- **API Key Validation**: Validate raw API key secrets
- **API Key Rotation**: Generate new secrets for existing keys
- **API Key Revocation**: Soft delete API keys
- **Permission Management**: Check and manage API key permissions
- **Scope Management**: Define and validate API key scopes
- **Usage Tracking**: Record API key usage with IP addresses

## Usage

### Injecting the Service

```typescript
import { ApiKeyService, API_KEY_SERVICE } from "@/modules/api-keys";

@Injectable()
export class YourService {
  constructor(
    @Inject(API_KEY_SERVICE)
    private readonly apiKeyService: ApiKeyService,
  ) {}
}
```

### Creating an API Key

```typescript
const result = await this.apiKeyService.createApiKey({
  name: "Production API Key",
  description: "API key for production environment",
  keyType: "secret",
  permissions: ["telemetry:write", "telemetry:read"],
  scopes: ["telemetry"],
  rateLimit: 1000,
  organizationId: "org-123",
  createdBy: "user-123",
});

// result contains:
// - apiKey: The domain object
// - rawApiKeyId: The public key ID (tfk_...)
// - rawApiKeySecret: The secret key (tfs_...) - ONLY SHOWN ONCE
// - rawEncryptKey: The encryption key - ONLY SHOWN ONCE
```

### Validating an API Key

```typescript
const apiKey = await this.apiKeyService.validateApiKey(rawKeySecret);

if (apiKey) {
  // Key is valid and active
  console.log("API Key:", apiKey.getName());
  console.log("Permissions:", apiKey.getPermissions());
} else {
  // Key is invalid, inactive, or expired
  throw new UnauthorizedException("Invalid API key");
}
```

### Rotating an API Key

```typescript
const result = await this.apiKeyService.rotateApiKey(
  "key-123",
  "org-123",
  "user-123",
);

// result contains:
// - apiKey: The updated domain object
// - rawApiKeySecret: The new secret key - ONLY SHOWN ONCE
// - rawEncryptKey: The new encryption key - ONLY SHOWN ONCE
```

### Revoking an API Key

```typescript
await this.apiKeyService.revokeApiKey(
  "key-123",
  "user-123",
  "Security breach detected",
);
```

### Checking Permissions

```typescript
const hasPermission = await this.apiKeyService.hasPermission(
  "key-123",
  "telemetry:write",
);

if (hasPermission) {
  // Allow the operation
} else {
  throw new ForbiddenException("Insufficient permissions");
}
```

### Recording Usage

```typescript
await this.apiKeyService.recordUsage("key-123", "192.168.1.1");
```

### Listing API Keys

```typescript
const result = await this.apiKeyService.listApiKeys("org-123", {
  page: 1,
  pageSize: 20,
  isActive: true,
  keyType: "secret",
  search: "production",
});

console.log("Total keys:", result.total);
console.log("Keys:", result.items);
```

## Integration with OrganizationService

The `OrganizationService` uses the `ApiKeyService` to create default API keys during user registration:

```typescript
// In OrganizationService
async createDefaultApiKeys(
  organizationId: string,
  createdBy: string,
): Promise<DefaultApiKeys> {
  // Create TELEMETRYFLOW_API_KEY_ID
  const apiKeyIdResult = await this.apiKeyService.createApiKey({
    name: 'TELEMETRYFLOW_API_KEY_ID',
    description: 'Default API Key ID for telemetry ingestion',
    keyType: 'secret',
    permissions: ['telemetry:write', 'telemetry:read'],
    scopes: ['telemetry'],
    organizationId,
    createdBy,
  });

  // Create TELEMETRYFLOW_API_KEY_SECRET
  const apiKeySecretResult = await this.apiKeyService.createApiKey({
    name: 'TELEMETRYFLOW_API_KEY_SECRET',
    description: 'Default API Key Secret for telemetry ingestion',
    keyType: 'secret',
    permissions: ['telemetry:write', 'telemetry:read'],
    scopes: ['telemetry'],
    organizationId,
    createdBy,
  });

  return {
    apiKeyId: apiKeyIdResult.rawApiKeyId,
    apiKeySecret: apiKeySecretResult.rawApiKeySecret,
    encryptionKey: apiKeyIdResult.rawEncryptKey,
  };
}
```

## Security Considerations

### Key Storage

- **Raw Keys**: Never store raw API key secrets. They are only returned once at creation/rotation.
- **Hashed Keys**: The service stores SHA-256 hashes of API key secrets.
- **Encryption Keys**: Per-key encryption keys are encrypted using the platform's master encryption key.

### Key Types

- **test**: For testing and development
- **secret**: For production use with sensitive operations
- **standard**: For general API access
- **service**: For service-to-service communication

### Permissions

Permissions follow the format `resource:action`:

- `telemetry:read` - Read telemetry data
- `telemetry:write` - Write telemetry data
- `metrics:read` - Read metrics
- `logs:write` - Write logs
- `*` - Wildcard permission (all permissions)

Permissions support wildcards:

- `telemetry:*` - All telemetry operations
- `*:read` - Read all resources

### Scopes

Scopes define the boundaries of API key access:

- `telemetry` - Telemetry data
- `metrics` - Metrics data
- `logs` - Log data
- `traces` - Trace data
- `agents` - Agent management
- `collector` - Collector operations

## Testing

The service includes comprehensive unit tests. Run them with:

```bash
npm test -- api-keys/infrastructure/services/__tests__/ApiKey.service.spec.ts
```

## Architecture

The `ApiKeyService` follows the DDD/CQRS pattern:

```
ApiKeyService (Application Service)
    ↓
CommandBus / QueryBus (CQRS)
    ↓
Command/Query Handlers (Application Layer)
    ↓
ApiKey Aggregate (Domain Layer)
    ↓
ApiKeyRepository (Infrastructure Layer)
    ↓
Database
```

This architecture provides:

- **Separation of Concerns**: Clear boundaries between layers
- **Testability**: Easy to mock and test
- **Maintainability**: Changes are isolated to specific layers
- **Scalability**: Can be extended without modifying existing code

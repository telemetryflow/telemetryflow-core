# Secret Generation

## Overview

TelemetryFlow Core includes a secure secret generator for JWT and Session secrets.

## Usage

### Generate Secrets

```bash
# Default (32 bytes, base64)
pnpm run generate:secrets

# Custom length
node scripts/generate-secrets.js --length 64

# Hex format
node scripts/generate-secrets.js --format hex

# Base64 URL-safe
node scripts/generate-secrets.js --format base64url
```

### Output

```
🔐 TelemetryFlow Core - Secret Generator
=========================================
Length: 32 bytes | Format: base64

Generated Secrets:
------------------

JWT_SECRET:
  xK8vN2mP9qR4sT6uW8yZ0aB1cD3eF5gH7iJ9kL1mN3oP5qR7sT9uW1xY3zA5bC7d

SESSION_SECRET:
  yL9wO3nQ0rS5tU7vX9zA1bC3dE5fG7hI9jK1lM3nO5pQ7rS9tU1wX3yZ5aB7cD9e

.env Format:
------------
JWT_SECRET=xK8vN2mP9qR4sT6uW8yZ0aB1cD3eF5gH7iJ9kL1mN3oP5qR7sT9uW1xY3zA5bC7d
JWT_EXPIRES_IN=24h
SESSION_SECRET=yL9wO3nQ0rS5tU7vX9zA1bC3dE5fG7hI9jK1lM3nO5pQ7rS9tU1wX3yZ5aB7cD9e
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--length` | Length in bytes | 32 |
| `--format` | Output format | base64 |
| `--help` | Show help | - |

### Formats

- `base64` - Standard base64 encoding
- `hex` - Hexadecimal encoding
- `base64url` - URL-safe base64 (no +, /, =)

## Security Best Practices

### 1. Minimum Length
Always use at least 32 bytes (256 bits) for production secrets.

### 2. Never Commit Secrets
Add to `.gitignore`:
```
.env
.env.production
.env.local
```

### 3. Different Secrets Per Environment
```bash
# Development
node scripts/generate-secrets.js > .env.development

# Staging
node scripts/generate-secrets.js > .env.staging

# Production
node scripts/generate-secrets.js > .env.production
```

### 4. Rotate Regularly
Rotate secrets every 90 days:
```bash
# Generate new secrets
pnpm run generate:secrets

# Update .env
# Restart application
docker-compose restart backend
```

### 5. Use Secrets Manager
For production, use:
- AWS Secrets Manager
- HashiCorp Vault
- Azure Key Vault
- Google Secret Manager

## Docker Deployment

### Environment Variables
```bash
docker run -d \
  -e JWT_SECRET="your-generated-secret" \
  -e SESSION_SECRET="your-generated-secret" \
  telemetryflow-core:latest
```

### Docker Compose
```yaml
backend:
  environment:
    - JWT_SECRET=${JWT_SECRET}
    - SESSION_SECRET=${SESSION_SECRET}
```

### Docker Secrets
```bash
# Create secrets
echo "your-jwt-secret" | docker secret create jwt_secret -
echo "your-session-secret" | docker secret create session_secret -

# Use in compose
secrets:
  jwt_secret:
    external: true
  session_secret:
    external: true

services:
  backend:
    secrets:
      - jwt_secret
      - session_secret
```

## Kubernetes Deployment

### Create Secret
```bash
# Generate secrets
JWT_SECRET=$(node scripts/generate-secrets.js | grep "JWT_SECRET=" | cut -d= -f2)
SESSION_SECRET=$(node scripts/generate-secrets.js | grep "SESSION_SECRET=" | cut -d= -f2)

# Create Kubernetes secret
kubectl create secret generic telemetryflow-secrets \
  --from-literal=jwt-secret="$JWT_SECRET" \
  --from-literal=session-secret="$SESSION_SECRET"
```

### Use in Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: telemetryflow-core
spec:
  template:
    spec:
      containers:
      - name: backend
        env:
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: telemetryflow-secrets
              key: jwt-secret
        - name: SESSION_SECRET
          valueFrom:
            secretKeyRef:
              name: telemetryflow-secrets
              key: session-secret
```

## AWS Secrets Manager

### Store Secrets
```bash
# Generate secrets
JWT_SECRET=$(node scripts/generate-secrets.js | grep "JWT_SECRET=" | cut -d= -f2)
SESSION_SECRET=$(node scripts/generate-secrets.js | grep "SESSION_SECRET=" | cut -d= -f2)

# Store in AWS
aws secretsmanager create-secret \
  --name telemetryflow-core/jwt-secret \
  --secret-string "$JWT_SECRET"

aws secretsmanager create-secret \
  --name telemetryflow-core/session-secret \
  --secret-string "$SESSION_SECRET"
```

### Retrieve in Application
```typescript
import { SecretsManager } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManager({ region: 'us-east-1' });

const jwtSecret = await client.getSecretValue({
  SecretId: 'telemetryflow-core/jwt-secret'
});

process.env.JWT_SECRET = jwtSecret.SecretString;
```

## Troubleshooting

### Weak Secrets Warning
If you see a warning about weak secrets:
```bash
# Increase length
node scripts/generate-secrets.js --length 64
```

### Invalid Format
Supported formats: base64, hex, base64url
```bash
# Check format
node scripts/generate-secrets.js --format base64
```

### Permission Denied
Make script executable:
```bash
chmod +x scripts/generate-secrets.js
```

## Examples

### Quick Setup
```bash
# Generate and save
pnpm run generate:secrets > secrets.txt

# Copy to .env
cat secrets.txt | grep "JWT_SECRET=" >> .env
cat secrets.txt | grep "SESSION_SECRET=" >> .env

# Clean up
rm secrets.txt
```

### CI/CD Pipeline
```yaml
# GitHub Actions
- name: Generate Secrets
  run: |
    JWT_SECRET=$(node scripts/generate-secrets.js | grep "JWT_SECRET=" | cut -d= -f2)
    echo "::add-mask::$JWT_SECRET"
    echo "JWT_SECRET=$JWT_SECRET" >> $GITHUB_ENV
```

### Automated Rotation
```bash
#!/bin/bash
# rotate-secrets.sh

# Generate new secrets
NEW_JWT=$(node scripts/generate-secrets.js | grep "JWT_SECRET=" | cut -d= -f2)
NEW_SESSION=$(node scripts/generate-secrets.js | grep "SESSION_SECRET=" | cut -d= -f2)

# Update secrets manager
aws secretsmanager update-secret \
  --secret-id telemetryflow-core/jwt-secret \
  --secret-string "$NEW_JWT"

aws secretsmanager update-secret \
  --secret-id telemetryflow-core/session-secret \
  --secret-string "$NEW_SESSION"

# Restart application
kubectl rollout restart deployment/telemetryflow-core
```

## Summary

✅ **Cryptographically secure** random generation
✅ **Multiple formats** (base64, hex, base64url)
✅ **Configurable length** (minimum 32 bytes)
✅ **Production-ready** examples
✅ **Easy integration** with secrets managers

Generate secure secrets with: `pnpm run generate:secrets` 🔐

# IAM Module

**Version**: 1.0.0  
**Type**: Self-Contained DDD Module  
**Status**: Foundation Complete

---

## Module Overview

Complete Identity & Access Management module with:
- User management (Identity, Profile, MFA)
- Role-based access control (RBAC)
- Multi-tenancy (Region → Organization → Workspace → Tenant)
- Audit logging

---

## Database Schema

### Tables (8)
- `users` - User accounts with MFA
- `roles` - RBAC roles
- `user_roles` - User-role assignments
- `tenants` - Tenant isolation
- `organizations` - Top-level organizations
- `workspaces` - Workspace grouping
- `regions` - Geographic regions
- `audit_logs` - User activity tracking

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/users` | Create user |
| GET | `/users/:id` | Get user |
| POST | `/roles` | Create role |
| GET | `/roles` | List roles |
| POST | `/tenants` | Create tenant |
| GET | `/tenants` | List tenants |

---

## Module Commands

```bash
# Run migrations
pnpm migration:run

# Seed data
pnpm seed

# Run tests
pnpm test
```

---

## Multi-Tenancy Hierarchy

```
Region → Organization → Workspace → Tenant → Users
```

---

**Documentation**: See `docs/api/openapi.yaml`

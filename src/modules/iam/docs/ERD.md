# IAM Module - Entity Relationship Diagram

## Overview
This ERD represents the Identity and Access Management (IAM) module entities and their relationships in the TelemetryFlow platform.

## Entities
- **User**: System users with authentication and profile information
- **Role**: Role definitions with associated permissions
- **Permission**: Granular access control permissions
- **Region**: Geographic regions for organizations
- **Organization**: Top-level organizational units
- **Workspace**: Project workspaces within organizations
- **Tenant**: Multi-tenant isolation units within workspaces
- **Group**: User grouping for organizational structure
- **UserRole**: Junction table for User-Role many-to-many relationship
- **UserPermission**: Junction table for User-Permission many-to-many relationship

## Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ UserRole : "has"
    User ||--o{ UserPermission : "has"
    User }o--|| Organization : "belongs to"
    User }o--|| Tenant : "belongs to"
    User }o--|| Group : "member of"

    Role ||--o{ UserRole : "assigned to"
    Role {
        string id PK
        string name UK
        text description
        jsonb permissions
        boolean is_system
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    Permission ||--o{ UserPermission : "granted to"
    Permission {
        uuid id PK
        varchar name UK
        varchar description
        varchar resource
        varchar action
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt
    }

    Region ||--o{ Organization : "contains"
    Region {
        uuid id PK
        string code UK
        string name
        text description
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    Organization ||--o{ Workspace : "contains"
    Organization ||--o{ Group : "contains"
    Organization }o--|| Region : "located in"
    Organization {
        uuid organization_id PK
        varchar name
        varchar code UK
        text description
        varchar domain
        boolean is_active
        uuid region_id FK
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    Workspace ||--o{ Tenant : "contains"
    Workspace }o--|| Organization : "belongs to"
    Workspace {
        uuid workspace_id PK
        varchar name
        varchar code UK
        text description
        boolean isActive
        jsonb datasource_config
        uuid organization_id FK
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt
    }

    Tenant }o--|| Workspace : "belongs to"
    Tenant {
        uuid tenant_id PK
        varchar name
        varchar code UK
        varchar domain
        boolean isActive
        uuid workspace_id FK
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt
    }

    Group }o--|| Organization : "belongs to"
    Group {
        uuid id PK
        varchar name
        text description
        uuid organizationId FK
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt
    }

    User {
        uuid id PK
        varchar email UK
        varchar password
        varchar firstName
        varchar lastName
        boolean isActive
        uuid organization_id FK
        uuid tenant_id FK
        uuid group_user_id FK
        varchar timezone
        varchar locale
        timestamp lastLoginAt
        int loginCount
        jsonb passwordHistory
        timestamp passwordChangedAt
        int failedLoginAttempts
        timestamp lockedUntil
        timestamp lastFailedLoginAt
        boolean mfa_enabled
        varchar mfa_secret
        jsonb mfa_backup_codes
        timestamp mfa_enrolled_at
        timestamp mfa_last_used_at
        boolean force_password_change
        varchar password_change_reason
        varchar avatar
        boolean emailVerified
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt
    }

    UserRole {
        uuid id PK
        uuid user_id FK
        string role_id FK
        uuid tenant_id FK
        timestamp created_at
    }

    UserPermission {
        uuid user_id PK,FK
        uuid permission_id PK,FK
        timestamp created_at
    }
```

## Cardinality Summary

### One-to-Many Relationships
- **Region → Organization**: One region contains many organizations (1:N)
- **Organization → Workspace**: One organization contains many workspaces (1:N)
- **Organization → Group**: One organization contains many groups (1:N)
- **Workspace → Tenant**: One workspace contains many tenants (1:N)
- **Organization → User**: One organization has many users (1:N)
- **Tenant → User**: One tenant has many users (1:N)
- **Group → User**: One group has many users (1:N)

### Many-to-Many Relationships
- **User ←→ Role**: Users can have multiple roles, roles can be assigned to multiple users (N:M via UserRole)
- **User ←→ Permission**: Users can have multiple direct permissions, permissions can be granted to multiple users (N:M via UserPermission)

## Key Constraints
- **User.email**: Unique constraint with soft delete consideration
- **Organization.code**: Unique constraint
- **Workspace.code**: Unique constraint
- **Tenant.code**: Unique constraint
- **Role.name**: Unique constraint
- **Permission.name**: Unique constraint
- **UserRole**: Composite unique index on (user_id, role_id)
- **UserPermission**: Composite primary key on (user_id, permission_id)

## Indexes
- User: (email, deletedAt)
- Organization: (code), (region_id)
- Workspace: (organization_id)
- Tenant: (workspace_id)
- UserRole: (user_id, role_id) unique

## Entity Counts
- **Total Entities**: 10
- **Primary Entities**: 8 (User, Role, Permission, Region, Organization, Workspace, Tenant, Group)
- **Junction Tables**: 2 (UserRole, UserPermission)

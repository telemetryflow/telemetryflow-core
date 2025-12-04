# IAM Module API Documentation

## Overview
The Identity and Access Management (IAM) module provides comprehensive APIs for managing users, roles, permissions, organizations, workspaces, tenants, groups, and regions.

## Authentication
All IAM endpoints require JWT authentication via Bearer token.

**Header:**
```
Authorization: Bearer <jwt_token>
```

---

## Users API

### Create User
**POST** `/api/v2/users`

Creates a new user in the system.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Responses:**
- **201 Created** - User created successfully
  ```json
  {
    "id": "uuid"
  }
  ```
- **400** - Invalid input data
- **401** - Unauthorized
- **409** - Email already exists

**Permissions Required:** `users:create`

---

### List Users
**GET** `/api/v2/users`

Retrieves a paginated list of users.

**Query Parameters:**
- `email` (optional) - Filter by email
- `organizationId` (optional) - Filter by organization

**Responses:**
- **200 OK** - List of users
  ```json
  [
    {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
  ```
- **401** - Unauthorized

**Permissions Required:** `users:read`

---

### Get User by ID
**GET** `/api/v2/users/:id`

Retrieves a specific user by ID.

**Path Parameters:**
- `id` - User ID (UUID)

**Responses:**
- **200 OK** - User details
- **401** - Unauthorized
- **404** - User not found

**Permissions Required:** `users:read`

---

### Update User
**PUT** `/api/v2/users/:id`

Updates user information.

**Path Parameters:**
- `id` - User ID (UUID)

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "avatar": "https://example.com/avatar.jpg",
  "timezone": "UTC",
  "locale": "en-US"
}
```

**Responses:**
- **200 OK** - User updated successfully
  ```json
  {
    "success": true
  }
  ```
- **400** - Invalid input data
- **401** - Unauthorized
- **404** - User not found

**Permissions Required:** `users:update`

---

### Delete User
**DELETE** `/api/v2/users/:id`

Soft deletes a user.

**Path Parameters:**
- `id` - User ID (UUID)

**Responses:**
- **204 No Content** - User deleted successfully
- **401** - Unauthorized
- **404** - User not found

**Permissions Required:** `users:delete`

---

### Activate User
**POST** `/api/v2/users/:id/activate`

Activates a deactivated user account.

**Path Parameters:**
- `id` - User ID (UUID)

**Responses:**
- **200 OK** - User activated
  ```json
  {
    "success": true
  }
  ```
- **401** - Unauthorized
- **404** - User not found

**Permissions Required:** `users:activate`

---

### Deactivate User
**POST** `/api/v2/users/:id/deactivate`

Deactivates a user account.

**Path Parameters:**
- `id` - User ID (UUID)

**Responses:**
- **200 OK** - User deactivated
- **401** - Unauthorized
- **404** - User not found

**Permissions Required:** `users:deactivate`

---

### Change Password
**PUT** `/api/v2/users/:id/password`

Changes a user's password.

**Path Parameters:**
- `id` - User ID (UUID)

**Request Body:**
```json
{
  "password": "NewSecurePassword123!"
}
```

**Responses:**
- **200 OK** - Password changed successfully
- **401** - Unauthorized
- **404** - User not found

**Permissions Required:** `users:update`

---

### Assign Role to User
**POST** `/api/v2/users/:id/roles`

Assigns a role to a user.

**Path Parameters:**
- `id` - User ID (UUID)

**Request Body:**
```json
{
  "roleId": "role-uuid"
}
```

**Responses:**
- **200 OK** - Role assigned
- **401** - Unauthorized
- **404** - User or role not found

**Permissions Required:** `users:assign-role`

---

### Revoke Role from User
**DELETE** `/api/v2/users/:id/roles/:roleId`

Revokes a role from a user.

**Path Parameters:**
- `id` - User ID (UUID)
- `roleId` - Role ID (UUID)

**Responses:**
- **204 No Content** - Role revoked
- **401** - Unauthorized
- **404** - User or role not found

**Permissions Required:** `users:revoke-role`

---

### Get User Roles
**GET** `/api/v2/users/:id/roles`

Retrieves all roles assigned to a user.

**Path Parameters:**
- `id` - User ID (UUID)

**Responses:**
- **200 OK** - List of roles
- **401** - Unauthorized
- **404** - User not found

**Permissions Required:** `users:read`

---

### Assign Permission to User
**POST** `/api/v2/users/:id/permissions`

Assigns a direct permission to a user.

**Path Parameters:**
- `id` - User ID (UUID)

**Request Body:**
```json
{
  "permissionId": "permission-uuid"
}
```

**Responses:**
- **200 OK** - Permission assigned
- **401** - Unauthorized
- **404** - User or permission not found

**Permissions Required:** `users:assign-permission`

---

### Revoke Permission from User
**DELETE** `/api/v2/users/:id/permissions/:permissionId`

Revokes a permission from a user.

**Path Parameters:**
- `id` - User ID (UUID)
- `permissionId` - Permission ID (UUID)

**Responses:**
- **204 No Content** - Permission revoked
- **401** - Unauthorized
- **404** - User or permission not found

**Permissions Required:** `users:revoke-permission`

---

### Get User Permissions
**GET** `/api/v2/users/:id/permissions`

Retrieves all permissions for a user (both direct and inherited from roles).

**Path Parameters:**
- `id` - User ID (UUID)

**Responses:**
- **200 OK** - List of permissions
- **401** - Unauthorized
- **404** - User not found

**Permissions Required:** `users:read`

---

## Roles API

### Create Role
**POST** `/api/v2/iam/roles`

Creates a new role.

**Request Body:**
```json
{
  "name": "Admin",
  "description": "Administrator role",
  "permissionIds": ["perm-uuid-1", "perm-uuid-2"],
  "tenantId": "tenant-uuid"
}
```

**Responses:**
- **201 Created** - Role created
- **400** - Invalid input data
- **401** - Unauthorized

**Permissions Required:** `roles:create`

---

### List Roles
**GET** `/api/v2/iam/roles`

Retrieves all roles.

**Query Parameters:**
- `tenantId` (optional) - Filter by tenant
- `includeSystem` (optional) - Include system roles

**Responses:**
- **200 OK** - List of roles
- **401** - Unauthorized

**Permissions Required:** `roles:read`

---

### Get Role by ID
**GET** `/api/v2/iam/roles/:id`

Retrieves a specific role.

**Path Parameters:**
- `id` - Role ID (UUID)

**Responses:**
- **200 OK** - Role details
- **401** - Unauthorized
- **404** - Role not found

**Permissions Required:** `roles:read`

---

### Update Role
**PATCH** `/api/v2/iam/roles/:id`

Updates a role.

**Path Parameters:**
- `id` - Role ID (UUID)

**Request Body:**
```json
{
  "name": "Super Admin",
  "description": "Updated description"
}
```

**Responses:**
- **200 OK** - Role updated
- **401** - Unauthorized
- **404** - Role not found

**Permissions Required:** `roles:update`

---

### Delete Role
**DELETE** `/api/v2/iam/roles/:id`

Deletes a role.

**Path Parameters:**
- `id` - Role ID (UUID)

**Responses:**
- **204 No Content** - Role deleted
- **401** - Unauthorized
- **404** - Role not found

**Permissions Required:** `roles:delete`

---

### Assign Permission to Role
**POST** `/api/v2/iam/roles/:id/permissions`

Assigns a permission to a role.

**Path Parameters:**
- `id` - Role ID (UUID)

**Request Body:**
```json
{
  "permissionId": "permission-uuid"
}
```

**Responses:**
- **200 OK** - Permission assigned
- **401** - Unauthorized
- **404** - Role or permission not found

**Permissions Required:** `roles:update`

---

### Remove Permission from Role
**DELETE** `/api/v2/iam/roles/:id/permissions/:permissionId`

Removes a permission from a role.

**Path Parameters:**
- `id` - Role ID (UUID)
- `permissionId` - Permission ID (UUID)

**Responses:**
- **200 OK** - Permission removed
- **401** - Unauthorized
- **404** - Role or permission not found

**Permissions Required:** `roles:update`

---

### Get Users with Role
**GET** `/api/v2/iam/roles/:id/users`

Retrieves all users assigned to a role.

**Path Parameters:**
- `id` - Role ID (UUID)

**Responses:**
- **200 OK** - List of user IDs
- **401** - Unauthorized
- **404** - Role not found

**Permissions Required:** `roles:read`

---

## Permissions API

### Create Permission
**POST** `/api/v2/iam/permissions`

Creates a new permission.

**Request Body:**
```json
{
  "name": "users:create",
  "description": "Create users",
  "resource": "users",
  "action": "create"
}
```

**Responses:**
- **201 Created** - Permission created
- **401** - Unauthorized

**Permissions Required:** `permissions:create`

---

### List Permissions
**GET** `/api/v2/iam/permissions`

Retrieves all permissions.

**Query Parameters:**
- `resource` (optional) - Filter by resource

**Responses:**
- **200 OK** - List of permissions
- **401** - Unauthorized

**Permissions Required:** `permissions:read`

---

### Get Permission by ID
**GET** `/api/v2/iam/permissions/:id`

Retrieves a specific permission.

**Path Parameters:**
- `id` - Permission ID (UUID)

**Responses:**
- **200 OK** - Permission details
- **401** - Unauthorized
- **404** - Permission not found

**Permissions Required:** `permissions:read`

---

### Update Permission
**PATCH** `/api/v2/iam/permissions/:id`

Updates a permission.

**Path Parameters:**
- `id` - Permission ID (UUID)

**Request Body:**
```json
{
  "name": "users:create",
  "description": "Updated description",
  "resource": "users",
  "action": "create"
}
```

**Responses:**
- **200 OK** - Permission updated
- **401** - Unauthorized
- **404** - Permission not found

**Permissions Required:** `permissions:update`

---

### Delete Permission
**DELETE** `/api/v2/iam/permissions/:id`

Deletes a permission.

**Path Parameters:**
- `id` - Permission ID (UUID)

**Responses:**
- **204 No Content** - Permission deleted
- **401** - Unauthorized
- **404** - Permission not found

**Permissions Required:** `permissions:delete`

---

## Organizations API

### Create Organization
**POST** `/api/v2/organizations`

Creates a new organization within a region.

**Request Body:**
```json
{
  "name": "Acme Corp",
  "code": "ACME",
  "regionId": "region-uuid",
  "description": "Acme Corporation",
  "domain": "acme.com"
}
```

**Responses:**
- **201 Created** - Organization created
  ```json
  {
    "id": "uuid"
  }
  ```
- **400** - Invalid input data
- **401** - Unauthorized
- **409** - Organization code already exists

**Permissions Required:** `organizations:create`

---

### List Organizations
**GET** `/api/v2/organizations`

Retrieves all organizations.

**Query Parameters:**
- `regionId` (optional) - Filter by region

**Responses:**
- **200 OK** - List of organizations
- **401** - Unauthorized

**Permissions Required:** `organizations:read`

---

### Get Organization by ID
**GET** `/api/v2/organizations/:id`

Retrieves organization details.

**Path Parameters:**
- `id` - Organization ID (UUID)

**Responses:**
- **200 OK** - Organization details
- **401** - Unauthorized
- **404** - Organization not found

**Permissions Required:** `organizations:read`

---

### Update Organization
**PUT** `/api/v2/organizations/:id`

Updates organization details.

**Path Parameters:**
- `id` - Organization ID (UUID)

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "domain": "newdomain.com"
}
```

**Responses:**
- **200 OK** - Organization updated
- **400** - Invalid input data
- **401** - Unauthorized
- **404** - Organization not found

**Permissions Required:** `organizations:update`

---

### Delete Organization
**DELETE** `/api/v2/organizations/:id`

Soft deletes an organization.

**Path Parameters:**
- `id` - Organization ID (UUID)

**Responses:**
- **204 No Content** - Organization deleted
- **401** - Unauthorized
- **404** - Organization not found

**Permissions Required:** `organizations:delete`

---

## Workspaces API

### Create Workspace
**POST** `/api/v2/iam/workspaces`

Creates a new workspace within an organization.

**Request Body:**
```json
{
  "name": "Production Workspace",
  "code": "PROD",
  "organizationId": "org-uuid",
  "description": "Production environment",
  "datasourceConfig": {
    "clickhouse": {
      "host": "localhost",
      "port": 9000
    }
  }
}
```

**Responses:**
- **201 Created** - Workspace created
- **401** - Unauthorized
- **409** - Workspace code already exists

**Permissions Required:** `workspaces:create`

---

### List Workspaces
**GET** `/api/v2/iam/workspaces`

Retrieves all workspaces.

**Query Parameters:**
- `organizationId` (optional) - Filter by organization

**Responses:**
- **200 OK** - List of workspaces
- **401** - Unauthorized

**Permissions Required:** `workspaces:read`

---

### Get Workspace by ID
**GET** `/api/v2/iam/workspaces/:id`

Retrieves workspace details.

**Path Parameters:**
- `id` - Workspace ID (UUID)

**Responses:**
- **200 OK** - Workspace details
- **401** - Unauthorized
- **404** - Workspace not found

**Permissions Required:** `workspaces:read`

---

### Update Workspace
**PATCH** `/api/v2/iam/workspaces/:id`

Updates workspace details.

**Path Parameters:**
- `id` - Workspace ID (UUID)

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "datasourceConfig": {}
}
```

**Responses:**
- **200 OK** - Workspace updated
- **401** - Unauthorized
- **404** - Workspace not found

**Permissions Required:** `workspaces:update`

---

### Delete Workspace
**DELETE** `/api/v2/iam/workspaces/:id`

Soft deletes a workspace.

**Path Parameters:**
- `id` - Workspace ID (UUID)

**Responses:**
- **204 No Content** - Workspace deleted
- **401** - Unauthorized
- **404** - Workspace not found

**Permissions Required:** `workspaces:delete`

---

## Tenants API

### Create Tenant
**POST** `/api/v2/iam/tenants`

Creates a new tenant within a workspace.

**Request Body:**
```json
{
  "name": "Customer Tenant",
  "code": "CUST001",
  "workspaceId": "workspace-uuid",
  "domain": "customer.example.com"
}
```

**Responses:**
- **201 Created** - Tenant created
- **401** - Unauthorized
- **409** - Tenant code already exists

**Permissions Required:** `tenants:create`

---

### List Tenants
**GET** `/api/v2/iam/tenants`

Retrieves all tenants.

**Query Parameters:**
- `workspaceId` (optional) - Filter by workspace

**Responses:**
- **200 OK** - List of tenants
- **401** - Unauthorized

**Permissions Required:** `tenants:read`

---

### Get Tenant by ID
**GET** `/api/v2/iam/tenants/:id`

Retrieves tenant details.

**Path Parameters:**
- `id` - Tenant ID (UUID)

**Responses:**
- **200 OK** - Tenant details
- **401** - Unauthorized
- **404** - Tenant not found

**Permissions Required:** `tenants:read`

---

### Update Tenant
**PATCH** `/api/v2/iam/tenants/:id`

Updates tenant details.

**Path Parameters:**
- `id` - Tenant ID (UUID)

**Request Body:**
```json
{
  "name": "Updated Name",
  "domain": "newdomain.com"
}
```

**Responses:**
- **200 OK** - Tenant updated
- **401** - Unauthorized
- **404** - Tenant not found

**Permissions Required:** `tenants:update`

---

### Delete Tenant
**DELETE** `/api/v2/iam/tenants/:id`

Soft deletes a tenant.

**Path Parameters:**
- `id` - Tenant ID (UUID)

**Responses:**
- **204 No Content** - Tenant deleted
- **401** - Unauthorized
- **404** - Tenant not found

**Permissions Required:** `tenants:delete`

---

## Groups API

### Create Group
**POST** `/api/v2/iam/groups`

Creates a new group.

**Request Body:**
```json
{
  "name": "Engineering Team",
  "description": "Engineering department",
  "organizationId": "org-uuid"
}
```

**Responses:**
- **201 Created** - Group created
- **401** - Unauthorized

**Permissions Required:** `groups:create`

---

### List Groups
**GET** `/api/v2/iam/groups`

Retrieves all groups.

**Responses:**
- **200 OK** - List of groups
- **401** - Unauthorized

**Permissions Required:** `groups:read`

---

### Get Group by ID
**GET** `/api/v2/iam/groups/:id`

Retrieves group details.

**Path Parameters:**
- `id` - Group ID (UUID)

**Responses:**
- **200 OK** - Group details
- **401** - Unauthorized
- **404** - Group not found

**Permissions Required:** `groups:read`

---

### Update Group
**PATCH** `/api/v2/iam/groups/:id`

Updates group details.

**Path Parameters:**
- `id` - Group ID (UUID)

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

**Responses:**
- **200 OK** - Group updated
- **401** - Unauthorized
- **404** - Group not found

**Permissions Required:** `groups:update`

---

### Delete Group
**DELETE** `/api/v2/iam/groups/:id`

Deletes a group.

**Path Parameters:**
- `id` - Group ID (UUID)

**Responses:**
- **204 No Content** - Group deleted
- **401** - Unauthorized
- **404** - Group not found

**Permissions Required:** `groups:delete`

---

### Add User to Group
**POST** `/api/v2/iam/groups/:id/users`

Adds a user to a group.

**Path Parameters:**
- `id` - Group ID (UUID)

**Request Body:**
```json
{
  "userId": "user-uuid"
}
```

**Responses:**
- **200 OK** - User added to group
- **401** - Unauthorized
- **404** - Group or user not found

**Permissions Required:** `groups:update`

---

### Remove User from Group
**DELETE** `/api/v2/iam/groups/:id/users/:userId`

Removes a user from a group.

**Path Parameters:**
- `id` - Group ID (UUID)
- `userId` - User ID (UUID)

**Responses:**
- **200 OK** - User removed from group
- **401** - Unauthorized
- **404** - Group or user not found

**Permissions Required:** `groups:update`

---

## Regions API

### Create Region
**POST** `/api/v2/iam/regions`

Creates a new region.

**Request Body:**
```json
{
  "name": "US East",
  "code": "US-EAST-1",
  "description": "US East region"
}
```

**Responses:**
- **201 Created** - Region created
- **401** - Unauthorized

**Permissions Required:** `regions:create`

---

### List Regions
**GET** `/api/v2/iam/regions`

Retrieves all regions.

**Responses:**
- **200 OK** - List of regions
- **401** - Unauthorized

**Permissions Required:** `regions:read`

---

### Get Region by ID
**GET** `/api/v2/iam/regions/:id`

Retrieves region details.

**Path Parameters:**
- `id` - Region ID (UUID)

**Responses:**
- **200 OK** - Region details
- **401** - Unauthorized
- **404** - Region not found

**Permissions Required:** `regions:read`

---

### Update Region
**PATCH** `/api/v2/iam/regions/:id`

Updates region details.

**Path Parameters:**
- `id` - Region ID (UUID)

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

**Responses:**
- **200 OK** - Region updated
- **401** - Unauthorized
- **404** - Region not found

**Permissions Required:** `regions:update`

---

### Delete Region
**DELETE** `/api/v2/iam/regions/:id`

Deletes a region.

**Path Parameters:**
- `id` - Region ID (UUID)

**Responses:**
- **204 No Content** - Region deleted
- **401** - Unauthorized
- **404** - Region not found

**Permissions Required:** `regions:delete`

---

## Audit Logs API (IAM)

### List Audit Logs
**GET** `/api/v2/audit/logs`

Retrieves audit logs.

**Query Parameters:**
- `userId` (optional) - Filter by user
- `action` (optional) - Filter by action

**Responses:**
- **200 OK** - List of audit logs
- **401** - Unauthorized

**Permissions Required:** `audit:read`

---

### Get Audit Log by ID
**GET** `/api/v2/audit/logs/:id`

Retrieves a specific audit log.

**Path Parameters:**
- `id` - Audit log ID (UUID)

**Responses:**
- **200 OK** - Audit log details
- **401** - Unauthorized
- **404** - Audit log not found

**Permissions Required:** `audit:read`

---

### Get Audit Count
**GET** `/api/v2/audit/count`

Gets the total count of audit logs.

**Responses:**
- **200 OK** - Audit count
  ```json
  {
    "count": 1000
  }
  ```
- **401** - Unauthorized

**Permissions Required:** `audit:read`

---

### Get Audit Statistics
**GET** `/api/v2/audit/statistics`

Gets audit statistics.

**Responses:**
- **200 OK** - Audit statistics
  ```json
  {
    "totalLogs": 1000,
    "byAction": {
      "create": 500,
      "update": 300,
      "delete": 200
    }
  }
  ```
- **401** - Unauthorized

**Permissions Required:** `audit:read`

---

### Export Audit Logs
**GET** `/api/v2/audit/export`

Exports audit logs.

**Query Parameters:**
- `format` - Export format (csv, json)

**Responses:**
- **200 OK** - Exported audit logs
- **401** - Unauthorized

**Permissions Required:** `audit:export`

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Resource not found"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Resource already exists"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

---

## Rate Limiting

API requests are rate-limited to:
- **100 requests per minute** for standard users
- **1000 requests per minute** for admin users

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## Pagination

List endpoints support pagination via query parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

Response format:
```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

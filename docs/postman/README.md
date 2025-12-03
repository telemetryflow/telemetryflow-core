# TelemetryFlow Core - Postman Collection

Complete API testing collection for TelemetryFlow Core IAM module with BDD test scenarios.

## Quick Start

### Manual Testing (Postman UI)

1. **Import Collection**
   - Open Postman
   - Click "Import" → Select `TelemetryFlow Core - IAM.postman_collection.json`

2. **Import Environment**
   - Click "Import" → Select `TelemetryFlow Core - Local.postman_environment.json`
   - Select "TelemetryFlow Core - Local" environment from dropdown

3. **Start Testing**
   - All requests use `{{base_url}}` = `http://localhost:3000/api/v2`
   - Default credentials are pre-configured

### Automated BDD Testing (Newman CLI)

```bash
# Install Newman
npm install -g newman newman-reporter-htmlextra

# Run all BDD tests
bash docs/postman/run-bdd-tests.sh

# Run specific folder
bash docs/postman/run-bdd-tests.sh --folder Users

# Run with verbose output
bash docs/postman/run-bdd-tests.sh --verbose

# Stop on first failure
bash docs/postman/run-bdd-tests.sh --bail
```

See [BDD_TESTS.md](./BDD_TESTS.md) for complete BDD test scenarios.

## Environment Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `base_url` | `http://localhost:3000/api/v2` | API base URL |
| `access_token` | (empty) | JWT token (auto-set after login) |
| `region_id` | `7996a839-8f5e-4888-a2c9-d9d57aa16c70` | Default region UUID |
| `organization_id` | `dd085b41-103b-4458-8253-fa942c3aacf7` | Default organization UUID |
| `user_id` | (empty) | User UUID for testing |
| `role_id` | (empty) | Role UUID for testing |
| `permission_id` | (empty) | Permission UUID for testing |
| `tenant_id` | (empty) | Tenant UUID for testing |
| `superadmin_email` | `superadmin.telemetryflow@telemetryflow.id` | Super Admin email |
| `superadmin_password` | `SuperAdmin@123456` | Super Admin password |
| `admin_email` | `administrator.telemetryflow@telemetryflow.id` | Administrator email |
| `admin_password` | `Admin@123456` | Administrator password |
| `developer_email` | `developer.telemetryflow@telemetryflow.id` | Developer email |
| `developer_password` | `Developer@123456` | Developer password |
| `viewer_email` | `viewer.telemetryflow@telemetryflow.id` | Viewer email |
| `viewer_password` | `Viewer@123456` | Viewer password |

## Collection Structure

### 1. Health (4 requests)
- Health Check (no auth)
- Root Info (no auth)
- Version (no auth)
- Metrics (no auth)

### 2. Users (14 requests)
- Get All Users
- Get User by ID
- Create User
- Update User
- Delete User
- Activate User
- Deactivate User
- Change User Password
- Get User Roles
- Assign Role to User
- Revoke Role from User
- Get User Permissions
- Assign Permission to User
- Revoke Permission from User

### 3. Roles (8 requests)
- Get All Roles
- Get Role by ID
- Create Role
- Update Role
- Delete Role
- Get Role Permissions
- Assign Permission to Role
- Revoke Permission from Role
- Get Role Users

### 4. Permissions (3 requests)
- Get All Permissions
- Get Permission by ID
- Create Permission

### 5. Organizations (4 requests)
- Get All Organizations
- Get Organization by ID
- Create Organization
- Get Organizations by Region

### 6. Tenants (3 requests)
- Get All Tenants
- Get Tenant by ID
- Create Tenant

### 7. Workspaces (3 requests)
- Get All Workspaces
- Get Workspace by ID
- Create Workspace

### 8. Groups (7 requests)
- Get All Groups
- Get Group by ID
- Create Group
- Update Group
- Delete Group
- Get Group Users
- Add User to Group
- Remove User from Group

### 9. Regions (3 requests)
- Get All Regions
- Get Region by ID
- Create Region

### 10. Audit (5 requests)
- Get Audit Logs (with filters: limit, offset, eventType, userId, date range)
- Get Audit Log by ID
- Get Audit Count
- Get Audit Statistics
- Export Audit Logs (CSV format)

## API Endpoints

All endpoints use the base URL: `http://localhost:3000/api/v2`

**IAM Endpoints** (with `/iam/` prefix):
- `/iam/regions`
- `/iam/tenants`
- `/iam/workspaces`
- `/iam/groups`

**Direct Endpoints**:
- `/users`
- `/roles`
- `/permissions`
- `/organizations`
- `/audit`

**Excluded from prefix** (direct access):
- `/health`
- `/metrics`
- `/version`

## Testing Workflow

1. **Health Check**
   ```
   GET /health
   ```

2. **Get Regions**
   ```
   GET /iam/regions
   ```
   Copy the region `id` to use in organization queries

3. **Get Organizations by Region**
   ```
   GET /organizations?regionId={{region_id}}
   ```

4. **Get Users**
   ```
   GET /users
   ```

5. **Filter Users**
   ```
   GET /users?email=administrator.telemetryflow@telemetryflow.id&organizationId={{organization_id}}
   ```

6. **Get Audit Logs**
   ```
   GET /audit/logs?limit=50&offset=0
   ```

7. **Get Audit Statistics**
   ```
   GET /audit/statistics
   ```

## Notes

- All requests (except Health Check) require authentication
- Use Bearer token authentication with `{{access_token}}`
- Region and Organization IDs are UUIDs, not names
- Default region: `ap-southeast-3` (UUID: `7996a839-8f5e-4888-a2c9-d9d57aa16c70`)
- Default organization: `DevOpsCorner` (UUID: `dd085b41-103b-4458-8253-fa942c3aacf7`)
- Variables like `{{user_id}}`, `{{role_id}}` are placeholders - copy actual IDs from responses
- Query parameters marked as "disabled" are optional filters

## Variable Usage

**Pre-filled variables:**
- `{{region_id}}` - Used in organization and region requests
- `{{organization_id}}` - Used in user and organization requests
- `{{admin_email}}` - Used in user filter examples

**Dynamic variables (copy from responses):**
- `{{user_id}}` - Copy from user list/create response
- `{{role_id}}` - Copy from role list/create response
- `{{permission_id}}` - Copy from permission list response
- `{{tenant_id}}` - Copy from tenant list/create response

## Troubleshooting

**404 Not Found**
- Ensure backend is running: `docker-compose ps backend`
- Check base URL includes `/api/v2`: `http://localhost:3000/api/v2`

**Invalid UUID Error**
- Use UUID values, not names (e.g., `7996a839-...` not `ap-southeast-3`)
- Check environment variables for correct UUIDs

**Connection Refused**
- Restart backend: `docker-compose restart backend`
- Wait 10-15 seconds for startup

## Updates

- ✅ Base URL updated to `/api/v2`
- ✅ Added all environment variables with UUIDs
- ✅ Added dynamic variables: `user_id`, `role_id`, `permission_id`, `tenant_id`, `group_id`
- ✅ **Complete Swagger API coverage - 100% identical**
- ✅ Added all user role/permission management endpoints
- ✅ Added all role permission management endpoints
- ✅ Added all group user management endpoints
- ✅ Added system endpoints: root, version, metrics
- ✅ Added Audit endpoints (5 requests)
- ✅ Request examples use environment variables
- ✅ Query parameters with optional filters
- ✅ **BDD test automation with Newman**
- ✅ **33 BDD test scenarios with Given-When-Then format**
- ✅ **HTML and JSON test reports**

## BDD Testing

### Run BDD Tests

```bash
# All tests
bash docs/postman/run-bdd-tests.sh

# Specific folder
bash docs/postman/run-bdd-tests.sh --folder Users
bash docs/postman/run-bdd-tests.sh --folder Roles
bash docs/postman/run-bdd-tests.sh --folder Organizations

# With options
bash docs/postman/run-bdd-tests.sh --verbose --bail
```

### Test Reports

Reports are generated in `docs/postman/reports/`:
- **HTML**: Interactive dashboard with test results
- **JSON**: Machine-readable format for CI/CD

```bash
# View latest HTML report
open docs/postman/reports/report-*.html
```

### BDD Test Coverage

| Module         | Scenarios | Coverage |
|----------------|-----------|----------|
| Health         | 2         | 100%     |
| Users          | 7         | 100%     |
| Roles          | 5         | 100%     |
| Permissions    | 2         | 100%     |
| Organizations  | 3         | 100%     |
| Tenants        | 2         | 100%     |
| Workspaces     | 2         | 100%     |
| Groups         | 4         | 100%     |
| Regions        | 2         | 100%     |
| Audit          | 4         | 100%     |
| **Total**      | **33**    | **100%** |

See [BDD_TESTS.md](./BDD_TESTS.md) for complete test scenarios.

---

- **Total Requests**: 54
- **BDD Scenarios**: 33
- **Swagger Coverage**: 100%
- **Last Updated**: 2025-12-03

# TelemetryFlow Core - Postman Collection

Postman collection and environment for testing TelemetryFlow Core IAM API.

## Files

- `TelemetryFlow-Core.postman_collection.json` - API collection with all IAM endpoints
- `TelemetryFlow-Core.postman_environment.json` - Environment variables for local development

## Quick Start

### 1. Import to Postman

1. Open Postman
2. Click **Import** button
3. Select both JSON files:
   - `TelemetryFlow-Core.postman_collection.json`
   - `TelemetryFlow-Core.postman_environment.json`
4. Click **Import**

### 2. Select Environment

1. Click environment dropdown (top right)
2. Select **TelemetryFlow Core - Local**

### 3. Start Backend

```bash
# From project root
./docker-start.sh
```

### 4. Test API

1. Open **Health** → **Health Check** request
2. Click **Send**
3. Should return `{"status":"ok"}`

## Authentication

The collection uses Bearer token authentication. Set the `access_token` variable after login.

### Default Users

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin.telemetryflow@telemetryflow.id | SuperAdmin@123456 |
| Administrator | administrator.telemetryflow@telemetryflow.id | Admin@123456 |
| Developer | developer.telemetryflow@telemetryflow.id | Developer@123456 |
| Viewer | viewer.telemetryflow@telemetryflow.id | Viewer@123456 |

## Collection Structure

### Health
- Health Check (no auth required)

### Users
- Get All Users
- Get User by ID
- Create User
- Update User
- Delete User

### Roles
- Get All Roles
- Get Role by ID
- Create Role
- Assign Role to User

### Permissions
- Get All Permissions
- Get Permission by ID
- Assign Permission to Role

### Organizations
- Get All Organizations
- Get Organization by ID
- Create Organization

### Tenants
- Get All Tenants
- Get Tenant by ID
- Create Tenant

### Workspaces
- Get All Workspaces
- Get Workspace by ID
- Create Workspace

### Groups
- Get All Groups
- Get Group by ID
- Create Group
- Add User to Group

### Regions
- Get All Regions
- Get Region by ID
- Create Region

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `base_url` | API base URL | http://localhost:3000 |
| `access_token` | JWT token | (empty) |
| `superadmin_email` | Super Admin email | superadmin.telemetryflow@telemetryflow.id |
| `superadmin_password` | Super Admin password | SuperAdmin@123456 |
| `admin_email` | Administrator email | administrator.telemetryflow@telemetryflow.id |
| `admin_password` | Administrator password | Admin@123456 |
| `developer_email` | Developer email | developer.telemetryflow@telemetryflow.id |
| `developer_password` | Developer password | Developer@123456 |
| `viewer_email` | Viewer email | viewer.telemetryflow@telemetryflow.id |
| `viewer_password` | Viewer password | Viewer@123456 |

## Usage Tips

1. **Set Token**: After authentication, copy the JWT token to `access_token` variable
2. **Use Variables**: Reference IDs using `{{variable_name}}` in requests
3. **Save Responses**: Use Postman's test scripts to auto-save IDs from responses
4. **Environments**: Create additional environments for staging/production

## API Documentation

For detailed API documentation, visit: http://localhost:3000/api

## Support

- Documentation: [../../README.md](../../README.md)
- IAM Module: [../../src/modules/iam/README.md](../../src/modules/iam/README.md)

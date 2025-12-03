# TelemetryFlow Core - BDD Test Scenarios

Behavior-Driven Development (BDD) test scenarios for TelemetryFlow Core IAM API.

## Overview

This document describes the BDD test scenarios using **Given-When-Then** format for all IAM endpoints.

## Prerequisites

```bash
# Install Newman and HTML reporter
npm install -g newman newman-reporter-htmlextra

# Ensure backend is running
docker-compose up -d backend

# Wait for backend to be ready
curl http://localhost:3000/health
```

## Running Tests

### Run All Tests
```bash
bash docs/postman/run-bdd-tests.sh
```

### Run Specific Folder
```bash
bash docs/postman/run-bdd-tests.sh --folder Users
bash docs/postman/run-bdd-tests.sh --folder Roles
bash docs/postman/run-bdd-tests.sh --folder Organizations
```

### Run with Options
```bash
# Verbose output
bash docs/postman/run-bdd-tests.sh --verbose

# Stop on first failure
bash docs/postman/run-bdd-tests.sh --bail

# Combine options
bash docs/postman/run-bdd-tests.sh --folder Users --verbose --bail
```

## BDD Test Scenarios

### 1. Health Check

#### Scenario: System Health Check
```gherkin
Given the TelemetryFlow Core backend is running
When I send a GET request to /health
Then the response status should be 200
And the response should contain status "ok"
```

#### Scenario: Metrics Endpoint
```gherkin
Given the TelemetryFlow Core backend is running
When I send a GET request to /metrics
Then the response status should be 200
And the response should contain Prometheus metrics
```

---

### 2. Users Management

#### Scenario: List All Users
```gherkin
Given I am authenticated as Super Admin
When I send a GET request to /api/v2/users
Then the response status should be 200
And the response should contain an array of users
And each user should have id, email, firstName, lastName
```

#### Scenario: Get User by ID
```gherkin
Given I am authenticated as Super Admin
And a user exists with ID "{{user_id}}"
When I send a GET request to /api/v2/users/{{user_id}}
Then the response status should be 200
And the response should contain user details
```

#### Scenario: Create New User
```gherkin
Given I am authenticated as Administrator
And I have valid user data
When I send a POST request to /api/v2/users with:
  | email           | john.doe@example.com |
  | firstName       | John                 |
  | lastName        | Doe                  |
  | password        | SecurePass@123       |
  | organizationId  | {{organization_id}}  |
Then the response status should be 201
And the response should contain the created user
And the user should have a valid UUID
```

#### Scenario: Update User
```gherkin
Given I am authenticated as Administrator
And a user exists with ID "{{user_id}}"
When I send a PUT request to /api/v2/users/{{user_id}} with:
  | firstName | Jane |
  | lastName  | Doe  |
Then the response status should be 200
And the user firstName should be "Jane"
```

#### Scenario: Activate User
```gherkin
Given I am authenticated as Administrator
And a user exists with ID "{{user_id}}"
And the user is inactive
When I send a POST request to /api/v2/users/{{user_id}}/activate
Then the response status should be 200
And the user isActive should be true
```

#### Scenario: Deactivate User
```gherkin
Given I am authenticated as Administrator
And a user exists with ID "{{user_id}}"
And the user is active
When I send a POST request to /api/v2/users/{{user_id}}/deactivate
Then the response status should be 200
And the user isActive should be false
```

#### Scenario: Change User Password
```gherkin
Given I am authenticated as the user
And I have a valid current password
When I send a PUT request to /api/v2/users/{{user_id}}/password with:
  | currentPassword | OldPass@123 |
  | newPassword     | NewPass@123 |
Then the response status should be 200
And I should be able to login with the new password
```

---

### 3. Roles Management

#### Scenario: List All Roles
```gherkin
Given I am authenticated as Super Admin
When I send a GET request to /api/v2/roles
Then the response status should be 200
And the response should contain 5 roles
And the roles should include "Super Administrator", "Administrator", "Developer", "Viewer", "Demo"
```

#### Scenario: Get Role by ID
```gherkin
Given I am authenticated as Super Admin
And a role exists with ID "{{role_id}}"
When I send a GET request to /api/v2/roles/{{role_id}}
Then the response status should be 200
And the response should contain role details
```

#### Scenario: Create New Role
```gherkin
Given I am authenticated as Super Admin
When I send a POST request to /api/v2/roles with:
  | name        | Custom Role        |
  | description | Custom role desc   |
  | tier        | 3                  |
Then the response status should be 201
And the response should contain the created role
```

#### Scenario: Assign Permission to Role
```gherkin
Given I am authenticated as Super Admin
And a role exists with ID "{{role_id}}"
And a permission exists with ID "{{permission_id}}"
When I send a POST request to /api/v2/roles/{{role_id}}/permissions/{{permission_id}}
Then the response status should be 200
And the role should have the permission assigned
```

#### Scenario: Get Role Users
```gherkin
Given I am authenticated as Super Admin
And a role exists with ID "{{role_id}}"
When I send a GET request to /api/v2/roles/{{role_id}}/users
Then the response status should be 200
And the response should contain an array of users with that role
```

---

### 4. Permissions Management

#### Scenario: List All Permissions
```gherkin
Given I am authenticated as Super Admin
When I send a GET request to /api/v2/permissions
Then the response status should be 200
And the response should contain at least 22 permissions
And each permission should have resource and action
```

#### Scenario: Get Permission by ID
```gherkin
Given I am authenticated as Super Admin
And a permission exists with ID "{{permission_id}}"
When I send a GET request to /api/v2/permissions/{{permission_id}}
Then the response status should be 200
And the response should contain permission details
```

---

### 5. Organizations Management

#### Scenario: List All Organizations
```gherkin
Given I am authenticated as Super Admin
When I send a GET request to /api/v2/organizations
Then the response status should be 200
And the response should contain at least 3 organizations
And the organizations should include "DEVOPSCORNER", "TELEMETRYFLOW", "DEMO"
```

#### Scenario: Get Organization by ID
```gherkin
Given I am authenticated as Super Admin
And an organization exists with ID "{{organization_id}}"
When I send a GET request to /api/v2/organizations/{{organization_id}}
Then the response status should be 200
And the response should contain organization details
```

#### Scenario: Filter Organizations by Region
```gherkin
Given I am authenticated as Super Admin
And a region exists with ID "{{region_id}}"
When I send a GET request to /api/v2/organizations?regionId={{region_id}}
Then the response status should be 200
And all organizations should belong to the specified region
```

---

### 6. Tenants Management

#### Scenario: List All Tenants
```gherkin
Given I am authenticated as Super Admin
When I send a GET request to /api/v2/iam/tenants
Then the response status should be 200
And the response should contain an array of tenants
```

#### Scenario: Create New Tenant
```gherkin
Given I am authenticated as Administrator
When I send a POST request to /api/v2/iam/tenants with:
  | name           | New Tenant          |
  | organizationId | {{organization_id}} |
Then the response status should be 201
And the response should contain the created tenant
```

---

### 7. Workspaces Management

#### Scenario: List All Workspaces
```gherkin
Given I am authenticated as Developer
When I send a GET request to /api/v2/iam/workspaces
Then the response status should be 200
And the response should contain an array of workspaces
```

#### Scenario: Create New Workspace
```gherkin
Given I am authenticated as Developer
When I send a POST request to /api/v2/iam/workspaces with:
  | name     | Development Workspace |
  | tenantId | {{tenant_id}}         |
Then the response status should be 201
And the response should contain the created workspace
```

---

### 8. Groups Management

#### Scenario: List All Groups
```gherkin
Given I am authenticated as Administrator
When I send a GET request to /api/v2/iam/groups
Then the response status should be 200
And the response should contain an array of groups
```

#### Scenario: Create New Group
```gherkin
Given I am authenticated as Administrator
When I send a POST request to /api/v2/iam/groups with:
  | name           | Engineering Team    |
  | description    | Engineering group   |
  | organizationId | {{organization_id}} |
Then the response status should be 201
And the response should contain the created group
```

#### Scenario: Add User to Group
```gherkin
Given I am authenticated as Administrator
And a group exists with ID "{{group_id}}"
And a user exists with ID "{{user_id}}"
When I send a POST request to /api/v2/iam/groups/{{group_id}}/users/{{user_id}}
Then the response status should be 200
And the user should be a member of the group
```

#### Scenario: Remove User from Group
```gherkin
Given I am authenticated as Administrator
And a group exists with ID "{{group_id}}"
And a user is a member of the group
When I send a DELETE request to /api/v2/iam/groups/{{group_id}}/users/{{user_id}}
Then the response status should be 200
And the user should no longer be a member of the group
```

---

### 9. Regions Management

#### Scenario: List All Regions
```gherkin
Given I am authenticated as Super Admin
When I send a GET request to /api/v2/iam/regions
Then the response status should be 200
And the response should contain at least 1 region
And each region should have code and name
```

#### Scenario: Get Region by ID
```gherkin
Given I am authenticated as Super Admin
And a region exists with ID "{{region_id}}"
When I send a GET request to /api/v2/iam/regions/{{region_id}}
Then the response status should be 200
And the response should contain region details
```

---

### 10. Audit Logs

#### Scenario: Get Audit Logs
```gherkin
Given I am authenticated as Super Admin
When I send a GET request to /api/v2/audit/logs?limit=50&offset=0
Then the response status should be 200
And the response should contain an array of audit logs
And each log should have eventType, userId, timestamp
```

#### Scenario: Filter Audit Logs by Event Type
```gherkin
Given I am authenticated as Super Admin
When I send a GET request to /api/v2/audit/logs?eventType=USER_CREATED
Then the response status should be 200
And all logs should have eventType "USER_CREATED"
```

#### Scenario: Get Audit Statistics
```gherkin
Given I am authenticated as Super Admin
When I send a GET request to /api/v2/audit/statistics
Then the response status should be 200
And the response should contain event counts by type
```

#### Scenario: Export Audit Logs
```gherkin
Given I am authenticated as Super Admin
When I send a GET request to /api/v2/audit/export?format=csv
Then the response status should be 200
And the response should be in CSV format
```

---

## Test Coverage

| Module         | Scenarios | Requests | Coverage |
|----------------|-----------|----------|----------|
| Health         | 2         | 4        | 100%     |
| Users          | 7         | 14       | 100%     |
| Roles          | 5         | 9        | 100%     |
| Permissions    | 2         | 3        | 100%     |
| Organizations  | 3         | 4        | 100%     |
| Tenants        | 2         | 3        | 100%     |
| Workspaces     | 2         | 3        | 100%     |
| Groups         | 4         | 8        | 100%     |
| Regions        | 2         | 3        | 100%     |
| Audit          | 4         | 5        | 100%     |
| **Total**      | **33**    | **56**   | **100%** |

## Test Reports

After running tests, reports are generated in `docs/postman/reports/`:

- **HTML Report**: Interactive dashboard with test results, response times, and assertions
- **JSON Report**: Machine-readable format for CI/CD integration

### View HTML Report
```bash
open docs/postman/reports/report-YYYYMMDD_HHMMSS.html
```

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run BDD Tests
  run: |
    bash docs/postman/run-bdd-tests.sh --bail

- name: Upload Test Reports
  uses: actions/upload-artifact@v3
  with:
    name: test-reports
    path: docs/postman/reports/
```

### GitLab CI Example
```yaml
test:
  script:
    - bash docs/postman/run-bdd-tests.sh --bail
  artifacts:
    paths:
      - docs/postman/reports/
    when: always
```

## Troubleshooting

### Backend Not Running
```bash
docker-compose up -d backend
sleep 10
curl http://localhost:3000/health
```

### Newman Not Installed
```bash
npm install -g newman newman-reporter-htmlextra
```

### Tests Failing
```bash
# Run with verbose output
bash docs/postman/run-bdd-tests.sh --verbose

# Run specific folder
bash docs/postman/run-bdd-tests.sh --folder Users --verbose
```

---

- **Last Updated**: 2025-12-03
- **Total BDD Scenarios**: 33
- **API Coverage**: 100%

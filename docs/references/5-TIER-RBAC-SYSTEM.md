# 5-Tier RBAC System

**Date**: 2025-11-15
**Status**: ✅ Complete

---

## 📋 Overview

TelemetryFlow implements a 5-tier Role-Based Access Control (RBAC) system with hierarchical permissions and organizational scoping.

---

## 🎯 Role Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│ Tier 1: Super Administrator (Global)                        │
│ - Platform management across all organizations              │
│ - All permissions (60+ permissions)                         │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│ Tier 2: Administrator (Organization-scoped)                 │
│ - Full CRUD within organization                             │
│ - Cannot manage platform or system                          │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│ Tier 3: Developer (Organization-scoped)                     │
│ - Create, Read, Update (no delete)                          │
│ - Cannot manage users, roles, or delete resources           │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│ Tier 4: Viewer (Organization-scoped)                        │
│ - Read-only access                                          │
│ - Cannot modify any resources                               │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│ Tier 5: Demo (Demo Organization ONLY)                       │
│ - Same permissions as Developer                             │
│ - Restricted to Demo Org/Workspace/Tenant                   │
│ - Data auto-deleted every 6 hours                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Role Details

### Tier 1: Super Administrator

**Scope**: Global (all organizations, regions, workspaces, tenants)

**Description**: Can manage all the SaaS Platform across all organizations and regions

**Permissions** (60+):
- ✅ Platform management
- ✅ All IAM operations (users, roles, permissions, organizations, tenants, workspaces, regions)
- ✅ All observability operations (metrics, logs, traces)
- ✅ All dashboard operations
- ✅ All alert operations
- ✅ All monitoring operations
- ✅ All agent operations
- ✅ All uptime operations
- ✅ Audit log access
- ✅ System administration

**Use Cases**:
- Platform administrators
- DevOps team managing infrastructure
- System maintenance

---

### Tier 2: Administrator

**Scope**: Organization-scoped (single organization, multiple regions)

**Description**: Can manage all permissions within their organization across multiple regions

**Permissions** (55+):
- ✅ Organization read/update (no create/delete)
- ✅ Full user management (CRUD)
- ✅ Full role management (CRUD)
- ✅ Permission read-only
- ✅ Full tenant management (CRUD)
- ✅ Full workspace management (CRUD)
- ✅ Region read-only
- ✅ All observability operations (metrics, logs, traces)
- ✅ All dashboard operations
- ✅ All alert operations
- ✅ All monitoring operations
- ✅ All agent operations
- ✅ All uptime operations
- ✅ Audit log read/export
- ❌ No platform management
- ❌ No system administration

**Use Cases**:
- Organization administrators
- Team leads
- Department managers

---

### Tier 3: Developer

**Scope**: Organization-scoped (single organization)

**Description**: Can create and update resources within their organization, but cannot delete

**Permissions** (40+):
- ✅ Organization read-only
- ✅ User create/read/update (no delete)
- ✅ Role read-only
- ✅ Permission read-only
- ✅ Tenant create/read/update (no delete)
- ✅ Workspace create/read/update (no delete)
- ✅ Region read-only
- ✅ Metrics read/write (no delete)
- ✅ Logs read/write (no delete)
- ✅ Traces read/write (no delete)
- ✅ Dashboard create/read/update (no delete)
- ✅ Alert create/read/update (no delete/acknowledge)
- ✅ Alert rule group create/read/update (no delete)
- ✅ Agent create/read/update/register
- ✅ Uptime create/read/update/check
- ✅ Audit log read-only
- ❌ No delete operations
- ❌ No user/role management
- ❌ No export operations

**Use Cases**:
- Software developers
- DevOps engineers
- QA engineers

---

### Tier 4: Viewer

**Scope**: Organization-scoped (single organization)

**Description**: Read-only access to resources within their organization

**Permissions** (17):
- ✅ Organization read-only
- ✅ User read-only
- ✅ Role read-only
- ✅ Permission read-only
- ✅ Tenant read-only
- ✅ Workspace read-only
- ✅ Region read-only
- ✅ Metrics read-only
- ✅ Logs read-only
- ✅ Traces read-only
- ✅ Dashboard read-only
- ✅ Alert read-only
- ✅ Alert rule group read-only
- ✅ Agent read-only
- ✅ Uptime read/check
- ✅ Audit log read-only
- ❌ No write operations
- ❌ No create/update/delete operations

**Use Cases**:
- Business analysts
- Stakeholders
- External auditors
- Read-only monitoring

---

### Tier 5: Demo (NEW)

**Scope**: Demo Organization ONLY (org-demo, ws-demo, tn-demo)

**Description**: Developer access limited to Demo Organization, Demo Workspace, and Demo Tenant only

**Permissions** (40+ - same as Developer):
- ✅ All Developer permissions
- ✅ Organization read-only
- ✅ User create/read/update (no delete)
- ✅ Tenant create/read/update (no delete)
- ✅ Workspace create/read/update (no delete)
- ✅ Metrics read/write
- ✅ Logs read/write
- ✅ Traces read/write
- ✅ Dashboard create/read/update
- ✅ Alert create/read/update
- ✅ Agent create/read/update/register
- ✅ Uptime create/read/update/check
- ✅ Audit log read-only

**Restrictions**:
- 🔒 Limited to Demo Organization (`org-demo`)
- 🔒 Limited to Demo Workspace (`ws-demo`)
- 🔒 Limited to Demo Tenant (`tn-demo`)
- 🔒 Cannot access production data
- 🔒 Data auto-deleted every 6 hours
- ❌ No delete operations
- ❌ No access to other organizations

**Use Cases**:
- Product demonstrations
- Trial accounts
- Training environments
- Testing new features
- Customer evaluations

---

## 📊 Permission Comparison Matrix

| Permission Category | Super Admin | Administrator | Developer | Viewer | Demo |
|---------------------|-------------|---------------|-----------|--------|------|
| **Scope** | Global | Organization | Organization | Organization | Demo Org Only |
| **Platform Management** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Organization CRUD** | ✅ | Read/Update | Read | Read | Read |
| **User CRUD** | ✅ | ✅ | Create/Read/Update | Read | Create/Read/Update |
| **Role CRUD** | ✅ | ✅ | Read | Read | Read |
| **Tenant CRUD** | ✅ | ✅ | Create/Read/Update | Read | Create/Read/Update |
| **Workspace CRUD** | ✅ | ✅ | Create/Read/Update | Read | Create/Read/Update |
| **Metrics** | All | All | Read/Write | Read | Read/Write |
| **Logs** | All | All | Read/Write | Read | Read/Write |
| **Traces** | All | All | Read/Write | Read | Read/Write |
| **Dashboards** | All | All | Create/Read/Update | Read | Create/Read/Update |
| **Alerts** | All | All | Create/Read/Update | Read | Create/Read/Update |
| **Agents** | All | All | Create/Read/Update/Register | Read | Create/Read/Update/Register |
| **Uptime** | All | All | Create/Read/Update/Check | Read/Check | Create/Read/Update/Check |
| **Audit Logs** | Read/Export | Read/Export | Read | Read | Read |
| **System Admin** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Delete Operations** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Data Retention** | Permanent | Permanent | Permanent | Permanent | 6 hours |

---

## 🔄 Role Assignment

### Default Users

| User | Email | Password | Role | Organization | Tenant |
|------|-------|----------|------|--------------|--------|
| Super Administrator | superadmin.telemetryflow@telemetryflow.id | SuperAdmin@123456 | super_administrator | All | All |
| Administrator TelemetryFlow | administrator.telemetryflow@telemetryflow.id | Admin@123456 | administrator | TelemetryFlow | TelemetryFlow |
| Developer TelemetryFlow | developer.telemetryflow@telemetryflow.id | Developer@123456 | developer | TelemetryFlow | TelemetryFlow |
| Viewer TelemetryFlow | viewer.telemetryflow@telemetryflow.id | Viewer@123456 | viewer | TelemetryFlow | TelemetryFlow |
| Demo TelemetryFlow | demo.telemetryflow@telemetryflow.id | Demo@123456 | demo | Demo Org | Demo Tenant |

---

## 🛡️ Security Features

### Multi-Tenancy Isolation
- ✅ Organization-level data isolation
- ✅ Tenant-level query filtering
- ✅ Workspace-level resource scoping
- ✅ Demo environment complete isolation

### Demo Environment Protection
- ✅ Automatic data cleanup every 6 hours
- ✅ Cannot access production organizations
- ✅ Cannot access production workspaces
- ✅ Cannot access production tenants
- ✅ Separate domain: `demo.telemetryflow.id`

### Permission Enforcement
- ✅ Role-based access control (RBAC)
- ✅ Permission-based authorization
- ✅ Tenant-scoped queries
- ✅ Organization-scoped operations
- ✅ Audit logging for all actions

---

## 📝 Implementation Notes

### Role Seeding
Roles are seeded via `roles.seed.ts` with explicit permissions (no wildcards).

### User Assignment
Users are assigned roles via `users.seed.ts` with proper organization and tenant scoping.

### Demo Cleanup
Demo environment is automatically cleaned and reseeded every 6 hours via `demo-cleanup.seed.ts`.

### Permission Expansion
All wildcard permissions (`*`) are expanded to explicit permission names for clarity and security.

---

## 🎯 Best Practices

1. **Principle of Least Privilege**: Assign minimum required permissions
2. **Role Separation**: Use appropriate role for each user type
3. **Demo Isolation**: Keep demo users in demo organization only
4. **Regular Audits**: Review role assignments periodically
5. **Password Security**: Enforce strong passwords (12+ chars, uppercase, special char)
6. **MFA Enforcement**: Enable MFA for Super Admin and Administrator roles

---

**Status**: ✅ 5-Tier RBAC System Complete

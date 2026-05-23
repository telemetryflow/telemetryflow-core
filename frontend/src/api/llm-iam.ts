/**
 * IAM Context Mock Data for LLM AI Insights
 * Contains realistic Q&A pairs for identity, access management, and RBAC analysis
 */

export interface MockQA {
  question: string;
  answer: string;
}

export const IAM_MOCK_DATA: MockQA[] = [
  {
    question: "Show me the current user and role summary",
    answer: `## IAM Overview

### User Statistics
| Metric | Value | Trend |
|--------|-------|-------|
| Total Users | 48 | ↗ +3 this month |
| Active (30d) | 42 | 87.5% |
| Inactive | 6 | 12.5% |
| Pending Invitations | 3 | |
| Locked Accounts | 1 | |

### Role Distribution
| Role | Users | Permissions | Description |
|------|-------|-------------|-------------|
| Super Admin | 2 | 156 (all) | Full platform access |
| Org Admin | 5 | 124 | Organization management |
| Workspace Admin | 8 | 89 | Workspace-level control |
| Developer | 25 | 45 | Read + create + edit |
| Viewer | 8 | 12 | Read-only access |

### Recent Activity (Last 7 Days)
| Action | Count | By Role |
|--------|-------|---------|
| Login | 312 | All |
| API calls | 45,678 | Mostly Developer |
| Permission changes | 5 | Org Admin |
| User created | 3 | Org Admin |
| Password reset | 2 | Self-service |

### Security Status
- **MFA Enabled:** 38/48 (79.2%) ⚠️ Below 100% target
- **SSO Users:** 32/48 (66.7%)
- **API Key Auth:** 12 active API keys
- **Last Security Audit:** 14 days ago`,
  },
  {
    question: "Which users have excessive permissions?",
    answer: `## Permission Audit Report

### Users with Elevated Access
| User | Role | Extra Permissions | Last Active | Risk |
|------|------|-------------------|-------------|------|
| john.admin@company.com | Super Admin | N/A (inherent) | 2h ago | ⚠️ Review |
| sarah.devops@company.com | Developer | admin:delete, infra:write | 1d ago | 🔴 High |
| mike.intern@company.com | Developer | billing:read, audit:read | 5d ago | ⚠️ Medium |
| legacy-bot@system | Developer | admin:write, user:manage | 30d+ ago | 🔴 Critical |

### Unused Permission Analysis
| User | Permissions Granted | Permissions Used (90d) | Unused |
|------|-------------------|----------------------|--------|
| sarah.devops@ | 67 | 34 | 33 (49%) |
| mike.intern@ | 52 | 18 | 34 (65%) |
| legacy-bot@ | 45 | 0 | 45 (100%) |

### Recommendations
| Priority | Action | User | Reason |
|----------|--------|------|--------|
| 🔴 Critical | Disable account | legacy-bot@ | Inactive 30+ days, full admin perms |
| 🔴 High | Remove admin:delete | sarah.devops@ | Developer shouldn't have delete access |
| ⚠️ Medium | Remove billing:read | mike.intern@ | Intern doesn't need billing data |
| ⚠️ Medium | Enforce MFA | 10 users | Non-compliant with security policy |

### Principle of Least Privilege Score
- **Current Score:** 72/100
- **Target Score:** 90/100
- **Top Issue:** 4 users with permissions beyond their role`,
  },
  {
    question: "Show me login activity and suspicious access patterns",
    answer: `## Login Activity Analysis

### Login Summary (Last 7 Days)
| Metric | Value | vs Last Week |
|--------|-------|-------------|
| Total Logins | 312 | +8% |
| Unique Users | 42 | +2 |
| Failed Logins | 23 | ↗ +35% ⚠️ |
| MFA Challenges | 89 | +12% |
| SSO Logins | 234 | 75% |
| Password Logins | 78 | 25% |

### Suspicious Activity Detected
| Event | User | Time | Location | Risk |
|-------|------|------|----------|------|
| Multiple failed logins (8x) | admin@company.com | 3h ago | 185.xx.xx.xx (RU) | 🔴 Critical |
| Login from new country | dev.alex@company.com | 1d ago | Singapore | ⚠️ Medium |
| After-hours access | sarah.ops@company.com | 2d ago | 03:15 UTC | ℹ️ Low |
| Concurrent sessions (3) | john.admin@company.com | 5h ago | US, UK, DE | ⚠️ Medium |

### Login by Time of Day
\`\`\`
00-06:  ██░░░░░░░░░░░░░░░░░░  8%
06-09:  ██████████░░░░░░░░░░ 28%
09-12:  ████████████████░░░░ 32%  ← Peak
12-15:  ██████████░░░░░░░░░░ 18%
15-18:  ██████░░░░░░░░░░░░░░ 10%
18-24:  ██░░░░░░░░░░░░░░░░░░  4%
\`\`\`

### Login by Geography
| Country | Logins | Users | Expected |
|---------|--------|-------|----------|
| United States | 234 | 35 | ✅ Yes |
| United Kingdom | 45 | 5 | ✅ Yes |
| Germany | 23 | 3 | ✅ Yes |
| Singapore | 5 | 1 | ⚠️ New location |
| Russia | 8 | 0 | 🔴 Unexpected |

### Action Required
1. **CRITICAL:** Block IP 185.xx.xx.xx and force password reset for admin@company.com
2. **MEDIUM:** Verify dev.alex@company.com Singapore login is legitimate
3. **MEDIUM:** Review concurrent session policy for admin accounts`,
  },
  {
    question: "How do I configure SSO with SAML?",
    answer: `## SSO Configuration with SAML

### Supported Identity Providers
| Provider | Status | Protocol | Users |
|----------|--------|----------|-------|
| Okta | ✅ Supported | SAML 2.0 | — |
| Azure AD | ✅ Supported | SAML 2.0 / OIDC | — |
| Google Workspace | ✅ Supported | SAML 2.0 | — |
| OneLogin | ✅ Supported | SAML 2.0 | — |
| Custom | ✅ Supported | SAML 2.0 | — |

### Configuration Steps

#### 1. Get TelemetryFlow SP Metadata
\`\`\`bash
curl https://api.telemetryflow.id/api/v2/auth/sso/metadata \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`

#### 2. Configure Your IdP
| Field | Value |
|-------|-------|
| ACS URL | \`https://api.telemetryflow.id/api/v2/auth/sso/callback\` |
| Entity ID | \`https://telemetryflow.id\` |
| Name ID Format | \`urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress\` |

#### 3. Register IdP in TelemetryFlow
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/auth/sso/providers \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "name": "Company Okta",
    "type": "saml",
    "metadataUrl": "https://company.okta.com/app/xxx/sso/saml/metadata",
    "attributeMapping": {
      "email": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
      "firstName": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname",
      "lastName": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname",
      "role": "custom:role"
    },
    "defaultRole": "viewer",
    "autoProvision": true,
    "enforceSSO": false
  }'
\`\`\`

### Attribute Mapping
| SAML Attribute | TelemetryFlow Field | Required |
|---------------|---------------------|----------|
| email | User email | ✅ Yes |
| firstName | Display name | ✅ Yes |
| lastName | Display name | ✅ Yes |
| role | Default role assignment | ❌ Optional |
| groups | Team assignment | ❌ Optional |`,
  },
  {
    question: "What's the API key usage summary?",
    answer: `## API Key Usage Summary

### Active API Keys
| Key Name | Hint | Created | Last Used | Requests (30d) | Status |
|----------|------|---------|-----------|---------------|--------|
| Production Ingestion | sk-prod...x1a | 90d ago | 1m ago | 12,456,789 | ✅ Active |
| Staging Ingestion | sk-stag...b2c | 60d ago | 5m ago | 234,567 | ✅ Active |
| CI/CD Pipeline | sk-cicd...d3e | 45d ago | 2h ago | 8,901 | ✅ Active |
| Grafana Integration | sk-graf...f4g | 30d ago | 15m ago | 45,678 | ✅ Active |
| Dev Testing | sk-devt...h5i | 120d ago | 45d ago | 123 | ⚠️ Stale |
| Legacy Script | sk-legc...j6k | 200d ago | 90d+ ago | 0 | 🔴 Unused |

### Usage by Key (Last 24 Hours)
| Key | Requests | Errors | Rate Limit Hits | Bandwidth |
|-----|----------|--------|-----------------|-----------|
| Production | 415,226 | 234 (0.06%) | 12 | 89 GB |
| Staging | 7,823 | 45 (0.58%) | 0 | 1.2 GB |
| CI/CD | 234 | 2 (0.85%) | 0 | 0.1 GB |
| Grafana | 1,523 | 0 (0%) | 0 | 0.3 GB |

### Security Recommendations
| Priority | Action | Key | Reason |
|----------|--------|-----|--------|
| 🔴 High | Revoke | Legacy Script | Unused for 90+ days |
| ⚠️ Medium | Rotate | Dev Testing | Not used in 45 days |
| ℹ️ Low | Add IP restriction | Production | Currently unrestricted |
| ℹ️ Low | Enable rate limiting | All keys | Prevent abuse |

### Key Rotation Policy
- **Recommended:** Rotate every 90 days
- **Enforced:** No (consider enabling)
- **Keys overdue for rotation:** 2 (Dev Testing, Legacy Script)`,
  },
  {
    question: "Show me the RBAC permission matrix",
    answer: `## RBAC Permission Matrix

### 5-Tier Role Hierarchy
| Permission | Super Admin | Org Admin | WS Admin | Developer | Viewer |
|------------|:-----------:|:---------:|:--------:|:---------:|:------:|
| **Users** | | | | | |
| Create users | ✅ | ✅ | ✅ | ❌ | ❌ |
| Delete users | ✅ | ✅ | ❌ | ❌ | ❌ |
| Assign roles | ✅ | ✅ | ✅* | ❌ | ❌ |
| **Telemetry** | | | | | |
| View metrics/logs | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create dashboards | ✅ | ✅ | ✅ | ✅ | ❌ |
| Delete dashboards | ✅ | ✅ | ✅ | Own only | ❌ |
| **Alerts** | | | | | |
| View alerts | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create alert rules | ✅ | ✅ | ✅ | ✅ | ❌ |
| Acknowledge alerts | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Infrastructure** | | | | | |
| View infra | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage agents | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Settings** | | | | | |
| Billing/subscription | ✅ | ✅ | ❌ | ❌ | ❌ |
| API keys management | ✅ | ✅ | ✅ | Create own | ❌ |
| Audit logs | ✅ | ✅ | ✅ | ❌ | ❌ |
| Retention policies | ✅ | ✅ | ❌ | ❌ | ❌ |
| SSO configuration | ✅ | ✅ | ❌ | ❌ | ❌ |
| **System** | | | | | |
| Platform settings | ✅ | ❌ | ❌ | ❌ | ❌ |
| Region management | ✅ | ❌ | ❌ | ❌ | ❌ |

*WS Admin can only assign Developer or Viewer roles within their workspace.

### Custom Roles
| Role | Based On | Custom Permissions |
|------|----------|-------------------|
| SRE Lead | Developer | + infra:write, + alert:manage |
| Security Analyst | Viewer | + audit:read, + security:scan |
| Report Manager | Developer | + report:create, + report:schedule |`,
  },
  {
    question: "How many users have MFA enabled?",
    answer: `## MFA Compliance Report

### MFA Status Overview
| Status | Count | Percentage |
|--------|-------|------------|
| ✅ MFA Enabled | 38 | 79.2% |
| ❌ MFA Disabled | 10 | 20.8% |
| **Total** | **48** | **100%** |

### MFA by Role
| Role | Total | MFA Enabled | Compliance |
|------|-------|-------------|------------|
| Super Admin | 2 | 2 | ✅ 100% |
| Org Admin | 5 | 5 | ✅ 100% |
| Workspace Admin | 8 | 7 | ⚠️ 87.5% |
| Developer | 25 | 20 | ⚠️ 80% |
| Viewer | 8 | 4 | 🔴 50% |

### Non-Compliant Users
| User | Role | Created | Last Login | Action |
|------|------|---------|-----------|--------|
| viewer1@company.com | Viewer | 60d ago | 5d ago | Send reminder |
| viewer2@company.com | Viewer | 45d ago | 12d ago | Send reminder |
| viewer3@company.com | Viewer | 30d ago | 3d ago | Send reminder |
| viewer4@company.com | Viewer | 15d ago | 1d ago | Send reminder |
| dev1@company.com | Developer | 90d ago | 2d ago | Escalate |
| dev2@company.com | Developer | 120d ago | 8d ago | Escalate |
| dev3@company.com | Developer | 75d ago | 4d ago | Escalate |
| dev4@company.com | Developer | 100d ago | 6d ago | Escalate |
| dev5@company.com | Developer | 40d ago | 1d ago | Escalate |
| ws-admin1@company.com | WS Admin | 200d ago | 3d ago | URGENT |

### MFA Methods Used
| Method | Users | % of MFA Users |
|--------|-------|---------------|
| TOTP (Authenticator App) | 28 | 73.7% |
| WebAuthn / Security Key | 6 | 15.8% |
| SMS (deprecated) | 4 | 10.5% |

### Recommendations
1. **Enforce MFA** for all roles above Viewer within 14 days
2. **Migrate SMS MFA** users to TOTP or WebAuthn (SMS deprecated)
3. Consider **enforcing MFA at login** rather than optional enrollment`,
  },
  {
    question: "Generate an access review for compliance",
    answer: `## Quarterly Access Review Report

### Review Summary
| Metric | Value | Status |
|--------|-------|--------|
| Review Period | Q4 2024 | |
| Users Reviewed | 48 | 100% |
| Access Changes Needed | 12 | 25% |
| Completed Actions | 0 (pending) | ⚠️ |
| Compliance Deadline | 15 days | |

### Access Review Findings
| Category | Count | Severity | Action |
|----------|-------|----------|--------|
| Unused accounts (>60d inactive) | 3 | 🔴 High | Disable |
| Excessive permissions | 4 | 🔴 High | Reduce scope |
| Missing MFA | 10 | ⚠️ Medium | Enable MFA |
| Orphaned service accounts | 2 | ⚠️ Medium | Reassign owner |
| Stale API keys | 2 | ⚠️ Medium | Rotate/revoke |

### Detailed Findings
| User | Finding | Recommendation |
|------|---------|---------------|
| legacy-bot@ | Inactive 90d, admin perms | Disable immediately |
| test-user@ | Inactive 65d | Disable or reactivate |
| contractor1@ | Contract ended 30d ago | Disable |
| sarah.devops@ | Dev role + admin:delete | Remove admin:delete |
| mike.intern@ | Dev role + billing:read | Remove billing:read |

### Compliance Standards Checked
| Standard | Status | Findings |
|----------|--------|----------|
| SOC 2 (Access Control) | ⚠️ Partial | MFA gap, excess perms |
| ISO 27001 (A.9) | ⚠️ Partial | Inactive account cleanup |
| GDPR (Access Limitation) | ✅ Compliant | Data access properly scoped |
| HIPAA (if applicable) | ⚠️ Partial | Audit trail gaps |

### Next Steps
1. Complete all 🔴 High items within 7 days
2. Schedule MFA enforcement rollout
3. Implement automated access review alerts
4. Submit compliance report to auditors by deadline`,
  },
];

export const IAM_CONVERSATION_TITLES: string[] = [
  "User and role overview",
  "Permission audit findings",
  "Suspicious login investigation",
  "SSO configuration help",
  "Quarterly access review",
  "IAM audit: who changed what and when",
  "Over-privileged user identification",
  "Role consolidation recommendations",
  "SSO and SCIM provisioning review",
  "IAM policy compliance report",
];

// ==================== IAM USERS SUB-CONTEXT ====================

export const IAM_USERS_MOCK_DATA: MockQA[] = [
  {
    question: "Show all users and their current status",
    answer: `## User Management Overview

### User List (48 Total)
| User | Role | Status | MFA | Last Login | Created |
|------|------|--------|-----|-----------|---------|
| john.admin@company.com | Super Admin | ✅ Active | ✅ | 2h ago | 1y ago |
| sarah.devops@company.com | Developer | ✅ Active | ✅ | 1d ago | 8mo ago |
| mike.intern@company.com | Developer | ✅ Active | ❌ | 5d ago | 3mo ago |
| legacy-bot@system | Developer | ⚠️ Inactive | ❌ | 30d+ ago | 2y ago |
| contractor1@partner.com | Viewer | 🔴 Locked | ✅ | 2w ago | 6mo ago |
| pending-invite@newco.com | Developer | ⏳ Pending | — | Never | 3d ago |

### Status Summary
| Status | Count | Action Required |
|--------|-------|----------------|
| ✅ Active | 42 | — |
| ⚠️ Inactive (>30d) | 3 | Review & disable |
| 🔴 Locked | 1 | Investigate |
| ⏳ Pending Invitation | 3 | Follow up |

### Quick Actions Available
- **Invite user** → \`POST /api/v2/iam/users/invite\`
- **Disable user** → \`PATCH /api/v2/iam/users/{id}/disable\`
- **Reset password** → \`POST /api/v2/iam/users/{id}/reset-password\`
- **Revoke all sessions** → \`DELETE /api/v2/iam/users/{id}/sessions\``,
  },
  {
    question: "How do I invite a new user to the platform?",
    answer: `## User Invitation Guide

### Via UI
1. Navigate to **IAM → Users**
2. Click **Invite User**
3. Enter email address and select role
4. Optionally set workspace assignment
5. Click **Send Invitation**

The user will receive an email with a one-time invite link (expires in **48 hours**).

### Via API
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/iam/users/invite \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "email": "newuser@company.com",
    "roleId": "role-developer",
    "workspaceId": "ws-production-uuid",
    "message": "Welcome to TelemetryFlow!"
  }'
\`\`\`

### Invitation Settings
| Setting | Default | Configurable |
|---------|---------|-------------|
| Invite expiry | 48 hours | ✅ |
| Auto-assign role | Required | ✅ |
| Welcome message | None | ✅ |
| Require MFA on first login | No | ✅ |
| SSO auto-link | Yes (if SSO enabled) | ✅ |

### Bulk Invite (CSV Upload)
Upload a CSV with columns: \`email,role,workspace\`
Max 100 users per batch. Duplicate emails are skipped.`,
  },
  {
    question: "Which users are inactive or have locked accounts?",
    answer: `## Inactive & Locked Users Report

### Inactive Users (No login >30 days)
| User | Role | Last Login | Days Inactive | Recommended Action |
|------|------|-----------|--------------|-------------------|
| legacy-bot@system | Developer | 30d+ ago | 45 days | 🔴 Disable — service account unused |
| test-user@company.com | Viewer | 65d ago | 65 days | 🔴 Disable — test account |
| contractor1@partner.com | Viewer | 45d ago | 45 days | ⚠️ Verify contract status |

### Locked Accounts
| User | Reason | Locked At | Unlock Required By |
|------|--------|-----------|-------------------|
| alice.ops@company.com | 5 failed login attempts | 6h ago | Security team review |

### Pending Invitations (>7 days old)
| Email | Invited By | Invited | Expiry | Action |
|-------|-----------|---------|--------|--------|
| devnew@partner.com | john.admin | 8d ago | Expired | Re-send invite |

### Automated Recommendations
- **Enable auto-disable** for accounts inactive >60 days
- **Enable lockout policy** after 5 failed attempts (currently active)
- **Schedule quarterly access review** to catch stale accounts`,
  },
  {
    question: "How do I search and filter users in the user list?",
    answer: `## User Search and Filtering

### Available Filters
| Filter | Options | Example |
|--------|---------|---------|
| Status | Active, Inactive, Locked, Pending | \`status=active\` |
| Role | Any role name | \`role=developer\` |
| MFA | Enabled, Disabled | \`mfa=false\` |
| Workspace | Workspace name or ID | \`workspace=production\` |
| Last Login | Date range | \`lastLogin=gt:30d\` |
| Created | Date range | \`created=lt:90d\` |

### Via API with Filters
\`\`\`bash
# Get all inactive Developers without MFA
curl "https://api.telemetryflow.id/api/v2/iam/users?status=inactive&role=developer&mfa=false" \\
  -H "Authorization: Bearer $TOKEN"

# Search by email prefix
curl "https://api.telemetryflow.id/api/v2/iam/users?search=sarah" \\
  -H "Authorization: Bearer $TOKEN"

# Paginated results
curl "https://api.telemetryflow.id/api/v2/iam/users?page=2&limit=25&sort=lastLogin:asc" \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`

### Response Structure
\`\`\`json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 48,
    "pages": 2
  }
}
\`\`\`

### Tips
- Combine multiple filters with \`&\` — all filters are AND logic
- Use \`sort=lastLogin:asc\` to surface the most stale accounts first
- Export filtered results via \`GET /api/v2/iam/users/export?format=csv\``,
  },
  {
    question: "How do I perform bulk operations on users?",
    answer: `## Bulk User Operations

### Supported Bulk Actions
| Action | Endpoint | Max Users |
|--------|----------|-----------|
| Disable accounts | \`PATCH /api/v2/iam/users/bulk/disable\` | 100 |
| Enable accounts | \`PATCH /api/v2/iam/users/bulk/enable\` | 100 |
| Force MFA enrollment | \`PATCH /api/v2/iam/users/bulk/enforce-mfa\` | 100 |
| Reset passwords | \`POST /api/v2/iam/users/bulk/reset-password\` | 50 |
| Revoke all sessions | \`DELETE /api/v2/iam/users/bulk/sessions\` | 100 |
| Export to CSV | \`GET /api/v2/iam/users/export\` | Unlimited |

### Example: Disable Multiple Inactive Users
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/iam/users/bulk/disable \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "userIds": [
      "user-uuid-legacy-bot",
      "user-uuid-test-user",
      "user-uuid-contractor1"
    ],
    "reason": "Inactive accounts — quarterly access review"
  }'
\`\`\`

### Via UI
1. Navigate to **IAM → Users**
2. Apply filters to narrow the list
3. Check the **Select All** checkbox or pick individual users
4. Click **Bulk Actions** dropdown
5. Choose the operation and confirm

### Audit Trail
Every bulk action is logged in the audit system with:
- Who performed the action
- Which users were affected
- Timestamp and reason (if provided)`,
  },
  {
    question: "What are a user's profile fields and which ones can be edited?",
    answer: `## User Profile Fields

### Core Identity Fields
| Field | Editable By | Notes |
|-------|------------|-------|
| Email | Super Admin only | Changing email requires re-verification |
| First Name | User, Org Admin+ | Displayed in UI and notifications |
| Last Name | User, Org Admin+ | |
| Display Name | User, Org Admin+ | Defaults to first + last name |
| Avatar | User | URL or uploaded image, max 2 MB |
| Locale | User | Sets date/time format and language |
| Timezone | User | Used for alert scheduling and reports |

### Security Fields
| Field | Editable By | Notes |
|-------|------------|-------|
| Password | User (self-service), Admin (reset) | Min 12 chars, must include symbol |
| MFA Method | User | TOTP, WebAuthn, or SMS |
| Recovery Codes | User | Generated once, store securely |
| SSO Link | System | Set automatically on first SSO login |

### System Fields (Read-only)
| Field | Description |
|-------|-------------|
| User ID | UUID, immutable |
| Created At | Account creation timestamp |
| Last Login | Most recent successful login |
| Login Count | Total all-time logins |
| Status | Active / Inactive / Locked |
| Organization | Set at invite time, cannot change |

### Edit via API
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/iam/users/{userId} \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "firstName": "Sarah",
    "lastName": "DevOps",
    "timezone": "America/New_York",
    "locale": "en-US"
  }'
\`\`\``,
  },
  {
    question: "How do I view the audit trail for a specific user?",
    answer: `## User Audit Trail

### Audit Events Tracked Per User
| Event Category | Events |
|---------------|--------|
| Authentication | Login, logout, failed login, MFA challenge, session revocation |
| Profile Changes | Name change, email change, password reset, MFA enrollment |
| Permission Changes | Role assigned, role revoked, custom permission added |
| Resource Actions | Dashboards created/deleted, alerts created, API keys created |
| Admin Actions | Account enabled/disabled, password reset by admin |

### Via API
\`\`\`bash
# Get audit events for a specific user
curl "https://api.telemetryflow.id/api/v2/audit/events?userId={userId}&limit=50" \\
  -H "Authorization: Bearer $TOKEN"

# Filter to only auth events
curl "https://api.telemetryflow.id/api/v2/audit/events?userId={userId}&category=authentication" \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`

### Sample Audit Output
| Timestamp | Event | IP Address | Result |
|-----------|-------|-----------|--------|
| 2024-03-01 09:14 | login | 203.0.113.10 | ✅ Success |
| 2024-03-01 09:13 | login | 203.0.113.10 | ❌ Wrong password |
| 2024-02-28 17:22 | role_assigned | — | Developer → SRE Lead |
| 2024-02-27 11:05 | api_key_created | 203.0.113.10 | key: sk-prod...x1a |
| 2024-02-25 08:30 | mfa_enabled | 203.0.113.10 | TOTP configured |

### Retention
Audit logs are retained for **90 days** by default. Extend via Retention settings.`,
  },
  {
    question: "What happens when a user account gets locked and how do I unlock it?",
    answer: `## Account Lockout Policy

### Lockout Triggers
| Trigger | Default Threshold | Configurable |
|---------|-----------------|-------------|
| Failed password attempts | 5 consecutive | ✅ Yes |
| Failed MFA attempts | 3 consecutive | ✅ Yes |
| Suspicious geo-location | Admin flag | ✅ Yes |
| Manual lock by admin | Immediate | Always |

### Current Locked Accounts
| User | Reason | Locked At | Auto-Unlock |
|------|--------|-----------|------------|
| alice.ops@company.com | 5 failed logins | 6h ago | No (manual only) |

### How to Unlock a User

#### Via UI
1. Navigate to **IAM → Users**
2. Find the locked user (filter by Status = Locked)
3. Click the user row → **Unlock Account**
4. Optionally check **Force Password Reset on Next Login**

#### Via API
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/iam/users/{userId}/unlock \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "forcePasswordReset": true,
    "note": "Verified with user via phone — not a breach"
  }'
\`\`\`

### Configure Lockout Policy
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/iam/settings/lockout \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "maxFailedAttempts": 5,
    "lockoutDurationMinutes": 30,
    "autoUnlock": true
  }'
\`\`\`

### Recommendations
- Enable **auto-unlock after 30 minutes** for low-risk accounts
- Keep **manual unlock** for admin accounts to enforce investigation`,
  },
  {
    question: "How do I analyze user last-login data to find stale accounts?",
    answer: `## Last-Login Analysis

### Login Recency Distribution
| Last Login | User Count | Percentage | Action |
|-----------|-----------|------------|--------|
| < 7 days | 38 | 79.2% | ✅ Active |
| 7–30 days | 4 | 8.3% | ℹ️ Monitor |
| 30–60 days | 2 | 4.2% | ⚠️ Review |
| 60–90 days | 2 | 4.2% | 🔴 Disable candidate |
| > 90 days | 2 | 4.2% | 🔴 Disable immediately |

### Stale Account Details
| User | Role | Last Login | Days Ago | Recommended Action |
|------|------|-----------|----------|-------------------|
| legacy-bot@system | Developer | Jan 15, 2024 | 45 | Disable — service account |
| test-user@company.com | Viewer | Dec 28, 2023 | 65 | Disable — test account |
| old.contractor@ext.com | Developer | Dec 01, 2023 | 92 | 🔴 Disable immediately |

### Query Stale Users via API
\`\`\`bash
# Users who haven't logged in for 60+ days
curl "https://api.telemetryflow.id/api/v2/iam/users?lastLogin=gt:60d&status=active" \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`

### Automated Stale Account Policy
Configure automatic deactivation under **IAM → Settings → Lifecycle**:
- **Warn** at 45 days inactive (email notification to user)
- **Disable** at 60 days inactive (auto-deactivation)
- **Delete** at 90 days disabled (with data archival)

This reduces the attack surface from dormant accounts with valid credentials.`,
  },
  {
    question: "How do I manage user groups and team-based access?",
    answer: `## User Groups and Team Access

### Overview
Groups allow you to manage access for a set of users as a unit. Assigning a role to a group applies to all members simultaneously, reducing individual assignment overhead.

### Group Structure
| Group | Members | Role in Production | Role in Development |
|-------|---------|-------------------|-------------------|
| Platform SRE | 5 | SRE Lead | Developer |
| Backend Engineers | 12 | Developer | Developer |
| Security Team | 3 | Viewer + audit:read | Viewer + audit:read |
| QA Automation | 4 | Developer | Workspace Admin |
| Management | 6 | Viewer | Viewer |

### Creating a Group via API
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/iam/groups \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "name": "Platform SRE",
    "description": "Senior SREs with infra write access",
    "memberUserIds": ["user-1", "user-2", "user-3"]
  }'
\`\`\`

### Assign a Role to an Entire Group
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/iam/assignments \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "groupId": "group-sre-uuid",
    "roleId": "role-sre-lead",
    "workspaceId": "ws-production-uuid"
  }'
\`\`\`

### Group Membership Changes
When a user is added to a group, they immediately inherit all the group's role assignments.
When removed from a group, those group-based assignments are revoked — direct assignments remain.

### Benefits
- Onboarding: Add new hire to their team group → instant correct access
- Offboarding: Remove from group → access revoked across all group-assigned workspaces
- Role changes: Promote entire team by updating the group's role assignment once`,
  },
];

export const IAM_USERS_CONVERSATION_TITLES: string[] = [
  "User list and status review",
  "Invite and onboard users",
  "Inactive account cleanup",
  "User search and filtering",
  "Bulk user operations",
  "User profile fields",
  "User audit trail lookup",
  "Account lockout management",
  "Last-login stale account analysis",
  "User lifecycle automation",
];

// ==================== IAM ROLES SUB-CONTEXT ====================

export const IAM_ROLES_MOCK_DATA: MockQA[] = [
  {
    question: "Show all available roles and their permission counts",
    answer: `## Role Catalog

### Built-in Roles
| Role | Scope | Permissions | Users | Description |
|------|-------|-------------|-------|-------------|
| Super Admin | Platform | 156 (all) | 2 | Full platform control, including billing and region management |
| Org Admin | Organization | 124 | 5 | Manage users, workspaces, SSO, and org-level settings |
| Workspace Admin | Workspace | 89 | 8 | Manage workspace resources, API keys, and workspace users |
| Developer | Workspace | 45 | 25 | Read + create + edit telemetry, dashboards, alerts |
| Viewer | Workspace | 12 | 8 | Read-only access to all workspace data |

### Custom Roles (3)
| Role | Based On | Extra Permissions | Users |
|------|----------|-------------------|-------|
| SRE Lead | Developer | +infra:write, +alert:manage | 3 |
| Security Analyst | Viewer | +audit:read, +security:scan | 2 |
| Report Manager | Developer | +report:create, +report:schedule | 1 |

### Role Hierarchy
\`\`\`
Super Admin
  └── Org Admin
        └── Workspace Admin
              ├── Developer (+ custom extensions)
              └── Viewer
\`\`\`
Higher roles inherit all permissions from lower roles within their scope.`,
  },
  {
    question: "How do I create a custom role?",
    answer: `## Creating a Custom Role

### Via UI
1. Navigate to **IAM → Roles**
2. Click **Create Role**
3. Choose a **base role** to inherit from
4. Add or remove specific permissions
5. Set role name, description, and scope
6. Click **Save Role**

### Via API
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/iam/roles \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "name": "SRE Lead",
    "description": "Senior SRE with infra write access",
    "baseRoleId": "role-developer",
    "additionalPermissions": [
      "infra:write",
      "alert:manage",
      "agent:configure"
    ],
    "scope": "workspace"
  }'
\`\`\`

### Best Practices
| Rule | Why |
|------|-----|
| Use **least privilege** | Only grant permissions actually needed |
| **Base on closest role** | Reduces maintenance overhead |
| **Name descriptively** | e.g., "SRE Lead" not "custom-role-3" |
| **Limit custom roles** | Too many custom roles create audit complexity |
| **Review quarterly** | Remove unused custom roles |`,
  },
  {
    question: "What is the difference between Org Admin and Workspace Admin?",
    answer: `## Org Admin vs Workspace Admin

### Scope Comparison
| Capability | Org Admin | Workspace Admin |
|-----------|:---------:|:---------------:|
| **Scope** | Entire organization | Single workspace |
| Manage users (org-wide) | ✅ | ❌ |
| Manage users (in workspace) | ✅ | ✅ |
| Create workspaces | ✅ | ❌ |
| Delete workspaces | ✅ | ❌ |
| Configure SSO | ✅ | ❌ |
| View billing | ✅ | ❌ |
| Manage API keys (all WS) | ✅ | ❌ |
| Manage API keys (own WS) | ✅ | ✅ |
| Set retention policies | ✅ | ❌ |
| Configure alerts | ✅ | ✅ |
| Create dashboards | ✅ | ✅ |
| View audit logs | ✅ | ✅ |

### When to Use Which
**Assign Org Admin** when the user needs to:
- Manage multiple workspaces
- Handle user onboarding at org level
- Configure org-wide SSO and security policies

**Assign Workspace Admin** when the user needs to:
- Manage day-to-day operations within a single team/environment
- Control workspace API keys and quotas
- Manage workspace members without org-wide visibility`,
  },
  {
    question: "How does role hierarchy work and does a higher role inherit lower permissions?",
    answer: `## Role Hierarchy and Inheritance

### Hierarchy Structure
\`\`\`
Super Admin (Platform scope)
  └── Org Admin (Organization scope)
        └── Workspace Admin (Workspace scope)
              ├── Developer (Workspace scope)
              └── Viewer (Workspace scope)
\`\`\`

### Inheritance Rules
| Rule | Behavior |
|------|----------|
| Upward inheritance | Higher roles include all permissions of lower roles at the same scope |
| Scope boundary | Org Admin inherits Workspace Admin's workspace permissions org-wide |
| Custom roles | Do NOT auto-inherit from base role updates — changes must be applied manually |
| Direct grants | Individual permission grants stack on top of role permissions |

### Effective Permissions Example
A **Workspace Admin** has all permissions that a Developer has, plus:
- \`user:manage\` (workspace-scoped)
- \`api-key:manage\` (workspace-scoped)
- \`audit:read\`
- \`infra:write\`
- \`agent:configure\`

### What Inheritance Does NOT Do
- It does not grant cross-workspace access from a lower role
- Revoking a base role permission does NOT automatically update custom roles based on it
- Super Admin scope is not inheritable — it must be explicitly assigned

### Best Practice
Always assign the **most restrictive role** that still allows the user to do their job. Use custom roles to surgically add missing permissions rather than escalating to a broader built-in role.`,
  },
  {
    question: "How do I clone an existing role to create a new one?",
    answer: `## Cloning a Role

### Via UI
1. Navigate to **IAM → Roles**
2. Click the three-dot menu next to any role
3. Select **Clone Role**
4. Enter a new name and description
5. Adjust permissions as needed
6. Click **Save**

### Via API
\`\`\`bash
# Clone the Developer role into a new "SRE Lead" role
curl -X POST https://api.telemetryflow.id/api/v2/iam/roles/{sourceRoleId}/clone \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "name": "SRE Lead",
    "description": "Developer + infra write access for senior SREs",
    "additionalPermissions": ["infra:write", "agent:configure", "alert:manage"],
    "removePermissions": []
  }'
\`\`\`

### Clone vs Create from Scratch
| Approach | When to Use |
|----------|-------------|
| Clone | When the new role is mostly the same as an existing role |
| Create from scratch | When the role has a fundamentally different permission set |
| Base role extension | When you need a small additive change and want automatic base updates |

### After Cloning
- Assign the new role to users via **IAM → Assignments**
- Cloned roles are independent — changes to the original role do NOT propagate
- Review the cloned role permissions quarterly to ensure they remain appropriate`,
  },
  {
    question: "Which users are currently assigned to each role?",
    answer: `## Users per Role

### Role Assignment Counts
| Role | Users | Active (30d) | MFA Rate |
|------|-------|-------------|---------|
| Super Admin | 2 | 2 | 100% |
| Org Admin | 5 | 5 | 100% |
| Workspace Admin | 8 | 7 | 87.5% |
| Developer | 25 | 21 | 80% |
| SRE Lead (custom) | 3 | 3 | 100% |
| Security Analyst (custom) | 2 | 1 | 50% |
| Report Manager (custom) | 1 | 1 | 100% |
| Viewer | 8 | 5 | 50% |

### Who Has Each Built-in Role
\`\`\`
Super Admin:   john.admin@company.com, platform-bot@system
Org Admin:     org-admin@company.com (+4 others)
WS Admin:      ws-admin-prod@, ws-admin-dev@, ws-admin-qa@ (+5)
Developer:     sarah.devops@, mike.intern@, dev1@ ... dev22@
Viewer:        viewer1@ ... viewer8@
\`\`\`

### Via API
\`\`\`bash
# List all users with a specific role
curl "https://api.telemetryflow.id/api/v2/iam/roles/{roleId}/users" \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`

### Alerts
- ⚠️ **Security Analyst** role has 50% MFA rate — enforce MFA for this role since it accesses audit logs
- ⚠️ **Viewer** role has 50% MFA rate — send enrollment reminders`,
  },
  {
    question: "What are the built-in roles and can they be modified?",
    answer: `## Built-in Roles Reference

### Built-in Role Definitions
| Role | Scope | Immutable Core | Extensible |
|------|-------|---------------|-----------|
| Super Admin | Platform | ✅ Yes | ❌ No |
| Org Admin | Organization | ✅ Yes | ❌ No |
| Workspace Admin | Workspace | ✅ Yes | ❌ No |
| Developer | Workspace | ✅ Yes | ❌ No |
| Viewer | Workspace | ✅ Yes | ❌ No |

### Can Built-in Roles Be Modified?
**No.** Built-in roles have a fixed, immutable permission set enforced by the platform. This prevents accidental security misconfigurations.

**Instead, you should:**
1. **Clone** the built-in role and modify the clone
2. **Create a custom role** based on the built-in role
3. **Add individual permission grants** to specific users on top of their role

### Built-in Role Permission Counts
| Role | Total | Read | Write | Admin |
|------|-------|------|-------|-------|
| Super Admin | 156 | 40 | 60 | 56 |
| Org Admin | 124 | 40 | 50 | 34 |
| Workspace Admin | 89 | 40 | 35 | 14 |
| Developer | 45 | 40 | 5 | 0 |
| Viewer | 12 | 12 | 0 | 0 |

### Why Built-in Roles Are Immutable
- Ensures predictable, auditable access control
- Simplifies compliance reporting (known baseline)
- Prevents privilege escalation through role modification
- Platform upgrades can safely add new permissions to built-in roles`,
  },
  {
    question: "How do I compare permissions between two roles?",
    answer: `## Role Permission Comparison

### Developer vs SRE Lead (Custom)
| Permission | Developer | SRE Lead |
|-----------|:---------:|:--------:|
| metrics:read | ✅ | ✅ |
| logs:read | ✅ | ✅ |
| traces:read | ✅ | ✅ |
| dashboard:create | ✅ | ✅ |
| alert:create | ✅ | ✅ |
| alert:manage | ✅ | ✅ |
| report:create | ✅ | ✅ |
| infra:write | ❌ | ✅ |
| agent:configure | ❌ | ✅ |
| kubernetes:read | ✅ | ✅ |
| kubernetes:write | ❌ | ❌ |

### Differences (SRE Lead has 2 extra permissions)
| Extra Permission | Description |
|----------------|-------------|
| \`infra:write\` | Configure monitoring thresholds |
| \`agent:configure\` | Deploy and configure telemetry agents |

### Via API
\`\`\`bash
# Compare two roles — returns diff of permissions
curl "https://api.telemetryflow.id/api/v2/iam/roles/compare?roleA={roleIdA}&roleB={roleIdB}" \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`

### Response
\`\`\`json
{
  "onlyInA": ["infra:write", "agent:configure"],
  "onlyInB": [],
  "common": ["metrics:read", "logs:read", "dashboard:create", ...]
}
\`\`\`

### Use Cases for Role Comparison
- Before cloning: understand what you're starting from
- Before assigning: verify the role matches user's job function
- During access review: identify roles that are too similar and could be consolidated`,
  },
  {
    question: "What are best practices for managing roles at scale?",
    answer: `## Role Management Best Practices

### Core Principles
| Principle | Description |
|-----------|-------------|
| Least Privilege | Grant the minimum permissions needed for the job |
| Role-per-Job-Function | Map roles to job titles, not individuals |
| Limit Custom Roles | Keep custom roles < 10; too many creates audit complexity |
| Named Service Accounts | Never share credentials; one service account per integration |
| Quarterly Review | Audit role assignments every 90 days |

### Recommended Role Structure
\`\`\`
Workspaces:  Production, Development, QA, Sandbox
Roles:
  - WS Admin → Team leads per workspace
  - Developer → Engineers and DevOps
  - SRE Lead (custom) → Senior SRE engineers only
  - Viewer → Stakeholders, managers, external auditors
\`\`\`

### Anti-Patterns to Avoid
| Anti-Pattern | Risk | Better Approach |
|-------------|------|----------------|
| Giving everyone Developer | Excess write permissions | Use Viewer for read-only stakeholders |
| Super Admin for daily work | Blast radius if account is compromised | Use Org Admin for routine tasks |
| Sharing service account keys | Non-repudiation impossible | One key per service, rotate every 90 days |
| Custom role sprawl | Audit becomes impossible | Consolidate similar custom roles |

### Role Lifecycle
1. **Create** — based on job function, least privilege
2. **Assign** — via formal access request or invitation
3. **Review** — quarterly audit for active usage
4. **Revoke** — immediately on offboarding or role change
5. **Archive** — disable unused custom roles rather than deleting (preserves audit trail)`,
  },
  {
    question: "How do I audit which roles were created, modified, or deleted?",
    answer: `## Role Audit Log

### Audited Role Events
| Event | Triggered By | Logged Fields |
|-------|-------------|--------------|
| Role created | Admin | Role name, permissions list, creator |
| Role updated | Admin | Changed permissions (before/after diff) |
| Role deleted | Admin | Role name, affected users at time of deletion |
| Role cloned | Admin | Source role, new role name |
| Permission added to role | Admin | Permission, role, actor |
| Permission removed from role | Admin | Permission, role, actor, affected user count |

### Via API
\`\`\`bash
# Audit events for all role changes
curl "https://api.telemetryflow.id/api/v2/audit/events?category=role&limit=50" \\
  -H "Authorization: Bearer $TOKEN"

# Changes to a specific role
curl "https://api.telemetryflow.id/api/v2/audit/events?category=role&resourceId={roleId}" \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`

### Sample Role Audit Output
| Timestamp | Event | Role | Actor | Detail |
|-----------|-------|------|-------|--------|
| 2024-03-01 10:00 | role_created | SRE Lead | org-admin@ | Cloned from Developer |
| 2024-03-01 10:02 | permission_added | SRE Lead | org-admin@ | + infra:write |
| 2024-02-15 14:30 | permission_removed | Developer | org-admin@ | - billing:read |
| 2024-01-20 09:00 | role_deleted | Old QA Role | org-admin@ | 0 users affected |

### Role Audit Report
Generate a full role change report for compliance:
\`\`\`bash
curl "https://api.telemetryflow.id/api/v2/audit/reports/roles?period=Q4-2024&format=pdf" \\
  -H "Authorization: Bearer $TOKEN" \\
  -o role-audit-Q4-2024.pdf
\`\`\`

### Retention
Role audit events follow the audit log retention policy: **90 days** default, configurable up to **365 days** under Retention settings.`,
  },
];

export const IAM_ROLES_CONVERSATION_TITLES: string[] = [
  "Role catalog and hierarchy",
  "Custom role creation",
  "Admin role comparison",
  "Role hierarchy and inheritance",
  "Clone a role",
  "Users assigned to each role",
  "Built-in roles reference",
  "Compare roles side-by-side",
  "Role management best practices",
  "Role lifecycle and offboarding",
];

// ==================== IAM PERMISSIONS SUB-CONTEXT ====================

export const IAM_PERMISSIONS_MOCK_DATA: MockQA[] = [
  {
    question: "Show me all available permissions by category",
    answer: `## Permission Catalog

### Telemetry Permissions
| Permission | Action | Description |
|-----------|--------|-------------|
| \`metrics:read\` | Read | View metric data and graphs |
| \`logs:read\` | Read | View log entries |
| \`traces:read\` | Read | View distributed traces |
| \`exemplars:read\` | Read | View trace exemplars |
| \`correlations:read\` | Read | View cross-signal correlations |

### Infrastructure & Monitoring
| Permission | Action | Description |
|-----------|--------|-------------|
| \`infra:read\` | Read | View infrastructure metrics |
| \`infra:write\` | Write | Configure monitoring thresholds |
| \`agent:read\` | Read | View agent status |
| \`agent:configure\` | Write | Configure agents |
| \`kubernetes:read\` | Read | View Kubernetes resources |

### Alerts & Reporting
| Permission | Action | Description |
|-----------|--------|-------------|
| \`alert:read\` | Read | View alerts and rules |
| \`alert:create\` | Write | Create alert rules |
| \`alert:manage\` | Admin | Acknowledge, silence, delete alerts |
| \`report:read\` | Read | View reports |
| \`report:create\` | Write | Create and schedule reports |

### Admin Permissions
| Permission | Action | Description |
|-----------|--------|-------------|
| \`user:read\` | Read | View user list |
| \`user:manage\` | Admin | Invite, disable, modify users |
| \`audit:read\` | Read | View audit logs |
| \`billing:read\` | Read | View subscription and billing |
| \`platform:settings\` | Admin | Modify platform configuration |
| \`api-key:manage\` | Admin | Create, revoke API keys |`,
  },
  {
    question: "What permissions are required to create dashboards?",
    answer: `## Dashboard Permissions

### Required Permissions
| Action | Permissions Needed | Role with Access |
|--------|-------------------|-----------------|
| View dashboards | \`metrics:read\`, \`logs:read\` | All roles (Viewer+) |
| Create dashboards | \`dashboard:create\` | Developer+ |
| Edit own dashboards | \`dashboard:write:own\` | Developer+ |
| Edit all dashboards | \`dashboard:write\` | Workspace Admin+ |
| Delete own dashboards | \`dashboard:delete:own\` | Developer+ |
| Delete any dashboard | \`dashboard:delete\` | Workspace Admin+ |
| Share dashboards | \`dashboard:share\` | Developer+ |
| Set as default | \`dashboard:default\` | Workspace Admin+ |

### Adding Dashboard Permission to a User
If a Viewer needs to create dashboards, you can:
1. Upgrade their role to Developer, or
2. Create a custom role: \`Viewer + dashboard:create\`

\`\`\`bash
# Assign additional permission via API
curl -X POST https://api.telemetryflow.id/api/v2/iam/users/{userId}/permissions \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "permission": "dashboard:create" }'
\`\`\``,
  },
  {
    question: "How are permissions organized in the naming convention?",
    answer: `## Permission Naming Convention

### Format: \`resource:action[:scope]\`

| Part | Description | Examples |
|------|-------------|---------|
| **resource** | The resource type | \`metric\`, \`alert\`, \`user\`, \`report\` |
| **action** | The operation | \`read\`, \`write\`, \`delete\`, \`manage\` |
| **scope** (optional) | Limits the action | \`:own\`, \`:workspace\`, \`:org\` |

### Action Hierarchy
\`\`\`
manage ← admin-level (includes all below)
  write  ← create + edit
    read ← view only
\`\`\`

### Examples
| Permission | Meaning |
|-----------|---------|
| \`alert:read\` | View alerts |
| \`alert:write\` | Create and edit alert rules |
| \`alert:manage\` | + acknowledge, silence, delete |
| \`dashboard:delete:own\` | Delete only your own dashboards |
| \`report:create\` | Create new reports |
| \`platform:admin\` | Full platform administration |

### Scope Inheritance
A user with \`dashboard:write\` implicitly has \`dashboard:read\`.
A user with \`dashboard:manage\` implicitly has \`dashboard:write\` and \`dashboard:read\`.`,
  },
  {
    question: "How do I list all permissions for a specific module?",
    answer: `## Permissions by Module

### Module Permission Reference
| Module | Permissions |
|--------|------------|
| Metrics | \`metrics:read\`, \`metrics:write\` |
| Logs | \`logs:read\`, \`logs:write\`, \`logs:delete\` |
| Traces | \`traces:read\`, \`traces:write\` |
| Exemplars | \`exemplars:read\` |
| Correlations | \`correlations:read\` |
| Dashboards | \`dashboard:read\`, \`dashboard:create\`, \`dashboard:write\`, \`dashboard:delete\`, \`dashboard:delete:own\`, \`dashboard:share\`, \`dashboard:default\` |
| Alerts | \`alert:read\`, \`alert:create\`, \`alert:write\`, \`alert:manage\` |
| Reports | \`report:read\`, \`report:create\`, \`report:schedule\` |
| Infrastructure | \`infra:read\`, \`infra:write\` |
| Kubernetes | \`kubernetes:read\`, \`kubernetes:write\`, \`kubernetes:manage\` |
| Agents | \`agent:read\`, \`agent:configure\`, \`agent:manage\` |
| Uptime | \`uptime:read\`, \`uptime:create\`, \`uptime:manage\` |
| Status Page | \`status-page:read\`, \`status-page:manage\` |
| IAM / Users | \`user:read\`, \`user:manage\` |
| Audit | \`audit:read\` |
| API Keys | \`api-key:create:own\`, \`api-key:manage\` |
| Billing | \`billing:read\`, \`billing:manage\` |
| LLM | \`llm:chat\`, \`llm:configure\` |
| Platform | \`platform:settings\`, \`tenancy:manage\`, \`retention:manage\` |

### Via API
\`\`\`bash
# List all permissions for the alerts module
curl "https://api.telemetryflow.id/api/v2/iam/permissions?module=alerts" \\
  -H "Authorization: Bearer $TOKEN"
\`\`\``,
  },
  {
    question: "What are wildcard permissions and are they supported?",
    answer: `## Wildcard Permissions

### Overview
TelemetryFlow supports wildcard permissions for service accounts and automation scenarios where broad access is intentional and audited.

### Wildcard Syntax
| Pattern | Meaning |
|---------|---------|
| \`*\` | All permissions across all resources |
| \`metrics:*\` | All actions on the metrics resource |
| \`*:read\` | Read action on all resources |
| \`dashboard:*\` | All dashboard permissions |

### Supported Wildcards
| Wildcard | Equivalent To | Use Case |
|---------|--------------|---------|
| \`metrics:*\` | metrics:read + metrics:write | Data pipeline service accounts |
| \`alert:*\` | alert:read + alert:create + alert:write + alert:manage | Alert automation bots |
| \`report:*\` | report:read + report:create + report:schedule | Report generation services |

### Restrictions
- Wildcards are **not available** to user accounts — only service accounts and API keys
- \`*\` (full wildcard) requires **Super Admin** approval and is logged at creation
- Wildcard API keys appear with a ⚠️ badge in the API Keys list

### Assign Wildcard via API
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/iam/api-keys \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "name": "Ingestion Pipeline",
    "permissions": ["metrics:*", "logs:*", "traces:*"],
    "note": "OTEL collector service account"
  }'
\`\`\`

### Audit Note
All wildcard permission grants are highlighted in the quarterly access review report for mandatory review.`,
  },
  {
    question: "How do I check the effective permissions for a specific user?",
    answer: `## Checking Effective Permissions

### What Are Effective Permissions?
A user's effective permissions are the union of:
1. Permissions from their assigned **role**
2. **Direct permission grants** added to the user
3. Any **workspace-level** overrides

### Via UI
1. Navigate to **IAM → Users**
2. Click on the user
3. Select the **Permissions** tab
4. Toggle between **Role Permissions**, **Direct Grants**, and **Effective** (merged view)

### Via API
\`\`\`bash
# Get effective permissions for a user in a workspace
curl "https://api.telemetryflow.id/api/v2/iam/users/{userId}/permissions/effective?workspaceId={wsId}" \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`

### Sample Response
\`\`\`json
{
  "userId": "user-uuid",
  "workspaceId": "ws-prod-uuid",
  "rolePermissions": ["metrics:read", "logs:read", "dashboard:create"],
  "directGrants": ["audit:read", "billing:read"],
  "effectivePermissions": ["metrics:read", "logs:read", "dashboard:create", "audit:read", "billing:read"],
  "deniedPermissions": []
}
\`\`\`

### Check a Single Permission
\`\`\`bash
# Does this user have alert:manage in production?
curl "https://api.telemetryflow.id/api/v2/iam/users/{userId}/permissions/check?permission=alert:manage&workspaceId={wsId}" \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`

### Response
\`\`\`json
{ "allowed": true, "source": "role:developer" }
\`\`\``,
  },
  {
    question: "Can I deny specific permissions to override what a role grants?",
    answer: `## Permission Deny Rules

### How Deny Rules Work
Deny rules explicitly block a permission even if a user's role would otherwise grant it. They take precedence over all grants.

\`\`\`
Effective = (Role Permissions + Direct Grants) - Deny Rules
\`\`\`

### Use Cases for Deny Rules
| Scenario | Deny Rule |
|----------|----------|
| Developer who must not access billing | \`billing:read\` denied |
| Contractor with no audit access | \`audit:read\` denied |
| Workspace Admin without billing visibility | \`billing:manage\` denied |
| Temporary restriction during investigation | Any permission |

### Add a Deny Rule via API
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/iam/users/{userId}/permissions/deny \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "permission": "billing:read",
    "workspaceId": "ws-production-uuid",
    "reason": "Contractor — no billing access per contract terms",
    "expiresAt": "2024-06-01T00:00:00Z"
  }'
\`\`\`

### Viewing Active Deny Rules
\`\`\`bash
curl "https://api.telemetryflow.id/api/v2/iam/users/{userId}/permissions/deny" \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`

### Deny Rule Expiry
- Deny rules can be set with an \`expiresAt\` date for temporary restrictions
- Expired rules are automatically removed and logged in the audit trail
- Permanent deny rules require admin review every 90 days

### Important Notes
- Deny rules do NOT apply to Super Admin accounts
- All deny rule changes are recorded in the audit log`,
  },
  {
    question: "How do I export the full permission list for compliance reporting?",
    answer: `## Exporting Permissions for Compliance

### Export Options
| Format | Endpoint | Contents |
|--------|----------|---------|
| CSV | \`GET /api/v2/iam/permissions/export?format=csv\` | All permissions with descriptions |
| JSON | \`GET /api/v2/iam/permissions/export?format=json\` | Structured permission catalog |
| PDF | \`GET /api/v2/iam/permissions/export?format=pdf\` | Formatted compliance report |

### Export All User Permission Assignments
\`\`\`bash
# Full matrix: every user + their effective permissions
curl "https://api.telemetryflow.id/api/v2/iam/permissions/export?scope=assignments&format=csv" \\
  -H "Authorization: Bearer $TOKEN" \\
  -o user-permission-report.csv
\`\`\`

### CSV Columns
| Column | Description |
|--------|-------------|
| user_email | User email address |
| user_status | Active / Inactive / Locked |
| role_name | Assigned role |
| permission | Permission identifier |
| grant_source | Role or direct grant |
| workspace | Workspace name |
| granted_at | Date permission was granted |
| granted_by | Admin who granted it |

### Scheduled Compliance Exports
Configure automatic weekly exports:
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/reports \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "name": "Weekly Permission Audit",
    "type": "iam-permission-export",
    "schedule": "0 6 * * MON",
    "format": "csv",
    "recipients": ["security@company.com"]
  }'
\`\`\`

Standards this export supports: **SOC 2**, **ISO 27001 (A.9)**, **HIPAA**, **GDPR**`,
  },
  {
    question: "What is the impact of removing a permission from a role?",
    answer: `## Permission Impact Analysis

### Before Removing a Permission
Always run an impact analysis to understand how many users will be affected.

### Via API
\`\`\`bash
# What happens if we remove dashboard:create from Developer role?
curl "https://api.telemetryflow.id/api/v2/iam/permissions/impact?permission=dashboard:create&roleId=role-developer" \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`

### Sample Impact Report
\`\`\`json
{
  "permission": "dashboard:create",
  "affectedRoles": ["Developer", "SRE Lead"],
  "affectedUsers": 28,
  "activeUsers30d": 22,
  "resourcesOwned": {
    "dashboards": 147
  },
  "breakingWorkflows": ["Cannot create new dashboards", "Cannot save modified dashboards as new"]
}
\`\`\`

### Impact Summary Table
| Metric | Value |
|--------|-------|
| Users affected | 28 |
| Active users affected (30d) | 22 |
| Dashboards they own | 147 |
| Alternative roles available | Viewer (loses create), WS Admin (gains admin) |

### Safe Removal Checklist
1. Run impact analysis — confirm affected user count
2. Communicate change to affected team leads 2 weeks in advance
3. Consider creating a custom role that bridges the gap
4. Apply the change during off-peak hours
5. Monitor for support tickets or access-denied errors in audit logs for 48 hours after

### Rollback
\`\`\`bash
# Re-add permission to role
curl -X POST https://api.telemetryflow.id/api/v2/iam/roles/{roleId}/permissions \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "permission": "dashboard:create" }'
\`\`\``,
  },
  {
    question: "Are there permission templates I can apply to quickly set up common access patterns?",
    answer: `## Permission Templates

### What Are Permission Templates?
Permission templates are pre-defined sets of permissions grouped around a common job function or use case. Applying a template assigns all included permissions in a single action.

### Built-in Templates
| Template Name | Permissions Included | Designed For |
|-------------|---------------------|-------------|
| Read-only Observability | \`metrics:read\`, \`logs:read\`, \`traces:read\`, \`dashboard:read\` | Stakeholders, managers |
| Alert Manager | \`alert:read\`, \`alert:create\`, \`alert:write\`, \`alert:manage\` | On-call engineers |
| Report Operator | \`report:read\`, \`report:create\`, \`report:schedule\` | BI team, compliance |
| Infrastructure Observer | \`infra:read\`, \`kubernetes:read\`, \`agent:read\` | Non-technical observers |
| Security Auditor | \`audit:read\`, \`user:read\`, \`api-key:manage\` | Security analysts |
| Full Developer | All Developer role permissions | Standard developer onboarding |

### Apply a Template via API
\`\`\`bash
# Apply the Alert Manager template to a user
curl -X POST https://api.telemetryflow.id/api/v2/iam/users/{userId}/permissions/template \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "templateId": "template-alert-manager",
    "workspaceId": "ws-production-uuid"
  }'
\`\`\`

### Create a Custom Template
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/iam/permission-templates \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "name": "SRE On-Call",
    "description": "Permissions needed during on-call shift",
    "permissions": ["alert:manage", "infra:write", "agent:configure", "uptime:manage"]
  }'
\`\`\`

### Template vs Custom Role
| Approach | When to Use |
|----------|-------------|
| Template | Temporary or additive permissions on top of an existing role |
| Custom role | Permanent, named, auditable job-function-based access |`,
  },
];

export const IAM_PERMISSIONS_CONVERSATION_TITLES: string[] = [
  "Permission catalog overview",
  "Dashboard creation permissions",
  "Permission naming convention",
  "Permissions by module",
  "Wildcard permissions",
  "Effective permissions for a user",
  "Deny rules and overrides",
  "Export permissions for compliance",
  "Permission impact analysis",
  "Permission templates and best practices",
];

// ==================== IAM MATRIX SUB-CONTEXT ====================

export const IAM_MATRIX_MOCK_DATA: MockQA[] = [
  {
    question: "Show the full role-permission matrix",
    answer: `## Role-Permission Matrix

### Core Permissions
| Permission | Super Admin | Org Admin | WS Admin | Developer | Viewer |
|-----------|:-----------:|:---------:|:--------:|:---------:|:------:|
| metrics:read | ✅ | ✅ | ✅ | ✅ | ✅ |
| logs:read | ✅ | ✅ | ✅ | ✅ | ✅ |
| traces:read | ✅ | ✅ | ✅ | ✅ | ✅ |
| dashboard:create | ✅ | ✅ | ✅ | ✅ | ❌ |
| dashboard:delete | ✅ | ✅ | ✅ | Own only | ❌ |
| alert:create | ✅ | ✅ | ✅ | ✅ | ❌ |
| alert:manage | ✅ | ✅ | ✅ | ✅ | ❌ |
| report:create | ✅ | ✅ | ✅ | ✅ | ❌ |
| user:manage | ✅ | ✅ | WS only | ❌ | ❌ |
| audit:read | ✅ | ✅ | ✅ | ❌ | ❌ |
| billing:read | ✅ | ✅ | ❌ | ❌ | ❌ |
| api-key:manage | ✅ | ✅ | ✅ | Own only | ❌ |
| retention:manage | ✅ | ✅ | ❌ | ❌ | ❌ |
| infra:write | ✅ | ✅ | ✅ | ❌ | ❌ |
| platform:settings | ✅ | ❌ | ❌ | ❌ | ❌ |
| tenancy:manage | ✅ | ❌ | ❌ | ❌ | ❌ |

### Summary by Role
| Role | Total Permissions | Read | Write | Admin |
|------|-----------------|------|-------|-------|
| Super Admin | 156 | 40 | 60 | 56 |
| Org Admin | 124 | 40 | 50 | 34 |
| Workspace Admin | 89 | 40 | 35 | 14 |
| Developer | 45 | 40 | 5 | 0 |
| Viewer | 12 | 12 | 0 | 0 |`,
  },
  {
    question: "Which roles have write access to infrastructure resources?",
    answer: `## Infrastructure Write Permissions by Role

### Infra Write Access Matrix
| Permission | Super Admin | Org Admin | WS Admin | Developer | Viewer |
|-----------|:-----------:|:---------:|:--------:|:---------:|:------:|
| infra:write | ✅ | ✅ | ✅ | ❌ | ❌ |
| agent:configure | ✅ | ✅ | ✅ | ❌ | ❌ |
| kubernetes:write | ✅ | ✅ | ❌ | ❌ | ❌ |
| kubernetes:manage | ✅ | ✅ | ❌ | ❌ | ❌ |
| uptime:manage | ✅ | ✅ | ✅ | ❌ | ❌ |
| status-page:manage | ✅ | ✅ | ✅ | ❌ | ❌ |

### Summary
- **Super Admin & Org Admin**: Full infra write access
- **Workspace Admin**: Can configure agents, uptime checks, and status pages but NOT Kubernetes
- **Developer & Viewer**: Read-only access to all infrastructure resources

### Grant Infra Write to a Developer
If you need a Developer to configure agents or thresholds:
1. Create a custom role: \`Developer + infra:write + agent:configure\`
2. Or assign the **SRE Lead** custom role if already configured

> ⚠️ Avoid granting \`infra:write\` directly to Developer role — create a named custom role for auditability.`,
  },
  {
    question: "Compare Developer and Viewer permission differences",
    answer: `## Developer vs Viewer: Permission Comparison

### Permissions Only Developers Have
| Permission | Developer Has | Viewer Has |
|-----------|:-------------:|:----------:|
| dashboard:create | ✅ | ❌ |
| dashboard:delete:own | ✅ | ❌ |
| alert:create | ✅ | ❌ |
| alert:manage | ✅ | ❌ |
| report:create | ✅ | ❌ |
| report:schedule | ✅ | ❌ |
| api-key:create:own | ✅ | ❌ |
| llm:chat | ✅ | ❌ |
| exemplars:read | ✅ | ❌ |
| uptime:create | ✅ | ❌ |

### Shared Permissions (Both Have)
| Permission | Developer | Viewer |
|-----------|:---------:|:------:|
| metrics:read | ✅ | ✅ |
| logs:read | ✅ | ✅ |
| traces:read | ✅ | ✅ |
| dashboard:read | ✅ | ✅ |
| alert:read | ✅ | ✅ |
| infra:read | ✅ | ✅ |
| kubernetes:read | ✅ | ✅ |

### When to Upgrade Viewer → Developer
Upgrade if the user needs to:
- Create or manage dashboards
- Set up alert rules
- Generate or schedule reports
- Create API keys for their applications`,
  },
  {
    question: "How do I filter the permission matrix to show only a specific module?",
    answer: `## Filtering the Permission Matrix

### Via UI
1. Navigate to **IAM → Matrix**
2. Use the **Module** dropdown to select a specific area (e.g., Alerts, Dashboards, Infrastructure)
3. Use the **Role** filter to focus on one or more roles
4. Toggle **Show empty rows** to hide permissions no role holds

### Available Filter Dimensions
| Filter | Options |
|--------|---------|
| Module | Metrics, Logs, Traces, Dashboards, Alerts, Reports, Infra, K8s, Agents, Uptime, IAM, Audit, Billing, Platform |
| Role | All built-in and custom roles |
| Action type | Read, Write, Admin |
| Grant state | Granted, Denied, Not assigned |
| Scope | Own, Workspace, Org, Platform |

### Via API (Filtered Matrix)
\`\`\`bash
# Get matrix filtered to alerts module only
curl "https://api.telemetryflow.id/api/v2/iam/matrix?module=alerts" \\
  -H "Authorization: Bearer $TOKEN"

# Get matrix for a single role
curl "https://api.telemetryflow.id/api/v2/iam/matrix?roleId=role-developer" \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`

### Filtered Matrix: Alerts Module
| Permission | Super Admin | Org Admin | WS Admin | Developer | Viewer |
|-----------|:-----------:|:---------:|:--------:|:---------:|:------:|
| alert:read | ✅ | ✅ | ✅ | ✅ | ✅ |
| alert:create | ✅ | ✅ | ✅ | ✅ | ❌ |
| alert:write | ✅ | ✅ | ✅ | ✅ | ❌ |
| alert:manage | ✅ | ✅ | ✅ | ✅ | ❌ |`,
  },
  {
    question: "How do I export the permission matrix as a spreadsheet?",
    answer: `## Exporting the Permission Matrix

### Export Formats
| Format | Endpoint | Best For |
|--------|----------|---------|
| CSV | \`GET /api/v2/iam/matrix/export?format=csv\` | Spreadsheet analysis |
| XLSX | \`GET /api/v2/iam/matrix/export?format=xlsx\` | Formatted Excel workbook |
| JSON | \`GET /api/v2/iam/matrix/export?format=json\` | Programmatic processing |
| PDF | \`GET /api/v2/iam/matrix/export?format=pdf\` | Compliance audit submission |

### Via API
\`\`\`bash
# Export full matrix as CSV
curl "https://api.telemetryflow.id/api/v2/iam/matrix/export?format=csv" \\
  -H "Authorization: Bearer $TOKEN" \\
  -o permission-matrix.csv

# Export filtered matrix (alerts only, XLSX)
curl "https://api.telemetryflow.id/api/v2/iam/matrix/export?format=xlsx&module=alerts" \\
  -H "Authorization: Bearer $TOKEN" \\
  -o alerts-matrix.xlsx
\`\`\`

### CSV Structure
\`\`\`
permission,module,action,super_admin,org_admin,ws_admin,developer,viewer,sre_lead,security_analyst
metrics:read,metrics,read,true,true,true,true,true,true,true
alert:manage,alerts,admin,true,true,true,true,false,true,false
\`\`\`

### Scheduled Matrix Reports
Configure automatic exports to email quarterly for compliance:
- Navigate to **Reports → New Report**
- Select **IAM Permission Matrix** as the report type
- Set frequency to **Quarterly**
- Add recipients from the compliance team`,
  },
  {
    question: "How do I assign permissions in bulk using the matrix view?",
    answer: `## Bulk Permission Assignment via Matrix

### Via UI (Matrix Editor)
1. Navigate to **IAM → Matrix**
2. Click **Edit Mode** (requires Org Admin+)
3. Click individual cells to toggle permission on/off for a role
4. Select a **column header** (role name) to see all permissions for that role
5. Use **Select Row** to grant/deny a permission across all roles at once
6. Click **Apply Changes** to preview and confirm

### Bulk Operations
| Operation | How |
|-----------|-----|
| Grant permission to all roles | Select the row → click **Grant All** |
| Remove permission from all roles | Select the row → click **Revoke All** |
| Copy permissions from one role to another | Select source column → **Copy to...** |
| Reset a role to default permissions | Select role column → **Reset to Default** |

### Via API (Batch Permission Update)
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/iam/roles/{roleId}/permissions/batch \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "grant": ["uptime:create", "status-page:read", "report:create"],
    "revoke": ["billing:read"]
  }'
\`\`\`

### Preview Before Applying
Always use the \`dryRun: true\` flag when testing bulk changes:
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/iam/roles/{roleId}/permissions/batch \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "grant": ["uptime:create"], "dryRun": true }'
\`\`\`

Returns affected users and current state without making any changes.`,
  },
  {
    question: "How do I see the matrix diff between two roles?",
    answer: `## Matrix Diff Between Two Roles

### What Is a Matrix Diff?
A matrix diff shows exactly which permissions are in one role but not another — useful for understanding why two roles exist or whether they should be merged.

### Via API
\`\`\`bash
curl "https://api.telemetryflow.id/api/v2/iam/matrix/diff?roleA=role-developer&roleB=role-sre-lead" \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`

### Sample Diff: Developer vs SRE Lead
| Permission | Developer | SRE Lead | Difference |
|-----------|:---------:|:--------:|:----------:|
| metrics:read | ✅ | ✅ | Same |
| logs:read | ✅ | ✅ | Same |
| dashboard:create | ✅ | ✅ | Same |
| alert:manage | ✅ | ✅ | Same |
| infra:write | ❌ | ✅ | + SRE Lead only |
| agent:configure | ❌ | ✅ | + SRE Lead only |
| kubernetes:write | ❌ | ❌ | Same |

### Diff Summary
\`\`\`json
{
  "onlyInRoleA": [],
  "onlyInRoleB": ["infra:write", "agent:configure"],
  "common": 43,
  "recommendation": "SRE Lead is a strict superset of Developer. Consider using inheritance."
}
\`\`\`

### Use Cases
- **Before merging roles**: confirm they are equivalent before consolidating
- **Access review**: explain to an auditor why two similar roles exist
- **Privilege escalation check**: detect if a custom role has drifted significantly from its base
- **Onboarding**: help new admins choose the right role for a new hire`,
  },
  {
    question: "What do the matrix columns represent and how should I read them?",
    answer: `## Understanding Matrix Columns

### Column Layout
The matrix is organized with **permissions as rows** and **roles as columns**:

\`\`\`
Permission         | Super Admin | Org Admin | WS Admin | Developer | Viewer
-------------------|-------------|-----------|----------|-----------|-------
metrics:read       |      ✅     |     ✅    |    ✅    |     ✅    |   ✅
dashboard:create   |      ✅     |     ✅    |    ✅    |     ✅    |   ❌
billing:read       |      ✅     |     ✅    |    ❌    |    ❌    |   ❌
\`\`\`

### Cell Values and Meaning
| Cell Value | Meaning |
|-----------|---------|
| ✅ | Role is granted this permission |
| ❌ | Role does not have this permission |
| Own only | Role can perform this action only on resources they created |
| WS only | Permission is scoped to within the user's workspace |
| ⊘ (deny) | Explicit deny rule — overrides any grant |

### Reading the Matrix for Decision-Making
1. **Identify the row** for the permission you care about
2. **Scan across columns** to see which roles have it
3. **Find the leftmost column** where the permission appears — that is the minimum role needed
4. **Custom role columns** appear after built-in roles with a \`(custom)\` badge

### Matrix Scope Toggle
The matrix can be scoped to:
- **Platform** — all permissions across all scopes
- **Organization** — org-level permissions only
- **Workspace** — workspace-scoped permissions only

Switch scope using the toggle in the top-right of the Matrix view.`,
  },
  {
    question: "What does the matrix API return and how do I use it programmatically?",
    answer: `## Matrix API Reference

### Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | \`/api/v2/iam/matrix\` | Full permission matrix |
| GET | \`/api/v2/iam/matrix?module={module}\` | Filtered by module |
| GET | \`/api/v2/iam/matrix?roleId={id}\` | Single role column |
| GET | \`/api/v2/iam/matrix/diff?roleA={id}&roleB={id}\` | Diff two roles |
| GET | \`/api/v2/iam/matrix/export\` | Export matrix as file |
| GET | \`/api/v2/iam/matrix/suggested?userId={id}\` | Suggest permissions for a user |

### Full Matrix Response Structure
\`\`\`json
{
  "roles": [
    { "id": "role-super-admin", "name": "Super Admin", "type": "builtin" },
    { "id": "role-developer", "name": "Developer", "type": "builtin" },
    { "id": "role-sre-lead", "name": "SRE Lead", "type": "custom" }
  ],
  "permissions": [
    {
      "id": "metrics:read",
      "module": "metrics",
      "action": "read",
      "description": "View metric data and graphs",
      "grants": {
        "role-super-admin": true,
        "role-developer": true,
        "role-sre-lead": true
      }
    }
  ]
}
\`\`\`

### Authentication Requirements
| Endpoint | Minimum Role |
|----------|-------------|
| Read matrix | Workspace Admin |
| Export matrix | Org Admin |
| Diff roles | Workspace Admin |
| Bulk edit via matrix | Org Admin |

### Rate Limits
- Matrix read: 60 requests/minute
- Matrix export: 10 requests/hour
- Matrix diff: 30 requests/minute`,
  },
  {
    question: "What permissions does the matrix suggest for a new user based on their role?",
    answer: `## Suggested Permissions via Matrix

### How Suggestion Works
The matrix suggestion engine analyzes:
1. The user's assigned role and its baseline permissions
2. Permissions commonly granted to similar users in the same workspace
3. Permissions used by teammates in the same group

### Via API
\`\`\`bash
# Get suggested permissions for a user
curl "https://api.telemetryflow.id/api/v2/iam/matrix/suggested?userId={userId}&workspaceId={wsId}" \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`

### Sample Suggestion Response for a New Developer
| Permission | Suggested | Reason |
|-----------|:--------:|--------|
| \`uptime:create\` | ✅ | 80% of Developers in this workspace have it |
| \`report:create\` | ✅ | Standard for engineering team members |
| \`llm:chat\` | ✅ | Enabled for all developers in org policy |
| \`audit:read\` | ⚠️ | Only 15% of Developers — review if needed |
| \`billing:read\` | ❌ | Not recommended for Developer role |

### Accept Suggestions via API
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/iam/users/{userId}/permissions/apply-suggestions \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "permissions": ["uptime:create", "report:create", "llm:chat"],
    "workspaceId": "ws-production-uuid"
  }'
\`\`\`

### Via UI
1. Open the user's profile → **Permissions** tab
2. Click **View Suggestions**
3. Review each suggestion with its rationale
4. Check the ones to apply → **Apply Selected**

### When Suggestions Are Most Useful
- Onboarding new team members who mirror an existing colleague's access
- After a role change — identifying permissions the new role does not cover
- During quarterly access review — spotting permissions that are now unused`,
  },
];

export const IAM_MATRIX_CONVERSATION_TITLES: string[] = [
  "Full permission matrix view",
  "Infrastructure write access",
  "Developer vs Viewer comparison",
  "Filter matrix by module",
  "Export matrix as spreadsheet",
  "Bulk permission assignment via matrix",
  "Matrix diff between roles",
  "Understanding matrix columns",
  "Matrix API usage",
  "Suggested permissions via matrix",
];

// ==================== IAM ASSIGNMENTS SUB-CONTEXT ====================

export const IAM_ASSIGNMENTS_MOCK_DATA: MockQA[] = [
  {
    question: "Show current role assignments across workspaces",
    answer: `## Role Assignment Overview

### Assignments by Workspace
| Workspace | User | Role | Assigned By | Assigned At |
|-----------|------|------|------------|------------|
| Production | john.admin@ | Workspace Admin | system | 1y ago |
| Production | sarah.devops@ | Developer | org-admin | 8mo ago |
| Production | viewer1@ | Viewer | ws-admin | 6mo ago |
| Development | mike.intern@ | Developer | ws-admin | 3mo ago |
| Development | dev2@ | Developer | ws-admin | 5mo ago |
| QA | qa-lead@ | Workspace Admin | org-admin | 4mo ago |
| QA | qa-tester1@ | Developer | qa-lead | 2mo ago |

### Assignment Summary
| Workspace | Admins | Developers | Viewers | Total |
|-----------|--------|-----------|---------|-------|
| Production | 2 | 8 | 4 | 14 |
| Development | 1 | 6 | 0 | 7 |
| QA | 1 | 4 | 2 | 7 |
| Sandbox | 1 | 2 | 0 | 3 |

### Cross-Workspace Users (4)
| User | Workspaces | Primary Role |
|------|-----------|-------------|
| john.admin@ | All | Super Admin |
| sarah.devops@ | Production, Development | Developer |
| report-bot@ | All | Developer |
| security-scanner@ | All | Viewer + audit:read |`,
  },
  {
    question: "How do I assign a role to a user in bulk?",
    answer: `## Bulk Role Assignment

### Via UI
1. Navigate to **IAM → Assignments**
2. Click **Bulk Assign**
3. Select users (checkbox or CSV upload)
4. Choose target workspace(s)
5. Select role
6. Preview changes → **Confirm Assignment**

### Via API (Single User)
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/iam/assignments \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "userId": "user-uuid",
    "roleId": "role-developer",
    "workspaceId": "ws-production-uuid"
  }'
\`\`\`

### Via API (Bulk)
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/iam/assignments/bulk \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "assignments": [
      { "userId": "user-1", "roleId": "role-developer", "workspaceId": "ws-prod" },
      { "userId": "user-2", "roleId": "role-viewer", "workspaceId": "ws-prod" },
      { "userId": "user-3", "roleId": "role-developer", "workspaceId": "ws-dev" }
    ]
  }'
\`\`\`

### Limits
- Max 50 assignments per bulk request
- Cannot downgrade your own role
- Workspace Admin cannot assign roles above Developer within their workspace`,
  },
  {
    question: "Show assignment changes made this week",
    answer: `## Assignment Change Log (Last 7 Days)

### Recent Changes
| Timestamp | Action | User | Role | Workspace | Changed By |
|-----------|--------|------|------|-----------|-----------|
| Today 09:14 | Assigned | new.dev@company.com | Developer | Production | sarah.devops@ |
| Yesterday 15:32 | Revoked | contractor1@ | Developer | QA | org-admin@ |
| Yesterday 11:05 | Changed | qa-tester1@ | Viewer → Developer | QA | qa-lead@ |
| 2d ago 08:45 | Assigned | new.viewer@ | Viewer | Development | ws-admin@ |
| 3d ago 17:20 | Revoked | old.consultant@ | Developer | Production | org-admin@ |

### Change Summary
| Action | Count | Most Active Assigner |
|--------|-------|---------------------|
| Assigned | 3 | org-admin@ (2) |
| Revoked | 2 | org-admin@ (1) |
| Role Changed | 1 | qa-lead@ |

### Pending Approvals
| User | Requested Role | Workspace | Requested By | Status |
|------|---------------|-----------|-------------|--------|
| devnew@partner.com | Developer | Production | self-service | ⏳ Awaiting org-admin approval |

> Enable **assignment approval workflow** under IAM → Settings to require admin sign-off for role escalations.`,
  },
  {
    question: "How do I view the full assignment history for a user?",
    answer: `## Assignment History for a User

### What Is Tracked
Every role assignment, change, and revocation is recorded with:
- Who made the change (actor)
- The before and after role state
- Which workspace was affected
- The timestamp and optional reason

### Via API
\`\`\`bash
# Full assignment history for a user
curl "https://api.telemetryflow.id/api/v2/iam/assignments/history?userId={userId}" \\
  -H "Authorization: Bearer $TOKEN"

# History filtered to a specific workspace
curl "https://api.telemetryflow.id/api/v2/iam/assignments/history?userId={userId}&workspaceId={wsId}" \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`

### Sample History: sarah.devops@company.com
| Date | Action | Previous Role | New Role | Workspace | Changed By |
|------|--------|-------------|---------|-----------|-----------|
| 2024-03-01 | Assigned | — | Developer | Development | org-admin@ |
| 2024-06-15 | Changed | Developer | SRE Lead | Development | org-admin@ |
| 2024-09-10 | Assigned | — | Developer | Production | org-admin@ |
| 2025-01-20 | Changed | SRE Lead | Developer | Development | org-admin@ |
| 2025-02-28 | Current | Developer | Developer | Production | — |

### Export History
\`\`\`bash
curl "https://api.telemetryflow.id/api/v2/iam/assignments/history/export?userId={userId}&format=csv" \\
  -H "Authorization: Bearer $TOKEN" \\
  -o sarah-assignment-history.csv
\`\`\`

### Use Cases
- Compliance audits: prove access was granted and revoked at specific dates
- Offboarding verification: confirm all assignments have been removed
- Access creep detection: identify users who accumulated roles over time`,
  },
  {
    question: "Can role assignments have an expiry date?",
    answer: `## Assignment Expiry (Time-Bounded Access)

### Overview
TelemetryFlow supports time-bounded role assignments for contractors, temporary elevated access, and project-based work.

### Creating an Assignment with Expiry

#### Via UI
1. Navigate to **IAM → Assignments**
2. Click **Add Assignment**
3. Select user, role, and workspace
4. Toggle **Set Expiry Date**
5. Choose the expiry date/time
6. Add an optional reason (e.g., "Q1 project access")
7. Click **Confirm**

#### Via API
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/iam/assignments \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "userId": "user-uuid",
    "roleId": "role-developer",
    "workspaceId": "ws-production-uuid",
    "expiresAt": "2024-06-30T23:59:59Z",
    "reason": "Q2 project — access expires end of June"
  }'
\`\`\`

### Expiring Assignments Dashboard
| User | Role | Workspace | Expires In | Action |
|------|------|-----------|-----------|--------|
| contractor1@partner.com | Developer | Production | 5 days | Renew or let expire |
| external.auditor@ | Viewer | All | 12 days | Let expire |
| temp.sre@company.com | SRE Lead | Production | 30 days | Monitor |

### Expiry Notifications
- **7 days before**: Email sent to the assigning admin
- **1 day before**: Email sent to both admin and the user
- **At expiry**: Assignment automatically revoked and logged in audit trail
- **After expiry**: User receives access-denied response on next action`,
  },
  {
    question: "How do assignments work at the workspace vs organization level?",
    answer: `## Workspace vs Organization Level Assignments

### Assignment Scopes
| Scope | Roles Available | Who Can Assign |
|-------|---------------|---------------|
| Platform | Super Admin | Super Admin only |
| Organization | Org Admin | Super Admin |
| Workspace | WS Admin, Developer, Viewer | Org Admin, WS Admin |
| Custom role | Workspace-scoped | Org Admin |

### Org-Level Assignments
An **Org Admin** assignment grants access across all workspaces within the organization:
- The user can view and manage all workspaces
- They can create and delete workspaces
- They have access to org-wide SSO and billing settings

\`\`\`bash
# Assign Org Admin (no workspaceId — applies org-wide)
curl -X POST https://api.telemetryflow.id/api/v2/iam/assignments \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "userId": "user-uuid",
    "roleId": "role-org-admin",
    "scope": "organization",
    "organizationId": "org-uuid"
  }'
\`\`\`

### Workspace-Level Assignments
A **workspace-level** assignment restricts access to a single workspace:
\`\`\`bash
# Assign Developer to Production workspace only
curl -X POST https://api.telemetryflow.id/api/v2/iam/assignments \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "userId": "user-uuid",
    "roleId": "role-developer",
    "workspaceId": "ws-production-uuid"
  }'
\`\`\`

### Multi-Workspace User
A user can have **different roles in different workspaces**:
| Workspace | Role |
|-----------|------|
| Production | Viewer (read-only in prod) |
| Development | Developer (full dev access) |
| QA | Developer |
| Sandbox | Workspace Admin |`,
  },
  {
    question: "How do I remove a role assignment from a user?",
    answer: `## Removing Role Assignments

### When to Remove an Assignment
- User is offboarding or changing teams
- Contract or project has ended
- User has accumulated excessive roles (access creep)
- Security incident requiring immediate de-provisioning

### Via UI
1. Navigate to **IAM → Assignments**
2. Search for the user by name or email
3. Find the assignment row (user + role + workspace)
4. Click the **Revoke** (trash) icon
5. Confirm with optional reason

### Via API (Single Assignment)
\`\`\`bash
# Revoke a specific assignment
curl -X DELETE https://api.telemetryflow.id/api/v2/iam/assignments/{assignmentId} \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "reason": "User offboarding — last day 2024-03-15" }'
\`\`\`

### Via API (Remove All Assignments for a User)
\`\`\`bash
# Offboarding: remove all role assignments
curl -X DELETE "https://api.telemetryflow.id/api/v2/iam/users/{userId}/assignments" \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "reason": "Offboarding" }'
\`\`\`

### Offboarding Checklist
| Step | Action | Endpoint |
|------|--------|---------|
| 1 | Revoke all role assignments | DELETE \`/users/{id}/assignments\` |
| 2 | Revoke all active sessions | DELETE \`/users/{id}/sessions\` |
| 3 | Revoke or reassign API keys | PATCH \`/api-keys/{id}/revoke\` |
| 4 | Disable account | PATCH \`/users/{id}/disable\` |
| 5 | Transfer owned resources | Manual or \`/resources/transfer\` |

### What Happens After Removal
- User immediately loses access on next API call or page load
- Active session tokens are invalidated within 60 seconds (token expiry check interval)
- The revocation is recorded in the audit log`,
  },
  {
    question: "How do I detect and resolve assignment conflicts?",
    answer: `## Assignment Conflicts

### What Is an Assignment Conflict?
A conflict occurs when a user has multiple assignments that interact unexpectedly:
- **Role overlap**: Same user assigned both Developer and Viewer in the same workspace
- **Privilege escalation**: Workspace Admin in one workspace + Org Admin in another creates ambiguous scope
- **Deny + grant**: A direct deny rule conflicts with a role grant

### Conflict Detection via API
\`\`\`bash
# Check a user for assignment conflicts
curl "https://api.telemetryflow.id/api/v2/iam/assignments/conflicts?userId={userId}" \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`

### Sample Conflict Report
| User | Conflict Type | Details | Recommended Action |
|------|-------------|---------|-------------------|
| sarah.devops@ | Role overlap | Developer + SRE Lead in Production | Remove Developer (SRE Lead is a superset) |
| external.audit@ | Deny + grant | audit:read denied but Viewer role grants it | Remove direct deny rule or downgrade role |
| report-bot@ | Orphaned workspace | Assigned to deleted workspace ws-old | Remove stale assignment |

### Resolving Conflicts

#### Remove duplicate lower role
\`\`\`bash
# Keep SRE Lead, remove Developer assignment
curl -X DELETE "https://api.telemetryflow.id/api/v2/iam/assignments/{developerAssignmentId}" \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`

#### Conflict Prevention
- **Platform guardrail**: The system warns (but does not block) when assigning a role that is a subset of an existing role
- **Quarterly review**: Run conflict detection report as part of access review
- **Auto-resolution**: Enable under **IAM → Settings → Conflict Resolution** to auto-remove redundant lower roles`,
  },
  {
    question: "What is the API for listing and managing assignments?",
    answer: `## Assignments API Reference

### Endpoint Summary
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | \`/api/v2/iam/assignments\` | List all assignments (paginated) |
| GET | \`/api/v2/iam/assignments/{id}\` | Get single assignment |
| POST | \`/api/v2/iam/assignments\` | Create assignment |
| POST | \`/api/v2/iam/assignments/bulk\` | Bulk create assignments |
| PATCH | \`/api/v2/iam/assignments/{id}\` | Update assignment (e.g., change expiry) |
| DELETE | \`/api/v2/iam/assignments/{id}\` | Revoke single assignment |
| DELETE | \`/api/v2/iam/users/{userId}/assignments\` | Revoke all assignments for a user |
| GET | \`/api/v2/iam/assignments/history\` | Assignment audit history |
| GET | \`/api/v2/iam/assignments/conflicts\` | Detect conflicts |
| GET | \`/api/v2/iam/assignments/export\` | Export assignments as CSV/XLSX |

### List Assignments with Filters
\`\`\`bash
# All assignments for a specific workspace
curl "https://api.telemetryflow.id/api/v2/iam/assignments?workspaceId={wsId}&limit=50" \\
  -H "Authorization: Bearer $TOKEN"

# Assignments expiring in next 30 days
curl "https://api.telemetryflow.id/api/v2/iam/assignments?expiresWithin=30d" \\
  -H "Authorization: Bearer $TOKEN"

# Assignments for a specific role
curl "https://api.telemetryflow.id/api/v2/iam/assignments?roleId=role-developer" \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`

### Assignment Object Schema
\`\`\`json
{
  "id": "assignment-uuid",
  "userId": "user-uuid",
  "roleId": "role-developer",
  "workspaceId": "ws-production-uuid",
  "scope": "workspace",
  "assignedBy": "admin-user-uuid",
  "assignedAt": "2024-01-15T10:00:00Z",
  "expiresAt": null,
  "reason": "Onboarding — Q1 2024",
  "status": "active"
}
\`\`\`

### Authentication Requirements
| Operation | Minimum Role |
|-----------|-------------|
| Read assignments (own workspace) | Workspace Admin |
| Read assignments (org-wide) | Org Admin |
| Create/revoke assignments | Org Admin (or WS Admin within workspace) |
| Bulk operations | Org Admin |`,
  },
  {
    question: "How do I perform a bulk reassignment of users from one role to another?",
    answer: `## Bulk Role Reassignment

### Use Cases
- Team restructuring: move all Viewers to Developer after team upskilling
- Role rename: replacing a deprecated custom role with a new one
- Security response: rapidly downgrade compromised accounts to Viewer
- Workspace migration: reassign users to a new workspace with a different role

### Via UI
1. Navigate to **IAM → Assignments**
2. Filter by the **source role** and/or source workspace
3. Select all matching users (checkbox or **Select All on Page**)
4. Click **Bulk Actions → Reassign Role**
5. Choose the target role
6. Preview: confirm the list and role change
7. Click **Apply Reassignment**

### Via API (Reassign All Users from One Role to Another)
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/iam/assignments/bulk-reassign \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "sourceRoleId": "role-developer",
    "targetRoleId": "role-sre-lead",
    "workspaceId": "ws-production-uuid",
    "userIds": ["user-1", "user-2", "user-3"],
    "reason": "Team promotion — all devs upgraded to SRE Lead after certification"
  }'
\`\`\`

### Dry Run Before Applying
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/iam/assignments/bulk-reassign \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "sourceRoleId": "role-viewer",
    "targetRoleId": "role-developer",
    "workspaceId": "ws-dev-uuid",
    "dryRun": true
  }'
\`\`\`

Returns a preview of affected users without making changes.

### Limits
- Max 100 users per bulk reassignment request
- Reassignment to Super Admin or Org Admin requires Super Admin actor
- All changes are logged in the audit trail with the reason provided`,
  },
];

export const IAM_ASSIGNMENTS_CONVERSATION_TITLES: string[] = [
  "Role assignment overview",
  "Bulk role assignment",
  "Recent assignment changes",
  "User assignment history",
  "Time-bounded assignment expiry",
  "Workspace vs org-level assignments",
  "Remove and offboard assignments",
  "Detect assignment conflicts",
  "Assignments API reference",
  "Assignment audit and compliance",
];

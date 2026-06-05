/**
 * Account Sub-Context Mock Data for LLM AI Insights
 * Covers: account-profile, account-security, account-sessions,
 *         account-notifications, account-preferences
 */

export interface MockQA {
  question: string;
  answer: string;
}

// ==================== ACCOUNT PROFILE CONTEXT ====================

export const ACCOUNT_PROFILE_MOCK_DATA: MockQA[] = [
  {
    question: "How do I update my profile information?",
    answer: `## Updating Your Profile

### Editable Profile Fields
| Field | Description | Notes |
|-------|-------------|-------|
| Display Name | Your visible name in the platform | Shown in dashboards, comments, audit logs |
| Avatar | Profile picture | JPG/PNG, max 2MB, auto-cropped to 256×256 |
| Job Title | Your role/title | Optional — shown on profile card |
| Department | Team or department | Optional |
| Phone | Contact number | Optional — used for SMS MFA |
| Timezone | Your local timezone | Affects alert timestamps and report schedules |
| Language | Interface language | See Account → Preferences for full list |

### Via UI
1. Navigate to **Account → My Profile**
2. Click **Edit Profile**
3. Update desired fields
4. Click **Save Changes**

### Via API
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/account/profile \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "displayName": "Alex Johnson",
    "jobTitle": "Senior SRE",
    "department": "Platform Engineering",
    "timezone": "America/New_York",
    "phone": "+1-555-0123"
  }'
\`\`\`

### Upload Avatar
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/account/avatar \\
  -H "Authorization: Bearer $TOKEN" \\
  -F "file=@avatar.jpg"
\`\`\`

### Profile Visibility
Your profile (name, title, avatar) is visible to:
- All users in your **organization**
- Workspace admins in your workspaces
- Your profile is NOT public outside your organization`,
  },
  {
    question: "What information is shown on my user profile?",
    answer: `## Your Profile Overview

### Profile Card
\`\`\`
┌─────────────────────────────────────────┐
│  [Avatar]  Alex Johnson                 │
│            Senior SRE                   │
│            Platform Engineering         │
│                                         │
│  📧 alex.johnson@company.com            │
│  🕐 Active 5 minutes ago                │
│  🌐 America/New_York (UTC-5)             │
│  📅 Member since Jan 2024               │
└─────────────────────────────────────────┘
\`\`\`

### Your Current Profile
| Field | Value |
|-------|-------|
| Email | alex.johnson@company.com |
| Organization | DevOpsCorner Inc. |
| Role (Org) | Developer |
| Workspace Roles | Production: Developer, Development: Developer |
| MFA | ✅ TOTP Enabled |
| SSO | ✅ Linked to Okta |
| Active Sessions | 2 (this browser + mobile) |
| Last Login | 5 minutes ago from Chrome / New York |

### What Others Can See
| Information | Visible to Org | Visible to WS Admins |
|------------|:--------------:|:-------------------:|
| Display name | ✅ | ✅ |
| Avatar | ✅ | ✅ |
| Job title | ✅ | ✅ |
| Email | ✅ | ✅ |
| Last active | ✅ | ✅ |
| Role assignments | ❌ | ✅ |
| Login history | ❌ | ❌ (Org Admin only) |`,
  },
  {
    question: "How do I update my display name?",
    answer: `## Updating Your Display Name

### Via UI
1. Navigate to **Account → My Profile → Edit Profile**
2. Update the **Display Name** field
3. Click **Save Changes**

Your new display name takes effect immediately across:
- Dashboard comments and annotations
- Audit log entries
- Notification sender names
- Team member lists

### Via API
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/account/profile \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "displayName": "Alex Johnson" }'
\`\`\`

### Display Name Rules
| Rule | Detail |
|------|--------|
| Min length | 2 characters |
| Max length | 64 characters |
| Allowed characters | Letters, numbers, spaces, hyphens, periods |
| Uniqueness | Not required — email is the unique identifier |
| Profanity filter | Enforced by platform policy |

> Your display name is visible to all users in your organization. It appears in audit logs and cannot be blank.`,
  },
  {
    question: "How do I change my email address?",
    answer: `## Changing Your Email Address

### Important Notes
- Email is your **primary login identifier**
- Changing email requires **verification of the new address**
- SSO-linked accounts may not be able to change email here — manage it via your identity provider

### Steps to Change Email
1. Navigate to **Account → My Profile → Edit Profile**
2. Click **Change Email**
3. Enter your **new email address**
4. Enter your **current password** (to confirm identity)
5. Click **Send Verification**
6. Check your **new inbox** for a verification link
7. Click the link to confirm — email updates immediately

### Via API
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/account/change-email \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "newEmail": "alex.new@company.com",
    "currentPassword": "CurrentPass123!"
  }'
\`\`\`

### After Email Change
| Effect | Behavior |
|--------|---------|
| Login email | Updated to new address |
| Notification delivery | Updated to new address |
| Active sessions | Remain valid |
| SSO link | May need re-linking if email differs |
| Audit log | Change recorded with timestamp and IP |

### Email Change Cooldown
After changing your email, you must wait **24 hours** before changing it again.`,
  },
  {
    question: "How do I upload or change my profile avatar?",
    answer: `## Profile Avatar Upload

### Via UI
1. Navigate to **Account → My Profile**
2. Click on your current avatar (or the avatar placeholder)
3. Select **Upload Photo**
4. Choose a JPG or PNG file
5. Use the crop tool to adjust framing (square crop, 256×256px output)
6. Click **Save**

### Via API
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/account/avatar \\
  -H "Authorization: Bearer $TOKEN" \\
  -F "file=@my-photo.jpg"
\`\`\`

### Avatar Requirements
| Requirement | Value |
|------------|-------|
| Accepted formats | JPG, PNG, WebP |
| Max file size | 2 MB |
| Min dimensions | 100×100 px |
| Output size | 256×256 px (auto-cropped) |
| Storage | CDN-backed, served via \`cdn.telemetryflow.id\` |

### Remove Avatar
\`\`\`bash
curl -X DELETE https://api.telemetryflow.id/api/v2/account/avatar \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`
Removing your avatar reverts to a generated initials-based avatar.

### Avatar Visibility
Your avatar is visible to all users in your organization in:
- Dashboard top-right user menu
- Team member lists
- Comment threads and annotations
- Audit log entries`,
  },
  {
    question: "How do I view my profile completeness score?",
    answer: `## Profile Completeness

### Your Current Profile Completeness: 72%

### Completeness Checklist
| Field | Status | Points |
|-------|--------|--------|
| Display Name | ✅ Complete | 15 |
| Email (verified) | ✅ Complete | 15 |
| Avatar | ✅ Uploaded | 10 |
| Job Title | ✅ Complete | 10 |
| Department | ✅ Complete | 10 |
| Timezone | ✅ Set | 10 |
| Phone (for SMS MFA) | ❌ Missing | 10 |
| Language Preference | ❌ Not set | 10 |
| MFA Enabled | ✅ Active | 10 |
| Social / SSO Linked | ❌ Not linked | 10 |

### Why Profile Completeness Matters
| Benefit | Requires |
|---------|----------|
| Appear in team directories | Name + Avatar |
| Receive SMS alerts | Phone number |
| Accurate report timestamps | Timezone |
| Localized UI | Language preference |
| Recovery options | Phone + Backup codes |

### Complete Your Profile
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/account/profile \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "phone": "+1-555-0123",
    "language": "en",
    "timezone": "America/New_York"
  }'
\`\`\``,
  },
  {
    question: "How do I set my timezone?",
    answer: `## Setting Your Timezone

### Why Timezone Matters
Your timezone setting affects:
- Alert timestamps shown in the UI
- Scheduled report delivery times
- Do Not Disturb hours for notifications
- Audit log timestamps in exports

### Via UI
1. Navigate to **Account → My Profile → Edit Profile**
2. Find **Timezone** under the Localization section
3. Search or scroll to your timezone (IANA format)
4. Click **Save Changes**

### Via API
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/account/profile \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "timezone": "Asia/Jakarta" }'
\`\`\`

### Common Timezones
| Region | Timezone |
|--------|---------|
| US East | America/New_York |
| US West | America/Los_Angeles |
| UK | Europe/London |
| Central Europe | Europe/Berlin |
| India | Asia/Kolkata |
| Singapore / Indonesia WIB | Asia/Jakarta |
| Japan | Asia/Tokyo |
| Australia Sydney | Australia/Sydney |
| UTC | UTC |

> All internal data is stored in UTC. Your timezone setting is display-only and does not affect data storage.`,
  },
  {
    question: "How do I set my language preference?",
    answer: `## Setting Language Preference

### Via UI
1. Navigate to **Account → Preferences**
2. Find **Language** under Localization
3. Select your language from the dropdown
4. The UI updates immediately — no reload required

### Via API
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/account/preferences \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "language": "id" }'
\`\`\`

### Supported Languages
| Code | Language | UI Coverage |
|------|---------|-------------|
| \`en\` | English | 100% |
| \`id\` | Bahasa Indonesia | 95% |
| \`ja\` | Japanese | 88% |
| \`zh\` | Chinese Simplified | 85% |
| \`de\` | German | 82% |
| \`fr\` | French | 80% |
| \`es\` | Spanish | 78% |
| \`pt\` | Portuguese | 75% |

### Notes
- Untranslated strings automatically fall back to English
- Language preference is per-user — it does not affect other team members
- Email notifications are sent in your language preference (where translated)
- API responses are always in English (language affects UI only)`,
  },
  {
    question: "What is the profile API endpoint and what data does it return?",
    answer: `## Profile API Reference

### Get Current User Profile
\`\`\`bash
curl https://api.telemetryflow.id/api/v2/account/profile \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`

### Response
\`\`\`json
{
  "id": "usr-abc123",
  "email": "alex.johnson@company.com",
  "displayName": "Alex Johnson",
  "jobTitle": "Senior SRE",
  "department": "Platform Engineering",
  "phone": "+1-555-0123",
  "timezone": "America/New_York",
  "language": "en",
  "avatarUrl": "https://cdn.telemetryflow.id/avatars/usr-abc123.jpg",
  "organization": {
    "id": "org-xyz",
    "name": "DevOpsCorner Inc."
  },
  "roles": [
    { "scope": "organization", "role": "developer" },
    { "scope": "workspace", "workspaceId": "ws-prod", "role": "developer" }
  ],
  "mfaEnabled": true,
  "ssoLinked": true,
  "activeSessions": 2,
  "lastLoginAt": "2026-03-01T09:14:22Z",
  "createdAt": "2024-01-15T08:00:00Z",
  "profileCompleteness": 72
}
\`\`\`

### Update Profile
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/account/profile \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{ "displayName": "Alex J.", "timezone": "Europe/London" }'
\`\`\`

### Rate Limits
| Endpoint | Limit |
|----------|-------|
| GET /profile | 60 req/min |
| PATCH /profile | 10 req/min |
| POST /avatar | 5 req/min |`,
  },
  {
    question:
      "When was my profile last updated and can I see the audit history?",
    answer: `## Profile Audit History

### Last Profile Changes
| Field Changed | Old Value | New Value | Changed At | IP |
|--------------|-----------|-----------|-----------|-----|
| displayName | Alex J | Alex Johnson | 2026-02-15 09:30 | 192.168.1.100 |
| timezone | America/Chicago | America/New_York | 2026-02-10 14:22 | 192.168.1.100 |
| jobTitle | SRE | Senior SRE | 2026-01-20 11:05 | 192.168.1.100 |
| avatarUrl | (none) | cdn.../usr-abc.jpg | 2024-06-01 08:30 | 192.168.1.100 |

### View Profile Audit Log via API
\`\`\`bash
curl "https://api.telemetryflow.id/api/v2/audit?resource=account.profile&limit=20" \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`

### Profile Last-Updated Timestamp
| Field | Value |
|-------|-------|
| Profile last updated | 2026-02-15 09:30 UTC |
| Avatar last updated | 2024-06-01 08:30 UTC |
| Email last verified | 2024-01-15 UTC |
| MFA last configured | 2024-03-10 UTC |

### Audit Log Retention
| Log Type | Retention |
|----------|-----------|
| Profile change events | 1 year |
| Login events | 90 days |
| API key events | 1 year |
| Security events | 2 years |

> Audit logs are immutable — they cannot be modified or deleted by users. Only Super Admins can purge audit data under data retention policies.`,
  },
];

export const ACCOUNT_PROFILE_CONVERSATION_TITLES: string[] = [
  "Update profile information",
  "Profile visibility overview",
  "Update display name",
  "Change email address",
  "Upload profile avatar",
  "Profile completeness score",
  "Set timezone preference",
  "Set language preference",
  "Profile API reference",
  "Profile audit history",
];

// ==================== ACCOUNT SECURITY CONTEXT ====================

export const ACCOUNT_SECURITY_MOCK_DATA: MockQA[] = [
  {
    question: "How do I change my password?",
    answer: `## Password Change Guide

### Via UI
1. Navigate to **Account → Security**
2. Click **Change Password**
3. Enter your **current password**
4. Enter and confirm your **new password**
5. Click **Update Password**
6. All other sessions will be signed out automatically

### Password Requirements
| Requirement | Rule |
|------------|------|
| Minimum length | 12 characters |
| Uppercase | At least 1 |
| Lowercase | At least 1 |
| Number | At least 1 |
| Special character | At least 1 (!@#$%^&*) |
| Cannot reuse | Last 10 passwords |
| Expiry | Every 180 days (policy enforced) |

### Via API
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/account/change-password \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "currentPassword": "OldPassword123!",
    "newPassword": "NewSecurePass456@"
  }'
\`\`\`

### Forgot Password
If you cannot log in:
1. Go to the login page
2. Click **Forgot Password**
3. Enter your email address
4. Check inbox for reset link (valid 1 hour)

### After Password Change
- All active sessions (except current) are invalidated
- API keys remain valid
- MFA configuration is not affected`,
  },
  {
    question: "How do I enable Multi-Factor Authentication (MFA)?",
    answer: `## Setting Up MFA

### Supported MFA Methods
| Method | Security Level | Setup Difficulty | Recommended |
|--------|:-------------:|:---------------:|:-----------:|
| TOTP (Authenticator App) | ⭐⭐⭐ | Easy | ✅ Yes |
| WebAuthn / Security Key | ⭐⭐⭐⭐ | Medium | ✅ Yes |
| SMS (deprecated) | ⭐ | Easy | ❌ No |

### Set Up TOTP (Recommended)
1. Navigate to **Account → Security → MFA**
2. Click **Enable MFA**
3. Select **Authenticator App**
4. Scan the QR code with your authenticator app:
   - Google Authenticator
   - Authy
   - 1Password
   - Bitwarden Authenticator
5. Enter the 6-digit code to verify
6. **Save your backup codes** (shown once!)
7. Click **Confirm**

### Set Up WebAuthn (Hardware Key)
1. Navigate to **Account → Security → MFA**
2. Click **Add Security Key**
3. Insert your YubiKey or Touch ID
4. Follow browser prompt to register
5. Name your key (e.g., "YubiKey 5 NFC")

### Backup Codes
- 8 backup codes generated on MFA setup
- Each code can only be used **once**
- Store them securely (password manager recommended)
- Regenerate from **Account → Security** if lost

### MFA Recovery
If you lose your MFA device, contact your **Org Admin** or use a backup code.`,
  },
  {
    question: "Show my recent security activity",
    answer: `## Security Activity Log

### Last 30 Days
| Timestamp | Event | IP Address | Location | Device | Status |
|-----------|-------|-----------|----------|--------|--------|
| Today 09:14 | Login | 192.168.1.100 | New York, US | Chrome 122 / macOS | ✅ Success |
| Today 09:14 | MFA verified | 192.168.1.100 | New York, US | — | ✅ |
| Yesterday 22:30 | Login | 10.0.0.42 | New York, US | iPhone / iOS | ✅ Success |
| 3d ago 08:45 | Password changed | 192.168.1.100 | New York, US | Chrome / macOS | ✅ |
| 5d ago 14:20 | Login (SSO) | 203.0.113.45 | London, UK | Chrome / Windows | ✅ |
| 7d ago 03:15 | Failed login (x2) | 185.220.101.x | Unknown | — | 🔴 Failed |
| 12d ago 11:30 | API key created | 192.168.1.100 | New York, US | — | ✅ |

### Suspicious Activity
| Event | Details | Recommended Action |
|-------|---------|-------------------|
| 2 failed logins at 03:15 UTC | From TOR exit node IP (185.220.101.x) | Review and consider IP block |

### Connected Apps & Sessions
| App | Type | Last Used | Access |
|-----|------|----------|--------|
| TelemetryFlow Browser | Active session | 5m ago | Full |
| TelemetryFlow Mobile | Active session | 8h ago | Full |
| Grafana Integration | API key | 2h ago | metrics:read |
| CI Pipeline | API key | 30m ago | logs:write |

> 💡 **Recommendation**: Enable **login notifications by email** so you're alerted immediately when a new device logs in.`,
  },
  {
    question: "How do I enable TOTP MFA and what apps are compatible?",
    answer: `## TOTP MFA Setup

### Supported Authenticator Apps
| App | Platform | Free | Notes |
|-----|---------|------|-------|
| Google Authenticator | iOS / Android | ✅ | Simple, widely used |
| Authy | iOS / Android / Desktop | ✅ | Cloud backup of codes |
| 1Password | All platforms | Paid | Built into password manager |
| Bitwarden Authenticator | iOS / Android | ✅ | Open source |
| Microsoft Authenticator | iOS / Android | ✅ | Good for M365 users |
| Aegis | Android | ✅ | Open source, encrypted backup |

### Setup Steps
1. Navigate to **Account → Security → MFA**
2. Click **Enable Authenticator App**
3. A QR code is displayed — open your authenticator app
4. Tap **+** or **Scan QR code** in the app
5. Point camera at the QR code
6. A 6-digit rotating code appears in the app
7. Enter the 6-digit code in TelemetryFlow to verify
8. **Copy and store the 8 backup codes** shown (one-time display)
9. Click **Confirm Setup**

### TOTP Technical Details
| Property | Value |
|----------|-------|
| Algorithm | HMAC-SHA1 (RFC 6238) |
| Code length | 6 digits |
| Refresh interval | 30 seconds |
| Time window tolerance | ±1 interval (60s) |
| Issuer shown in app | TelemetryFlow |

### If TOTP Code Is Rejected
- Check your device clock is accurate (sync with NTP)
- Ensure you're entering the code before it expires
- Try the code shown in the next 30-second window`,
  },
  {
    question: "How do I generate new backup codes for MFA?",
    answer: `## MFA Backup Code Management

### What Are Backup Codes?
Backup codes are single-use emergency codes used when you cannot access your MFA device. Each code works exactly once.

### View / Regenerate Backup Codes
#### Via UI
1. Navigate to **Account → Security → MFA**
2. Click **Backup Codes**
3. View existing codes (masked) or click **Regenerate Codes**
4. Confirm — old codes are immediately invalidated
5. Copy and store the new codes securely

#### Via API
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/account/mfa/backup-codes/regenerate \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "currentMfaCode": "123456" }'
\`\`\`

### Response
\`\`\`json
{
  "backupCodes": [
    "a1b2-c3d4", "e5f6-g7h8", "i9j0-k1l2",
    "m3n4-o5p6", "q7r8-s9t0", "u1v2-w3x4",
    "y5z6-a7b8", "c9d0-e1f2"
  ],
  "generatedAt": "2026-03-01T09:00:00Z",
  "codesRemaining": 8
}
\`\`\`

### Best Practices
| Practice | Recommendation |
|----------|---------------|
| Storage | Password manager (1Password, Bitwarden, KeePass) |
| Print copy | Store in a secure physical location |
| Sharing | Never share — treat like a password |
| Regenerate when | Codes are running low (< 3 remaining) |

> Regenerating backup codes immediately invalidates all previously generated codes.`,
  },
  {
    question: "How do I revoke all active sessions from Security settings?",
    answer: `## Revoking All Sessions

### Why Revoke All Sessions?
- You suspect your account has been compromised
- You've just changed your password and want to force re-auth everywhere
- You lost a device that had an active session

### Revoke All Sessions
#### Via UI
1. Navigate to **Account → Security**
2. Scroll to **Active Sessions**
3. Click **Sign Out All Sessions**
4. Confirm — your current session will also be invalidated
5. You will be redirected to the login page

#### Revoke All Except Current
1. Navigate to **Account → Sessions**
2. Click **Sign Out All Other Sessions**
3. Only your current session remains active

#### Via API
\`\`\`bash
# Revoke ALL sessions (including current — you'll be logged out)
curl -X DELETE https://api.telemetryflow.id/api/v2/account/sessions/all \\
  -H "Authorization: Bearer $TOKEN"

# Revoke all EXCEPT current session
curl -X DELETE https://api.telemetryflow.id/api/v2/account/sessions \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "exceptCurrent": true }'
\`\`\`

### What Happens After Revocation
| Effect | Behavior |
|--------|---------|
| Other browser sessions | Immediately signed out |
| Mobile app sessions | Signed out on next API call |
| API keys | NOT revoked (manage separately under API Keys) |
| MFA configuration | Not changed |
| Password | Not changed (change separately if compromised) |`,
  },
  {
    question: "How do I view my login history?",
    answer: `## Login History

### View Login History
Navigate to **Account → Security → Login History**

### Last 30 Days — Login Events
| Date / Time | Method | IP | Location | Device | Result |
|------------|--------|-----|----------|--------|--------|
| 2026-03-01 09:14 | SSO (Okta) | 192.168.1.100 | New York, US | Chrome / macOS | ✅ |
| 2026-02-28 22:30 | Password + MFA | 10.0.0.42 | New York, US | Safari / iOS | ✅ |
| 2026-02-26 08:45 | SSO (Okta) | 192.168.1.100 | New York, US | Chrome / macOS | ✅ |
| 2026-02-24 03:15 | Password | 185.220.101.x | Unknown | Unknown | 🔴 Failed (x2) |
| 2026-02-20 14:20 | SSO (Okta) | 203.0.113.45 | London, UK | Chrome / Windows | ✅ |

### Query Login History via API
\`\`\`bash
curl "https://api.telemetryflow.id/api/v2/account/security/login-history?limit=50" \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`

### Login Event Fields
| Field | Description |
|-------|-------------|
| \`timestamp\` | UTC datetime of login attempt |
| \`method\` | password / sso / api-key / mfa |
| \`ipAddress\` | Client IP address |
| \`geoLocation\` | Country and city (best effort) |
| \`userAgent\` | Browser and OS |
| \`success\` | true / false |
| \`failReason\` | wrong-password / mfa-failed / account-locked |

### Login Alerts
Enable **email alerts for new logins** under:
**Account → Notifications → Login from new device → ✅ Enable**`,
  },
];

export const ACCOUNT_SECURITY_CONVERSATION_TITLES: string[] = [
  "Change account password",
  "Enable MFA authentication",
  "Security activity review",
  "TOTP MFA setup and apps",
  "Generate MFA backup codes",
  "Revoke all active sessions",
  "Login history review",
  "Password strength requirements",
  "Security alerts configuration",
  "Account recovery options",
];

// ==================== ACCOUNT SESSIONS CONTEXT ====================

export const ACCOUNT_SESSIONS_MOCK_DATA: MockQA[] = [
  {
    question: "Show my active login sessions",
    answer: `## Active Sessions

### Current Sessions (2)
| Session | Device | Browser | Location | Started | Last Active | Current? |
|---------|--------|---------|----------|---------|------------|---------|
| sess-abc123 | MacBook Pro | Chrome 122 | New York, US | Today 09:14 | 2m ago | ✅ This session |
| sess-def456 | iPhone 15 Pro | Safari / iOS | New York, US | Yesterday 22:30 | 8h ago | ❌ |

### Session Details — This Session
| Field | Value |
|-------|-------|
| Session ID | sess-abc123 |
| Created | Today 09:14 UTC |
| Last Active | 2 minutes ago |
| IP Address | 192.168.1.100 |
| User Agent | Chrome 122.0 / macOS Sonoma |
| MFA Verified | ✅ Yes |
| Auth Method | SSO (Okta) |
| Expires | In 6h 45m (auto-refresh on activity) |

### Recent Ended Sessions (Last 7 Days)
| Device | Ended At | Reason | Duration |
|--------|---------|--------|---------|
| Chrome / macOS | Yesterday 18:30 | Session timeout (idle 60m) | 4h 12m |
| iPad / iPadOS | 3d ago 15:20 | Manually signed out | 2h 05m |
| Chrome / Windows | 5d ago 09:00 | Password change (force logout) | 3h 40m |`,
  },
  {
    question: "How do I revoke or sign out a specific session?",
    answer: `## Revoking Sessions

### Revoke a Single Session
1. Navigate to **Account → Sessions**
2. Find the session to revoke
3. Click **Sign Out** next to the session
4. Confirm the action

The session is immediately invalidated — the device will be prompted to log in again.

### Revoke All Other Sessions
1. Navigate to **Account → Sessions**
2. Click **Sign Out All Other Sessions**
3. Confirm — this invalidates all sessions except your current one

### Via API
\`\`\`bash
# Revoke a specific session
curl -X DELETE https://api.telemetryflow.id/api/v2/account/sessions/sess-def456 \\
  -H "Authorization: Bearer $TOKEN"

# Revoke ALL other sessions
curl -X DELETE https://api.telemetryflow.id/api/v2/account/sessions \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "exceptCurrent": true }'
\`\`\`

### When to Revoke Sessions
| Situation | Action |
|-----------|--------|
| Lost or stolen device | Revoke that specific session immediately |
| Suspicious unrecognized session | Revoke + change password + review activity |
| Logging out from shared computer | Revoke specific session |
| Security incident | Revoke all + change password + reset MFA |

### Session Policy
- Sessions expire after **60 minutes** of inactivity
- Maximum session duration: **7 days** (regardless of activity)
- Password change forces logout of all sessions
- MFA change forces logout of all sessions`,
  },
  {
    question: "I see an unfamiliar session, what should I do?",
    answer: `## Responding to an Unknown Session

### Immediate Actions (in order)
1. **Don't panic** — first check if it might be a known device or location

### Step 1: Identify the Session
| Check | Action |
|-------|--------|
| Device name | Is it one of your devices? |
| Location | Could be your VPN exit node or ISP routing |
| Browser/OS | Do you use that combination? |
| Time of activity | Were you active at that time? |

### Step 2: Revoke the Suspicious Session
1. Navigate to **Account → Sessions**
2. Click **Sign Out** next to the unfamiliar session
3. If in doubt, click **Sign Out All Other Sessions**

### Step 3: Change Your Password
\`\`\`
Account → Security → Change Password
\`\`\`
This automatically invalidates all sessions.

### Step 4: Check for Unauthorized Changes
Review **Account → Security → Activity Log** for:
- Unauthorized logins from that session
- Profile changes (email, name)
- API key creation or deletion
- Role changes or workspace access

### Step 5: Report the Incident
If you confirm unauthorized access:
1. Contact your **Org Admin** immediately
2. Request a **forced password reset** for your account
3. Review **audit logs** via **System → Audit Logs** (Org Admin can do this)
4. Consider enabling **login notifications** going forward

### Preventive Measures
| Action | Benefit |
|--------|---------|
| Enable MFA | Prevents password-only access |
| Enable login email alerts | Instant notification of new logins |
| Use hardware security key | Strongest protection against phishing |`,
  },
  {
    question: "What are the session expiry and timeout settings?",
    answer: `## Session Expiry Settings

### Current Session Policy
| Policy | Value | Configurable By |
|--------|-------|----------------|
| Idle timeout | 60 minutes | Org Admin |
| Maximum session duration | 7 days | Org Admin |
| Remember me duration | 30 days | User (if allowed by Org Admin) |
| Token refresh window | Last 5 minutes before expiry | Automatic |

### How Session Expiry Works
1. **Idle timeout**: If no API calls are made for 60 minutes, the session expires
2. **Hard expiry**: Sessions are invalidated after 7 days regardless of activity
3. **Auto-refresh**: Frontend refreshes the access token every 14 minutes automatically
4. **Inactivity detection**: Mouse/keyboard activity in the UI resets the idle timer

### Extend Session Timeout (Org Admin)
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/admin/settings/session \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "idleTimeoutMinutes": 120,
    "maxSessionDurationDays": 14,
    "allowRememberMe": true
  }'
\`\`\`

### Session Expiry Notifications
| Event | Notification |
|-------|-------------|
| 10 minutes before idle expiry | Banner warning in UI |
| Session expired | Redirect to login with "session expired" message |
| New device login | Email alert (if enabled) |

> Shorter idle timeouts improve security but reduce convenience. For high-security environments, 30-minute idle timeout is recommended.`,
  },
  {
    question: "How does session IP tracking work?",
    answer: `## Session IP Tracking

### What Is Tracked Per Session
| Field | Description |
|-------|-------------|
| Login IP | IP address at time of authentication |
| Last request IP | Most recent API call IP |
| Geolocation | Country and city (MaxMind GeoIP2) |
| IP change detection | Alert if session IP changes significantly |

### Current Session IPs
| Session | Login IP | Current IP | Location | IP Change? |
|---------|---------|-----------|----------|------------|
| sess-abc123 (this) | 192.168.1.100 | 192.168.1.100 | New York, US | No |
| sess-def456 (mobile) | 10.0.0.42 | 10.0.0.42 | New York, US | No |

### IP Change Policy
By default, TelemetryFlow logs IP changes but does not invalidate sessions automatically. Org Admins can enable **strict IP binding**:

\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/admin/settings/session \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "strictIpBinding": true }'
\`\`\`

With strict IP binding enabled:
- Sessions are invalidated if the IP subnet changes (/24 for IPv4)
- Useful in environments where users have fixed IPs

### Privacy Note
- IPs are stored encrypted and subject to data retention policy (90 days)
- Users can view their own session IPs
- Org Admins can view IP data for audit purposes
- IPs are never shared externally`,
  },
  {
    question: "How do I view the session activity log?",
    answer: `## Session Activity Log

### What Is Logged Per Session
Each session records a timeline of significant API events:
- Login and MFA verification
- Dashboard loads and view changes
- Alert rule creates/edits/deletes
- Profile changes
- API key creation or revocation

### View Session Activity
\`\`\`bash
# Activity for a specific session
curl "https://api.telemetryflow.id/api/v2/account/sessions/sess-abc123/activity" \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`

### Sample Activity Timeline — sess-abc123
| Time | Action | Resource | Details |
|------|--------|---------|---------|
| 09:14:22 | LOGIN | — | SSO via Okta, MFA verified |
| 09:15:01 | VIEW | Dashboard | Home dashboard |
| 09:16:34 | CREATE | Alert Rule | high-cpu-payment-service |
| 09:20:11 | EDIT | Alert Rule | Updated threshold 70%→85% |
| 09:28:45 | VIEW | Reports | Monthly summary report |
| 09:45:00 | EXPORT | Report | PDF export generated |

### Filter Activity by Type
\`\`\`bash
curl "https://api.telemetryflow.id/api/v2/account/sessions/sess-abc123/activity?action=CREATE,EDIT&limit=20" \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`

### Retention
Session activity logs are retained for **90 days** and then automatically purged.`,
  },
  {
    question: "How do I configure idle session timeout?",
    answer: `## Idle Session Timeout Configuration

### Default Configuration
| Setting | Value |
|---------|-------|
| Idle timeout | 60 minutes |
| Warning shown | 10 minutes before expiry |
| Action on expiry | Redirect to login |
| Session preserved on | Any mouse, keyboard, or API activity |

### How the Idle Timer Works
- Every API request from the frontend resets the idle timer
- The frontend itself makes a keepalive ping every 5 minutes if the tab is active
- If the browser tab is inactive (minimized, background), no keepalive is sent
- After 60 minutes of no activity, the session token expires

### Adjust Idle Timeout (Org Admin Only)
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/admin/settings/session \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "idleTimeoutMinutes": 30 }'
\`\`\`

### Recommended Idle Timeout by Use Case
| Environment | Recommended Timeout |
|------------|---------------------|
| High-security (finance, healthcare) | 15–30 minutes |
| Standard enterprise | 60 minutes |
| Developer workstations (trusted env) | 120–240 minutes |
| Shared / kiosk terminals | 5–10 minutes |

### User-Level Override
If allowed by Org Admin, individual users can adjust their own timeout:
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/account/preferences \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "idleTimeoutMinutes": 120 }'
\`\`\``,
  },
];

export const ACCOUNT_SESSIONS_CONVERSATION_TITLES: string[] = [
  "View active sessions",
  "Revoke a session",
  "Suspicious session response",
  "Session expiry settings",
  "Session IP tracking",
  "Session activity log",
  "Idle timeout configuration",
  "Concurrent session limit",
  "Mobile vs desktop sessions",
  "Session geolocation",
];

// ==================== ACCOUNT NOTIFICATIONS CONTEXT ====================

export const ACCOUNT_NOTIFICATIONS_MOCK_DATA: MockQA[] = [
  {
    question: "How do I configure my personal notification preferences?",
    answer: `## Personal Notification Preferences

### Navigate to Settings
**Account → Notifications**

### Notification Categories
| Category | Description | Default | Your Setting |
|----------|-------------|---------|-------------|
| Alert Fired | Notified when an alert you're subscribed to fires | ✅ Email | ✅ Email + Slack |
| Alert Resolved | When a previously fired alert resolves | ✅ Email | ✅ Email |
| Mention | Someone mentions you in a comment | ✅ Email | ✅ Email + Push |
| Report Ready | Scheduled report generated | ✅ Email | ✅ Email |
| Invite Received | Workspace or org invitation | ✅ Email | ✅ Email |
| Login from new device | Security: new device login | ❌ Off | ✅ Email (recommended) |
| API Key expiry | 7 days before key expires | ✅ Email | ✅ Email |
| Digest | Daily summary of activity | ❌ Off | ❌ Off |

### Notification Channels Available
| Channel | Setup Required |
|---------|---------------|
| Email | ✅ Automatic (uses your account email) |
| Slack | Requires Slack OAuth link in Preferences |
| Browser Push | Requires one-time browser permission |
| Mobile Push | Requires TelemetryFlow mobile app |

### Per-Alert Notification Override
You can override notification settings per alert rule:
1. Go to the alert rule
2. Click **Subscribe** → choose your preferred method
3. This overrides your global preferences for that alert`,
  },
  {
    question: "I'm getting too many notifications. How do I reduce the noise?",
    answer: `## Reducing Notification Noise

### Quick Wins
| Action | Effect |
|--------|--------|
| Unsubscribe from low-priority alerts | Immediate reduction |
| Disable "Alert Resolved" emails | -30% notifications for active alert periods |
| Enable **Daily Digest** instead of real-time | Batches all activity into one email |
| Adjust alert rule thresholds | Fewer triggers = fewer notifications |

### Current Volume Estimate
| Category | Your Notifications/week | Status |
|----------|------------------------|--------|
| Alert Fired | 87 | ⚠️ High |
| Alert Resolved | 84 | ⚠️ High |
| Mentions | 5 | ✅ Low |
| Reports | 3 | ✅ Low |
| Total | **179/week** | ⚠️ Consider reducing |

### Recommended Settings for High-Volume Users
\`\`\`
Alert Fired:    Email — Only CRITICAL and WARNING
Alert Resolved: Disable (or Daily Digest only)
Mentions:       Email + Slack (keep — these require response)
Reports:        Email (keep — important deliverables)
Daily Digest:   Enable — good overview without noise
\`\`\`

### Alert Subscription Management
1. Navigate to **Alerts** → filter by alerts you're subscribed to
2. Unsubscribe from informational alerts
3. Keep subscriptions only for alerts in your scope

### Mute During Off-Hours
Enable **Do Not Disturb** hours:
- **Account → Notifications → Do Not Disturb**
- Set hours (e.g., 22:00 – 07:00 UTC)
- Emergency/Critical alerts can bypass DND`,
  },
  {
    question: "How do I configure alert notifications specifically?",
    answer: `## Alert Notification Configuration

### Alert Subscription Model
You receive alert notifications for rules where you are:
1. **Directly subscribed** (clicked Subscribe on an alert rule)
2. **Team member** of a team assigned to the alert rule
3. **Workspace admin** (opt-in to all workspace alerts)

### Configure Alert Notification Delivery
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/account/notifications \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "alertFired": { "email": true, "slack": true, "push": false },
    "alertResolved": { "email": false, "slack": false, "push": false },
    "alertSeverityFilter": ["critical", "high"]
  }'
\`\`\`

### Severity-Based Filtering
| Severity | Notify? | Channel |
|----------|---------|---------|
| Critical | ✅ Yes | Email + Slack + Push |
| High | ✅ Yes | Email + Slack |
| Warning | ⚠️ Digest only | Daily digest email |
| Info | ❌ No | Not notified |

### Subscribe to a Specific Alert
1. Navigate to **Alerts → Rules**
2. Open the alert rule
3. Click **Subscribe**
4. Choose: Email / Slack / Push / All
5. This overrides your global severity filter for this rule

### Unsubscribe from an Alert
\`\`\`bash
curl -X DELETE https://api.telemetryflow.id/api/v2/alerts/rules/rule-abc/subscriptions \\
  -H "Authorization: Bearer $TOKEN"
\`\`\``,
  },
  {
    question: "How do I configure system notification settings?",
    answer: `## System Notification Settings

### System Notification Types
| Type | Description | Default |
|------|-------------|---------|
| Platform maintenance | Scheduled downtime announcements | ✅ Email |
| New feature announcements | Release notes and changelog | ❌ Off |
| Security alerts | Account-level security events | ✅ Email |
| Subscription / billing | Plan renewals, usage limits | ✅ Email |
| Workspace invitations | Invited to join a workspace | ✅ Email |
| Role changes | Your role has been updated | ✅ Email |

### Configure System Notifications
#### Via UI
1. Navigate to **Account → Notifications → System**
2. Toggle each category on/off
3. Select delivery channel (Email / Push)
4. Save

#### Via API
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/account/notifications/system \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "maintenance": { "email": true },
    "features": { "email": false },
    "security": { "email": true },
    "billing": { "email": true },
    "invitations": { "email": true },
    "roleChanges": { "email": true }
  }'
\`\`\`

### Security Notifications (Recommended ON)
| Notification | Why Important |
|-------------|--------------|
| New device login | Detect unauthorized access immediately |
| Password changed | Confirm intentional change |
| MFA disabled | Alert if MFA is removed |
| API key created | Auditing key creation |`,
  },
  {
    question: "How do I set up a daily digest email?",
    answer: `## Daily Digest Email Setup

### What the Digest Includes
- Summary of alerts fired and resolved in the past 24h
- Top 5 active firing alerts by severity
- Report generation completions
- Workspace activity summary
- Upcoming scheduled report deliveries

### Enable Daily Digest
#### Via UI
1. Navigate to **Account → Notifications**
2. Find **Daily Digest**
3. Toggle **Enable**
4. Set delivery time (e.g., 08:00 in your local timezone)
5. Choose digest scope: My alerts only / All workspace alerts
6. Save

#### Via API
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/account/notifications \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "digest": {
      "enabled": true,
      "deliveryTime": "08:00",
      "scope": "my-alerts",
      "includeResolved": true
    }
  }'
\`\`\`

### Sample Digest Email
\`\`\`
TelemetryFlow Daily Summary — March 1, 2026

ALERTS (Last 24h)
• 12 fired, 10 resolved, 2 still active
• Critical: HighErrorRatePayment (firing 3h)
• Warning: DiskSpaceLow (firing 45m)

REPORTS
• Monthly Infrastructure Report — ready to view

UPCOMING
• Weekly SRE Report scheduled for tomorrow 09:00
\`\`\``,
  },
  {
    question: "How do I configure notification quiet hours (Do Not Disturb)?",
    answer: `## Notification Quiet Hours (Do Not Disturb)

### What DND Does
During quiet hours, non-critical notifications are suppressed. You still receive notifications immediately for:
- **Critical** severity alerts (configurable — can also suppress)
- Security alerts (password change, new login)
- System emergencies

### Configure Quiet Hours
#### Via UI
1. Navigate to **Account → Notifications → Do Not Disturb**
2. Toggle **Enable Quiet Hours**
3. Set start time: e.g., 22:00
4. Set end time: e.g., 07:00
5. Select timezone (uses your profile timezone by default)
6. Choose: **Allow Critical alerts during DND** → ✅ Yes
7. Save

#### Via API
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/account/notifications/quiet-hours \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "enabled": true,
    "startTime": "22:00",
    "endTime": "07:00",
    "timezone": "America/New_York",
    "allowCritical": true,
    "allowSecurity": true
  }'
\`\`\`

### DND Behavior Matrix
| Severity | DND Suppressed? | Configurable? |
|----------|:--------------:|:-------------:|
| Critical | ❌ Never (default) | ✅ Can enable |
| High | ✅ Yes | ✅ |
| Warning | ✅ Yes | ✅ |
| Info | ✅ Yes | ✅ |
| Security | ❌ Never | ✅ Can enable |

### Missed Notifications
Notifications suppressed during DND are queued and delivered as a **DND summary** at the end of quiet hours.`,
  },
  {
    question: "How do I test notification delivery?",
    answer: `## Testing Notification Delivery

### Why Test Notifications?
- Verify your email address is receiving notifications
- Confirm Slack OAuth is correctly linked
- Test push notification setup on mobile

### Send a Test Notification
#### Via UI
1. Navigate to **Account → Notifications**
2. Click **Test Notifications** at the bottom of the page
3. Select channels to test: Email / Slack / Push
4. Click **Send Test**
5. Check your inbox / Slack / phone for the test message

#### Via API
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/account/notifications/test \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "channels": ["email", "slack", "push"],
    "message": "This is a test notification from TelemetryFlow"
  }'
\`\`\`

### Test Response
\`\`\`json
{
  "results": {
    "email": { "success": true, "deliveredTo": "alex@company.com" },
    "slack": { "success": true, "deliveredTo": "#alerts-personal" },
    "push": { "success": false, "error": "No push token registered" }
  }
}
\`\`\`

### Troubleshooting Failed Tests
| Channel | Failure | Fix |
|---------|---------|-----|
| Email | Not received | Check spam folder; verify email in profile |
| Slack | 401 error | Re-link Slack under Account → Preferences |
| Push | No token | Install mobile app and enable notifications |`,
  },
  {
    question: "How do I unsubscribe from specific notification types?",
    answer: `## Unsubscribing from Specific Notifications

### Unsubscribe via One-Click Link
Every notification email includes an **Unsubscribe** link at the bottom. Clicking it opens a page where you can:
- Unsubscribe from that specific notification type only
- Unsubscribe from all notifications (not recommended)
- Adjust frequency (real-time → digest)

### Unsubscribe from Specific Categories
#### Via UI
1. Navigate to **Account → Notifications**
2. Find the category to disable
3. Toggle off each channel (Email / Slack / Push)
4. Save

#### Via API
\`\`\`bash
# Disable "Alert Resolved" email notifications
curl -X PATCH https://api.telemetryflow.id/api/v2/account/notifications \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "alertResolved": { "email": false, "slack": false } }'

# Unsubscribe from a specific alert rule
curl -X DELETE https://api.telemetryflow.id/api/v2/alerts/rules/rule-abc/subscriptions \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`

### Which Notifications Cannot Be Disabled
| Notification | Reason |
|-------------|--------|
| Password reset emails | Security — always sent |
| Email verification | Account integrity |
| Account locked notification | Security |
| MFA backup code used | Security audit |

> These security-critical notifications are always delivered to your account email and cannot be disabled.`,
  },
];

export const ACCOUNT_NOTIFICATIONS_CONVERSATION_TITLES: string[] = [
  "Configure notification preferences",
  "Reduce notification noise",
  "Alert notification settings",
  "System notification settings",
  "Daily digest email setup",
  "Quiet hours configuration",
  "Test notification delivery",
  "Unsubscribe from notifications",
  "Notification priority levels",
  "Notification history",
];

// ==================== ACCOUNT PREFERENCES CONTEXT ====================

export const ACCOUNT_PREFERENCES_MOCK_DATA: MockQA[] = [
  {
    question: "What preferences can I customize in my account?",
    answer: `## Account Preferences Overview

### Navigate to: Account → Preferences

### Appearance
| Setting | Options | Current |
|---------|---------|---------|
| Theme | Light / Dark / System | Dark |
| Color Scheme | Default / Blue / Green / Purple | Default |
| Sidebar | Expanded / Collapsed / Auto-hide | Expanded |
| Font Size | Small / Medium / Large | Medium |
| Compact Mode | On / Off | Off |

### Localization
| Setting | Options | Current |
|---------|---------|---------|
| Language | EN, ID, JA, ZH, DE, FR, ES, PT | English (EN) |
| Date Format | MM/DD/YYYY / DD/MM/YYYY / YYYY-MM-DD | YYYY-MM-DD |
| Time Format | 12h / 24h | 24h |
| Timezone | Any IANA timezone | America/New_York |
| Currency | USD / EUR / GBP / IDR | USD |
| Number Format | 1,234.56 / 1.234,56 | 1,234.56 |

### Dashboard & Charts
| Setting | Options | Current |
|---------|---------|---------|
| Default Time Range | 1h / 3h / 6h / 24h / 7d | 1h |
| Chart Animation | On / Off | On |
| Graph Refresh | 30s / 1m / 5m / Manual | 1m |
| Table Row Density | Compact / Default / Relaxed | Default |

### Accessibility
| Setting | Options | Current |
|---------|---------|---------|
| Reduce Motion | On / Off | Off |
| High Contrast | On / Off | Off |
| Screen Reader Hints | On / Off | Off |`,
  },
  {
    question: "How do I change the interface language?",
    answer: `## Changing Interface Language

### Via UI
1. Navigate to **Account → Preferences**
2. Find **Language** under Localization
3. Select your preferred language from the dropdown
4. The interface updates immediately — no reload required

### Supported Languages
| Code | Language | Completion | Status |
|------|----------|-----------|--------|
| EN | English | 100% | ✅ Full support |
| ID | Bahasa Indonesia | 95% | ✅ Full support |
| JA | 日本語 (Japanese) | 88% | ✅ Stable |
| ZH | 中文 (Chinese Simplified) | 85% | ✅ Stable |
| DE | Deutsch (German) | 82% | ✅ Stable |
| FR | Français (French) | 80% | ✅ Stable |
| ES | Español (Spanish) | 78% | ⚠️ In progress |
| PT | Português (Portuguese) | 75% | ⚠️ In progress |

> ⚠️ Untranslated strings fall back to English.

### Via API
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/account/preferences \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "language": "id",
    "dateFormat": "DD/MM/YYYY",
    "timeFormat": "24h",
    "timezone": "Asia/Jakarta"
  }'
\`\`\`

### Timezone & Language Together
When changing language, you may also want to update:
- **Timezone** — affects timestamps in alerts and reports
- **Date/Time format** — common formats differ by region (ID: DD/MM/YYYY, US: MM/DD/YYYY)`,
  },
  {
    question: "How do I toggle between dark and light theme?",
    answer: `## Dark / Light Theme Toggle

### Via UI
1. Navigate to **Account → Preferences → Appearance**
2. Find **Theme** setting
3. Choose: **Light** / **Dark** / **System** (follows OS setting)
4. Change takes effect immediately — no reload required

### Via Keyboard Shortcut
Press \`Ctrl+Shift+T\` (Windows/Linux) or \`Cmd+Shift+T\` (macOS) to toggle between Light and Dark instantly.

### Via API
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/account/preferences \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "theme": "dark" }'
\`\`\`

### Theme Options
| Option | Behavior |
|--------|---------|
| \`light\` | Always light theme regardless of OS |
| \`dark\` | Always dark theme regardless of OS |
| \`system\` | Follows OS dark/light mode setting (recommended) |

### Current Theme Status
| Setting | Value |
|---------|-------|
| Theme | Dark |
| Color Scheme | Default (slate/blue) |
| Sidebar color | Matches theme |
| Chart colors | Optimized for dark background |

### High Contrast Mode
For accessibility, enable **High Contrast** alongside dark/light theme:
- Increases contrast ratios on text and UI elements
- Useful for low-vision users or bright screen environments
- Available under **Account → Preferences → Accessibility**`,
  },
  {
    question: "How do I set my default landing page after login?",
    answer: `## Default Landing Page

### What Is the Landing Page?
The landing page is the first view shown after a successful login. By default it is the **Home Dashboard**.

### Available Landing Pages
| Page | Path | Description |
|------|------|-------------|
| Home Dashboard | /dashboard | Overview with stat panels and charts |
| Metrics | /metrics | Metrics explorer |
| Traces | /traces | Distributed tracing view |
| Logs | /logs | Log explorer |
| Alerts | /alerts | Active alerts and rules |
| Reports | /reports | Generated reports |
| Uptime | /uptime | Uptime monitoring |
| Custom Dashboard | /dashboard/:id | Any saved dashboard by ID |

### Set Landing Page
#### Via UI
1. Navigate to **Account → Preferences → General**
2. Find **Default Landing Page**
3. Select from the dropdown or enter a custom dashboard URL
4. Save

#### Via API
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/account/preferences \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "defaultLandingPage": "/metrics" }'
\`\`\`

### Custom Dashboard as Landing Page
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/account/preferences \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "defaultLandingPage": "/dashboard/dash-abc123" }'
\`\`\`

> The landing page is per-user and does not affect other team members.`,
  },
  {
    question: "How do I set the default rows per page for tables?",
    answer: `## Table Rows Per Page Setting

### What This Controls
This setting applies to all paginated data tables across the platform:
- Alert rules list
- Log explorer results
- Traces list
- Reports list
- User management tables
- Audit log table

### Set Rows Per Page
#### Via UI
1. Navigate to **Account → Preferences → Dashboard & Data**
2. Find **Table Row Density** and **Rows Per Page**
3. Select your preferred value
4. Save — applies immediately to all tables

#### Via API
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/account/preferences \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "tableRowsPerPage": 50,
    "tableRowDensity": "compact"
  }'
\`\`\`

### Available Options
| Setting | Options | Notes |
|---------|---------|-------|
| Rows per page | 10 / 25 / 50 / 100 | Default: 25 |
| Row density | Compact / Default / Relaxed | Affects row height |

### Per-Table Override
Some tables allow a local rows-per-page selector in the table footer. This overrides your global preference for that session only.

### Performance Tip
Setting rows per page to **100** may increase page load time for complex queries. For log and trace explorers, **25–50 rows** is recommended.`,
  },
  {
    question: "How do I set the default chart type?",
    answer: `## Default Chart Type Setting

### What This Controls
When creating new graph panels or viewing auto-generated charts in dashboards, the default chart type is used as the starting point.

### Available Chart Types
| Chart Type | Best For |
|-----------|---------|
| Line | Time-series trends, metrics over time |
| Bar | Comparisons, categorized data |
| Area | Volume metrics, stacked data |
| Pie / Donut | Proportional data, distributions |
| Stat | Single value, KPI display |
| Gauge | Utilization percentage |
| Heatmap | Frequency distributions, latency histograms |
| Table | Tabular data, list views |
| Text | Markdown descriptions, runbooks |

### Set Default Chart Type
#### Via UI
1. Navigate to **Account → Preferences → Dashboard & Charts**
2. Find **Default Chart Type**
3. Select from dropdown
4. Save

#### Via API
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/account/preferences \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "defaultChartType": "line" }'
\`\`\`

### Per-Panel Override
Each dashboard panel has its own chart type selector. The default is only used when creating a new panel — existing panels retain their configured type.

### Recommendation
| Role | Recommended Default |
|------|---------------------|
| SRE / DevOps | Line (time-series is most common) |
| Manager / Exec | Stat / Gauge (KPI focus) |
| Data Analyst | Bar / Table (comparison focus) |`,
  },
  {
    question: "What keyboard shortcuts are available in TelemetryFlow?",
    answer: `## Keyboard Shortcuts

### Global Shortcuts
| Shortcut | Action |
|----------|--------|
| \`?\` | Open keyboard shortcuts help |
| \`Ctrl+K\` / \`Cmd+K\` | Global search / command palette |
| \`Ctrl+Shift+T\` / \`Cmd+Shift+T\` | Toggle dark/light theme |
| \`Ctrl+/\` / \`Cmd+/\` | Open AI Assistant chat |
| \`Esc\` | Close modal / panel |

### Navigation Shortcuts
| Shortcut | Destination |
|----------|-------------|
| \`G H\` | Go to Home Dashboard |
| \`G M\` | Go to Metrics |
| \`G T\` | Go to Traces |
| \`G L\` | Go to Logs |
| \`G A\` | Go to Alerts |
| \`G R\` | Go to Reports |
| \`G S\` | Go to Settings |

### Dashboard & Charts
| Shortcut | Action |
|----------|--------|
| \`R\` | Refresh current dashboard |
| \`F\` | Toggle fullscreen on focused panel |
| \`E\` | Edit focused panel |
| \`D\` | Duplicate focused panel |
| \`Ctrl+Z\` / \`Cmd+Z\` | Undo last dashboard change |

### Enable / Customize Shortcuts
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/account/preferences \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "keyboardShortcutsEnabled": true }'
\`\`\`

> Custom key bindings are not currently supported. The shortcut list above is the standard set.`,
  },
  {
    question: "How do I configure accessibility settings?",
    answer: `## Accessibility Settings

### Navigate to
**Account → Preferences → Accessibility**

### Available Accessibility Options
| Setting | Options | Description |
|---------|---------|-------------|
| Reduce Motion | On / Off | Disables animations, transitions, auto-scroll |
| High Contrast | On / Off | Increases contrast ratio for text and UI elements |
| Screen Reader Hints | On / Off | Adds ARIA labels and descriptive text for screen readers |
| Focus Indicators | Enhanced / Default | Larger, more visible keyboard focus outlines |
| Font Size | Small / Medium / Large / X-Large | Global font size scaling |
| Color Blind Mode | None / Deuteranopia / Protanopia / Tritanopia | Adjusts chart color palette |

### Configure via API
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/account/preferences \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "reduceMotion": true,
    "highContrast": false,
    "screenReaderHints": true,
    "focusIndicators": "enhanced",
    "fontSize": "large",
    "colorBlindMode": "deuteranopia"
  }'
\`\`\`

### Color Blind Palettes
| Mode | Condition | Palette Used |
|------|-----------|-------------|
| None | Standard vision | Default (blue/orange/green) |
| Deuteranopia | Red-green (most common) | Blue/yellow safe palette |
| Protanopia | Red deficiency | Blue/yellow safe palette |
| Tritanopia | Blue-yellow | Red/green safe palette |

> Accessibility settings are per-user and do not affect the view for other team members.`,
  },
];

export const ACCOUNT_PREFERENCES_CONVERSATION_TITLES: string[] = [
  "Customize account preferences",
  "Change interface language",
  "Toggle dark and light theme",
  "Set default landing page",
  "Table rows per page setting",
  "Default chart type",
  "Keyboard shortcuts guide",
  "Accessibility settings",
  "Export format defaults",
  "Sidebar layout preferences",
];

// ==================== ACCOUNT ORGANIZATION CONTEXT ====================

export const ACCOUNT_ORGANIZATION_MOCK_DATA: MockQA[] = [
  {
    question: "Show me my organization overview",
    answer: `## My Organization Overview

### Organization Details
| Field | Value |
|-------|-------|
| Name | Telemetri Data Indonesia |
| Slug | devopscorner |
| Plan | Enterprise |
| Region | ap-southeast-1 (Singapore) |
| Created | 2024-01-15 |
| Status | ✅ Active |
| Contract Renewal | 2027-01-15 |

### Member Summary
| Role | Count | Last Active |
|------|-------|-------------|
| Super Admin | 2 | Today |
| Org Admin | 5 | Today |
| Workspace Admin | 8 | Today |
| Developer | 25 | Today |
| Viewer | 8 | 3 days ago |
| **Total** | **48** | |

### Resource Usage
| Resource | Used | Limit | Status |
|----------|------|-------|--------|
| Workspaces | 4 / 10 | 4 | ✅ OK |
| Users | 48 / 100 | 48% | ✅ OK |
| API Keys | 12 / 50 | 24% | ✅ OK |
| Data Retention | 90 days | 90 days | ✅ Plan Max |

### Workspaces
| Workspace | Environment | Members | Last Activity |
|-----------|-------------|---------|---------------|
| production | prod | 34 | Now |
| staging | staging | 22 | 1h ago |
| development | dev | 18 | 2h ago |
| analytics | prod | 8 | 4h ago |`,
  },
  {
    question: "Who are the members of my organization?",
    answer: `## Organization Members

### Members by Role
**Super Admin (2)**
| Name | Email | Last Login | MFA |
|------|-------|-----------|-----|
| Ahmad Ridwan | ahmad@telemetryflow.id | Today | ✅ |
| Sarah Chen | sarah@telemetryflow.id | Today | ✅ |

**Org Admin (5)**
| Name | Email | Last Login | MFA |
|------|-------|-----------|-----|
| Budi Santoso | budi@telemetryflow.id | Today | ✅ |
| Dewi Rahayu | dewi@telemetryflow.id | 2h ago | ✅ |
| James Wilson | james@telemetryflow.id | Yesterday | ⚠️ |
| Li Wei | liwei@telemetryflow.id | Today | ✅ |
| Maya Sari | maya@telemetryflow.id | 3h ago | ✅ |

### Activity Metrics (30d)
| Metric | Value |
|--------|-------|
| Active Users | 42 / 48 |
| Inactive (>30d) | 6 |
| Pending Invitations | 3 |
| SSO Users | 32 |
| API Key Only | 4 |

### Inactive Members
6 members haven't logged in for 30+ days. Consider reviewing or removing their access.

### Recommendations
1. Review inactive members for access revocation
2. Enforce MFA for James Wilson (Org Admin without MFA)
3. Follow up on 3 pending invitations`,
  },
  {
    question: "What are my organization's security policies?",
    answer: `## Organization Security Policies

### Authentication Policies
| Policy | Setting | Status |
|--------|---------|--------|
| Minimum password length | 12 chars | ✅ |
| Password complexity | Upper+Lower+Number+Special | ✅ |
| Password expiry | 90 days | ✅ |
| MFA requirement | All Org Admins | ⚠️ Partial |
| SSO enforcement | Optional | Consider enforcing |
| Session timeout | 8 hours | ✅ |
| Max concurrent sessions | 5 | ✅ |

### Access Policies
| Policy | Setting | Status |
|--------|---------|--------|
| IP allowlist | Disabled | ⚠️ |
| Login hours restriction | None | Optional |
| Failed login lockout | 5 attempts → 15min | ✅ |
| Geographic restrictions | None | Optional |

### Data Policies
| Policy | Setting | Status |
|--------|---------|--------|
| PII masking | Enabled (24 rules) | ✅ |
| Data export allowed | All roles | ⚠️ Consider restricting |
| Audit log retention | 365 days | ✅ |

### Security Score: 76/100
**Gaps:**
1. Not all Org Admins have MFA (1/5 missing)
2. No IP allowlist configured
3. Data export unrestricted for all roles`,
  },
  {
    question: "Show organization billing and subscription details",
    answer: `## Organization Billing & Subscription

### Current Plan: Enterprise
| Feature | Limit | Used | Status |
|---------|-------|------|--------|
| Users | 100 | 48 | ✅ 48% |
| Workspaces | 10 | 4 | ✅ 40% |
| Data ingestion | 500 GB/day | 234 GB/day | ✅ 47% |
| Metrics retention | 90 days | 90 days | ✅ |
| Log retention | 30 days | 30 days | ✅ |
| API calls | 10M/month | 4.5M | ✅ 45% |

### Billing Summary
| Period | Invoice | Status |
|--------|---------|--------|
| Feb 2026 | $2,340 | ✅ Paid |
| Jan 2026 | $2,280 | ✅ Paid |
| Dec 2025 | $2,145 | ✅ Paid |
| Nov 2025 | $2,067 | ✅ Paid |

### Contract Details
- Contract Start: 2025-01-15
- Contract End: 2027-01-15
- Annual Commitment: $28,000
- Overage Rate: $0.12/GB after 500 GB/day

### Usage Trend
Data ingestion growing at ~8%/month. At current rate, will reach plan limit in ~7 months.

### Recommendation
Consider upgrading to Enterprise Plus if growth continues, or enable retention rules to reduce ingestion volume.`,
  },
  {
    question: "How do I manage workspace assignments for my team?",
    answer: `## Workspace Assignment Guide

### Current Workspace→Member Assignments
| Workspace | Members | Admins | Notes |
|-----------|---------|--------|-------|
| production | 34 | 3 | All senior engineers |
| staging | 22 | 5 | Dev + QA team |
| development | 18 | 6 | Dev team only |
| analytics | 8 | 2 | Analytics team |

### Members in Multiple Workspaces
| Member | Workspaces | Risk Level |
|--------|-----------|-----------|
| Ahmad Ridwan | All 4 | Super Admin — expected |
| Sarah Chen | All 4 | Super Admin — expected |
| Budi Santoso | prod + staging | Org Admin — review |
| 12 Developers | staging + dev | Normal |

### Assigning a Member to a Workspace
1. Go to **IAM → Users** → select user
2. Click **Manage Workspaces**
3. Toggle workspace access ON/OFF
4. Set workspace-level role (can differ from org role)

### Best Practices
- **Production**: Only senior engineers + admins
- **Staging**: Dev + QA teams
- **Development**: All engineers
- **Analytics**: Analytics team + data engineers

### Automation
You can also manage assignments via API:
\`\`\`
POST /api/v2/iam/assignments
{ "userId": "...", "workspaceId": "...", "role": "developer" }
\`\`\``,
  },
  {
    question: "Show organization audit log summary",
    answer: `## Organization Audit Log Summary (Last 30 Days)

### Activity Overview
| Action Category | Count | Top Actor |
|-----------------|-------|-----------|
| User login | 4,567 | Various |
| Dashboard views | 12,345 | Developer role |
| Alert rule changes | 34 | budi@telemetryflow.id |
| User management | 23 | ahmad@telemetryflow.id |
| API key operations | 45 | CI/CD systems |
| Settings changes | 12 | sarah@telemetryflow.id |
| Data exports | 8 | analytics team |
| Permission changes | 5 | ahmad@telemetryflow.id |

### Notable Events
| Date | Event | Actor | Detail |
|------|-------|-------|--------|
| Mar 13 | New user invited | ahmad@telemetryflow.id | 3 new developers |
| Mar 12 | Alert rule deleted | budi@telemetryflow.id | legacy pod-cpu rule |
| Mar 10 | API key rotated | ci-runner-sa | Annual rotation |
| Mar 8 | SSO config updated | sarah@telemetryflow.id | Added Okta IDP |
| Mar 5 | Data export | analytics@telemetryflow.id | Monthly report |

### Login Anomalies
No suspicious login patterns detected. All logins from expected IP ranges.

### Recommendation
Enable email alerts for: user invitation, permission change, data export actions.`,
  },
  {
    question: "What integrations does my organization have configured?",
    answer: `## Organization Integrations

### Configured Integrations
| Integration | Type | Status | Connected By | Date |
|-------------|------|--------|-------------|------|
| Okta | SSO/IDP | ✅ Active | sarah@telemetryflow.id | 2025-03-08 |
| Slack | Notifications | ✅ Active | budi@telemetryflow.id | 2024-06-01 |
| PagerDuty | Alerting | ✅ Active | budi@telemetryflow.id | 2024-06-01 |
| GitHub Actions | CI/CD API | ✅ Active | ci-runner-sa | 2024-08-15 |
| AWS S3 | Export | ✅ Active | sarah@telemetryflow.id | 2025-01-20 |
| Jira | Incident | ⚠️ Warning | budi@telemetryflow.id | 2024-09-01 |

### Jira Integration Warning
Last successful sync: 8 days ago.
Error: API token expired. Re-authenticate at Settings → Integrations → Jira.

### Webhook Endpoints
| Endpoint | Events | Last Triggered | Status |
|----------|--------|---------------|--------|
| https://hooks.slack.com/... | Alerts | 2h ago | ✅ |
| https://events.pagerduty.com/... | Critical Alerts | 4h ago | ✅ |
| https://api.yourjira.com/... | Incidents | 8d ago | ⚠️ |

### Recommendations
1. Re-authenticate Jira integration (API token expired)
2. Audit GitHub Actions API key permissions (reduce to least-privilege)
3. Add Teams webhook as Slack backup channel`,
  },
  {
    question: "How do I set up SSO for my organization?",
    answer: `## SSO Configuration Guide

### Current SSO Setup
| Provider | Protocol | Status | Users |
|----------|----------|--------|-------|
| Okta | SAML 2.0 | ✅ Active | 32 |
| Google Workspace | OAuth 2.0 | Not configured | — |
| Azure AD | OIDC | Not configured | — |

### Okta SAML 2.0 Configuration
\`\`\`yaml
SAML Settings:
  Entity ID: https://app.telemetryflow.id/saml/metadata
  ACS URL: https://app.telemetryflow.id/saml/callback
  Attribute Mapping:
    email: user.email
    firstName: user.firstName
    lastName: user.lastName
    role: user.role  ← Org custom attribute
\`\`\`

### Role Mapping (Okta → TelemetryFlow)
| Okta Group | TelemetryFlow Role |
|-----------|-------------------|
| tf-super-admins | Super Admin |
| tf-org-admins | Org Admin |
| tf-developers | Developer |
| tf-viewers | Viewer |

### Steps to Add Google Workspace SSO
1. Go to **Settings → Authentication → SSO**
2. Click **Add Provider** → Google Workspace
3. Enter your Google Workspace domain
4. Download SP metadata and configure in Google Admin
5. Test with a non-admin account first

### Recommendation
Enforce SSO for all Org Admins — currently 1/5 uses password auth only.`,
  },
  {
    question: "What is the organization's data residency configuration?",
    answer: `## Data Residency & Regional Configuration

### Current Configuration
| Data Type | Primary Region | Backup Region | Status |
|-----------|---------------|---------------|--------|
| Metrics | ap-southeast-1 | ap-southeast-3 | ✅ |
| Logs | ap-southeast-1 | ap-southeast-3 | ✅ |
| Traces | ap-southeast-1 | None | ⚠️ No backup |
| Configuration (PG) | ap-southeast-1 | ap-southeast-3 | ✅ |
| Cache (Redis) | ap-southeast-1 | None | ⚠️ No backup |

### GDPR & Data Sovereignty
| Requirement | Status | Region |
|-------------|--------|--------|
| EU data stays in EU | N/A | No EU users |
| Indonesia PDPA (UU PDP) | ✅ Compliant | Data in SG+ID regions |
| No US-only storage | ✅ | SG region primary |

### Latency by Region
| User Location | Latency | Routing |
|---------------|---------|---------|
| Jakarta, Indonesia | 12ms | Direct to ap-southeast-1 |
| Singapore | 2ms | Local |
| Sydney | 89ms | Via SG |
| Tokyo | 45ms | Via SG |

### Recommendations
1. Add ap-southeast-3 (Jakarta) as primary region for lower latency to Indonesia users
2. Enable trace replication to backup region
3. Configure Redis cross-region replication for cache HA`,
  },
  {
    question: "Show organization-level alert and notification policy",
    answer: `## Organization Notification & Alert Policy

### Org-Level Alert Routing
| Severity | Primary Channel | Escalation | Timeout |
|----------|----------------|-----------|---------|
| Critical | PagerDuty + Slack #alerts | On-call → Org Admin | 5 min |
| High | Slack #alerts | Workspace Admin | 15 min |
| Medium | Slack #monitoring | None | 60 min |
| Low | Email digest | None | Daily |

### On-Call Schedule
| Week | Primary | Secondary |
|------|---------|-----------|
| Mar 10-17 | budi@telemetryflow.id | maya@telemetryflow.id |
| Mar 17-24 | dewi@telemetryflow.id | james@telemetryflow.id |
| Mar 24-31 | li@telemetryflow.id | budi@telemetryflow.id |

### Notification Channel Health
| Channel | Status | Last Delivery | Failure Rate |
|---------|--------|---------------|-------------|
| Slack #alerts | ✅ OK | 2h ago | 0.0% |
| PagerDuty | ✅ OK | 4h ago | 0.0% |
| Email digest | ✅ OK | This morning | 0.0% |
| Jira (incidents) | ⚠️ Down | 8d ago | 100% |

### Policy Gaps
1. No escalation for Medium severity (>4h unresolved)
2. Jira channel down — incidents not being ticketed
3. No after-hours policy defined (weekends/holidays)

### Recommendations
1. Add Medium→High escalation after 4h unresolved
2. Fix Jira integration
3. Define weekend on-call rotation explicitly`,
  },
];

export const ACCOUNT_ORGANIZATION_CONVERSATION_TITLES: string[] = [
  "Organization overview and stats",
  "Team member management",
  "Security policy review",
  "Billing and subscription details",
  "Workspace assignment guide",
  "Organization audit log summary",
  "Integration status and config",
  "SSO setup and configuration",
  "Data residency configuration",
  "Alert and notification policy",
];

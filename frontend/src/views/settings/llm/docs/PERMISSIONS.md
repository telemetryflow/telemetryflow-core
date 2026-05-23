# LLM Feature Permissions

## Current Status

The AI Assistant / LLM feature **does NOT require any permissions** to access, similar to:

- IAM Management (all pages)
- Tenancy Management (all pages)
- Notification Channels
- Settings (main page)

## Routes Without Permissions

These routes are accessible to all authenticated users:

### IAM Module

- `/iam/overview` - IAM Overview
- `/iam/users` - Users Management
- `/iam/roles` - Roles Management
- `/iam/permissions` - Permissions Management
- `/iam/matrix` - Permission Matrix
- `/iam/assignments` - User Assignments

### Tenancy Module

- `/tenancy/regions` - Regions
- `/tenancy/organizations` - Organizations
- `/tenancy/workspaces` - Workspaces
- `/tenancy/tenants` - Tenants

### Settings Module

- `/settings` - Main Settings
- `/settings/notification-channels` - Notification Channels
- `/settings/ai-assistant` - **AI Assistant (LLM)** ← This feature

## Routes With Permissions

These routes require specific permissions:

### Audit & Monitoring

- `/audit` - Audit Logs
  - Required: `audit:read`

### Settings (Advanced)

- `/settings/api-keys` - API Keys Management
  - Required: `api-key:read`
- `/settings/retention` - Retention Policies
  - Required: `retention:read`
- `/settings/subscription` - Subscription Management
  - Required: `subscription:read`

## Permission Format

Permissions follow the format: `resource:action`

Examples:

- `audit:read` - Read audit logs
- `api-key:read` - Read API keys
- `retention:read` - Read retention policies
- `subscription:read` - Read subscription info

## Future Permissions (Optional)

If you want to add permission control to LLM feature in the future, you can add:

```typescript
// In routes.ts
{
  path: "settings/ai-assistant",
  name: "AIAssistant",
  component: () => import("@/views/settings/llm/index.vue"),
  meta: {
    title: "AI Assistant",
    icon: "carbon:machine-learning-model",
    requiredPermissions: ["llm:read"], // Add this
  },
}
```

Then create the permission in backend:

- `llm:read` - View LLM providers
- `llm:write` - Create/Update LLM providers
- `llm:delete` - Delete LLM providers
- `llm:admin` - Full LLM management

## Troubleshooting

If you see "Forbidden" error:

1. **Check if user is authenticated**
   - Try accessing other pages first
   - Check if login session is valid

2. **Check browser console (F12)**
   - Look for JavaScript errors
   - Check network tab for API errors

3. **Verify route configuration**
   - Route should NOT have `requiredPermissions` in meta
   - Route should be under authenticated layout

4. **Clear browser cache**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Clear localStorage and cookies

5. **Check dev server**
   - Restart dev server: `npm run dev`
   - Check for compilation errors

## Current Configuration

✅ AI Assistant route is configured WITHOUT permissions
✅ Accessible to all authenticated users
✅ Same access level as IAM and Tenancy modules

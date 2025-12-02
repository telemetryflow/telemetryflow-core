# IAM-Audit Module Integration

## Overview

This document identifies all integration points between the IAM and Audit modules for comprehensive security and compliance tracking.

## Integration Points

### 1. User Management (Authentication Events)

#### CreateUser Handler
**File**: `src/modules/iam/application/handlers/CreateUser.handler.ts`

```typescript
import { AuditService, AuditEventResult } from '@/modules/audit';

constructor(
  @Inject('IUserRepository') private readonly repository: IUserRepository,
  private readonly eventBus: EventBus,
  private readonly auditService: AuditService, // ADD
) {}

async execute(command: CreateUserCommand): Promise<string> {
  const user = User.create(/* ... */);
  await this.repository.save(user);
  
  // ADD: Audit log
  await this.auditService.logData('create_user', AuditEventResult.SUCCESS, {
    userId: command.createdBy, // Admin who created
    resource: 'users',
    metadata: {
      targetUserId: user.getId().getValue(),
      targetUserEmail: command.email,
    },
  });
  
  return user.getId().getValue();
}
```

#### UpdateUser Handler
**File**: `src/modules/iam/application/handlers/UpdateUser.handler.ts`

```typescript
await this.auditService.logData('update_user', AuditEventResult.SUCCESS, {
  userId: command.updatedBy,
  resource: `users/${command.userId}`,
  metadata: {
    changes: Object.keys(command).filter(k => k !== 'userId' && k !== 'updatedBy'),
  },
});
```

#### DeleteUser Handler
**File**: `src/modules/iam/application/handlers/DeleteUser.handler.ts`

```typescript
await this.auditService.logData('delete_user', AuditEventResult.SUCCESS, {
  userId: command.deletedBy,
  resource: `users/${command.userId}`,
});
```

#### ActivateUser Handler
**File**: `src/modules/iam/application/handlers/ActivateUser.handler.ts`

```typescript
await this.auditService.logAuth('activate_user', AuditEventResult.SUCCESS, {
  userId: command.userId,
  metadata: { activatedBy: command.activatedBy },
});
```

#### ChangePassword Handler
**File**: `src/modules/iam/application/handlers/ChangePassword.handler.ts`

```typescript
await this.auditService.logAuth('change_password', AuditEventResult.SUCCESS, {
  userId: command.userId,
});
```

### 2. Role Management (Authorization Events)

#### AssignRoleToUser Handler
**File**: `src/modules/iam/application/handlers/AssignRoleToUser.handler.ts`

```typescript
await this.auditService.logAuthz('assign_role', AuditEventResult.SUCCESS, {
  userId: command.assignedBy,
  resource: `users/${command.userId}/roles`,
  metadata: {
    targetUserId: command.userId,
    roleId: command.roleId,
  },
});
```

#### RevokeRoleFromUser Handler
**File**: `src/modules/iam/application/handlers/RevokeRoleFromUser.handler.ts`

```typescript
await this.auditService.logAuthz('revoke_role', AuditEventResult.SUCCESS, {
  userId: command.revokedBy,
  resource: `users/${command.userId}/roles`,
  metadata: {
    targetUserId: command.userId,
    roleId: command.roleId,
  },
});
```

#### CreateRole Handler
**File**: `src/modules/iam/application/handlers/CreateRole.handler.ts`

```typescript
await this.auditService.logData('create_role', AuditEventResult.SUCCESS, {
  userId: command.createdBy,
  resource: 'roles',
  metadata: {
    roleId: role.getId().getValue(),
    roleName: command.name,
    tier: command.tier,
  },
});
```

#### UpdateRole Handler
**File**: `src/modules/iam/application/handlers/UpdateRole.handler.ts`

```typescript
await this.auditService.logData('update_role', AuditEventResult.SUCCESS, {
  userId: command.updatedBy,
  resource: `roles/${command.roleId}`,
  metadata: { changes: ['name', 'description', 'permissions'] },
});
```

#### DeleteRole Handler
**File**: `src/modules/iam/application/handlers/DeleteRole.handler.ts`

```typescript
await this.auditService.logData('delete_role', AuditEventResult.SUCCESS, {
  userId: command.deletedBy,
  resource: `roles/${command.roleId}`,
});
```

### 3. Permission Management (Authorization Events)

#### AssignPermissionToUser Handler
**File**: `src/modules/iam/application/handlers/AssignPermissionToUser.handler.ts`

```typescript
await this.auditService.logAuthz('assign_permission', AuditEventResult.SUCCESS, {
  userId: command.assignedBy,
  resource: `users/${command.userId}/permissions`,
  metadata: {
    targetUserId: command.userId,
    permissionId: command.permissionId,
  },
});
```

#### RevokePermissionFromUser Handler
**File**: `src/modules/iam/application/handlers/RevokePermissionFromUser.handler.ts`

```typescript
await this.auditService.logAuthz('revoke_permission', AuditEventResult.SUCCESS, {
  userId: command.revokedBy,
  resource: `users/${command.userId}/permissions`,
  metadata: {
    targetUserId: command.userId,
    permissionId: command.permissionId,
  },
});
```

#### CreatePermission Handler
**File**: `src/modules/iam/application/handlers/CreatePermission.handler.ts`

```typescript
await this.auditService.logData('create_permission', AuditEventResult.SUCCESS, {
  userId: command.createdBy,
  resource: 'permissions',
  metadata: {
    permissionId: permission.getId().getValue(),
    permissionName: command.name,
  },
});
```

### 4. Organization Management (Data Events)

#### CreateOrganization Handler
**File**: `src/modules/iam/application/handlers/CreateOrganization.handler.ts`

```typescript
await this.auditService.logData('create_organization', AuditEventResult.SUCCESS, {
  userId: command.createdBy,
  organizationId: organization.getId().getValue(),
  resource: 'organizations',
  metadata: {
    organizationName: command.name,
    tenantId: command.tenantId,
  },
});
```

#### UpdateOrganization Handler
**File**: `src/modules/iam/application/handlers/UpdateOrganization.handler.ts`

```typescript
await this.auditService.logData('update_organization', AuditEventResult.SUCCESS, {
  userId: command.updatedBy,
  organizationId: command.organizationId,
  resource: `organizations/${command.organizationId}`,
});
```

#### DeleteOrganization Handler
**File**: `src/modules/iam/application/handlers/DeleteOrganization.handler.ts`

```typescript
await this.auditService.logData('delete_organization', AuditEventResult.SUCCESS, {
  userId: command.deletedBy,
  organizationId: command.organizationId,
  resource: `organizations/${command.organizationId}`,
});
```

### 5. Tenant Management (Data Events)

#### CreateTenant Handler
**File**: `src/modules/iam/application/handlers/CreateTenant.handler.ts`

```typescript
await this.auditService.logData('create_tenant', AuditEventResult.SUCCESS, {
  userId: command.createdBy,
  tenantId: tenant.getId().getValue(),
  resource: 'tenants',
  metadata: { tenantName: command.name },
});
```

#### UpdateTenant Handler
**File**: `src/modules/iam/application/handlers/UpdateTenant.handler.ts`

```typescript
await this.auditService.logData('update_tenant', AuditEventResult.SUCCESS, {
  userId: command.updatedBy,
  tenantId: command.tenantId,
  resource: `tenants/${command.tenantId}`,
});
```

#### DeleteTenant Handler
**File**: `src/modules/iam/application/handlers/DeleteTenant.handler.ts`

```typescript
await this.auditService.logData('delete_tenant', AuditEventResult.SUCCESS, {
  userId: command.deletedBy,
  tenantId: command.tenantId,
  resource: `tenants/${command.tenantId}`,
});
```

### 6. Workspace Management (Data Events)

#### CreateWorkspace Handler
**File**: `src/modules/iam/application/handlers/CreateWorkspace.handler.ts`

```typescript
await this.auditService.logData('create_workspace', AuditEventResult.SUCCESS, {
  userId: command.createdBy,
  organizationId: command.organizationId,
  resource: 'workspaces',
  metadata: {
    workspaceId: workspace.getId().getValue(),
    workspaceName: command.name,
  },
});
```

### 7. Group Management (Data Events)

#### AddUserToGroup Handler
**File**: `src/modules/iam/application/handlers/AddUserToGroup.handler.ts`

```typescript
await this.auditService.logData('add_user_to_group', AuditEventResult.SUCCESS, {
  userId: command.addedBy,
  resource: `groups/${command.groupId}/members`,
  metadata: {
    targetUserId: command.userId,
    groupId: command.groupId,
  },
});
```

#### RemoveUserFromGroup Handler
**File**: `src/modules/iam/application/handlers/RemoveUserFromGroup.handler.ts`

```typescript
await this.auditService.logData('remove_user_from_group', AuditEventResult.SUCCESS, {
  userId: command.removedBy,
  resource: `groups/${command.groupId}/members`,
  metadata: {
    targetUserId: command.userId,
    groupId: command.groupId,
  },
});
```

### 8. Controllers (API Access Events)

#### User Controller
**File**: `src/modules/iam/presentation/controllers/User.controller.ts`

Add audit logging for failed operations:

```typescript
@Post()
async create(@Body() dto: CreateUserDto, @Request() req) {
  try {
    const userId = await this.commandBus.execute(new CreateUserCommand(/* ... */));
    return { userId };
  } catch (error) {
    await this.auditService.logData('create_user', AuditEventResult.FAILURE, {
      userId: req.user?.id,
      resource: 'users',
      errorMessage: error.message,
      ipAddress: req.ip,
    });
    throw error;
  }
}
```

#### Role Controller
**File**: `src/modules/iam/presentation/controllers/Role.controller.ts`

```typescript
@Post(':userId/roles/:roleId')
async assignRole(@Param('userId') userId: string, @Param('roleId') roleId: string, @Request() req) {
  try {
    await this.commandBus.execute(new AssignRoleToUserCommand(userId, roleId));
  } catch (error) {
    await this.auditService.logAuthz('assign_role', AuditEventResult.FAILURE, {
      userId: req.user?.id,
      resource: `users/${userId}/roles`,
      errorMessage: error.message,
      ipAddress: req.ip,
    });
    throw error;
  }
}
```

### 9. Guards (Authorization Failures)

#### Role Guard
**File**: `src/modules/iam/presentation/guards/Role.guard.ts`

```typescript
async canActivate(context: ExecutionContext): Promise<boolean> {
  const request = context.switchToHttp().getRequest();
  const user = request.user;
  const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
  
  const hasRole = user.roles.some(role => requiredRoles.includes(role));
  
  if (!hasRole) {
    await this.auditService.logAuthz('access_denied', AuditEventResult.DENIED, {
      userId: user.id,
      resource: request.url,
      errorMessage: 'Insufficient role',
      ipAddress: request.ip,
      metadata: { requiredRoles, userRoles: user.roles },
    });
    return false;
  }
  
  return true;
}
```

## Implementation Checklist

### Phase 1: Critical Operations (High Priority)

- [ ] **User Management**
  - [ ] CreateUser - Success & Failure
  - [ ] DeleteUser - Success & Failure
  - [ ] ActivateUser - Success & Failure
  - [ ] ChangePassword - Success & Failure

- [ ] **Role Assignment**
  - [ ] AssignRoleToUser - Success & Failure
  - [ ] RevokeRoleFromUser - Success & Failure

- [ ] **Permission Assignment**
  - [ ] AssignPermissionToUser - Success & Failure
  - [ ] RevokePermissionFromUser - Success & Failure

### Phase 2: Administrative Operations (Medium Priority)

- [ ] **Role Management**
  - [ ] CreateRole - Success & Failure
  - [ ] UpdateRole - Success & Failure
  - [ ] DeleteRole - Success & Failure

- [ ] **Organization Management**
  - [ ] CreateOrganization - Success & Failure
  - [ ] UpdateOrganization - Success & Failure
  - [ ] DeleteOrganization - Success & Failure

- [ ] **Tenant Management**
  - [ ] CreateTenant - Success & Failure
  - [ ] UpdateTenant - Success & Failure
  - [ ] DeleteTenant - Success & Failure

### Phase 3: Supporting Operations (Low Priority)

- [ ] **Workspace Management**
  - [ ] CreateWorkspace - Success & Failure
  - [ ] UpdateWorkspace - Success & Failure
  - [ ] DeleteWorkspace - Success & Failure

- [ ] **Group Management**
  - [ ] CreateGroup - Success & Failure
  - [ ] AddUserToGroup - Success & Failure
  - [ ] RemoveUserFromGroup - Success & Failure

- [ ] **Permission Management**
  - [ ] CreatePermission - Success & Failure
  - [ ] UpdatePermission - Success & Failure
  - [ ] DeletePermission - Success & Failure

### Phase 4: Access Control (Critical)

- [ ] **Guards**
  - [ ] Role Guard - Access denied events
  - [ ] Permission Guard - Access denied events (if exists)

- [ ] **Controllers**
  - [ ] User Controller - Failed operations
  - [ ] Role Controller - Failed operations
  - [ ] Permission Controller - Failed operations

## Module Updates Required

### 1. Update IAM Module
**File**: `src/modules/iam/iam.module.ts`

```typescript
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([/* entities */]),
    AuditModule, // ADD
  ],
  // ...
})
export class IamModule {}
```

### 2. Update Command Handlers

Add `AuditService` to constructor of each handler:

```typescript
import { AuditService } from '@/modules/audit';

constructor(
  // ... existing dependencies
  private readonly auditService: AuditService,
) {}
```

### 3. Update Controllers

Add `AuditService` to constructor:

```typescript
import { AuditService } from '@/modules/audit';

constructor(
  private readonly commandBus: CommandBus,
  private readonly queryBus: QueryBus,
  private readonly auditService: AuditService, // ADD
) {}
```

### 4. Update Guards

Add `AuditService` to constructor:

```typescript
import { AuditService } from '@/modules/audit';

constructor(
  private readonly reflector: Reflector,
  private readonly auditService: AuditService, // ADD
) {}
```

## Audit Event Patterns

### Success Pattern
```typescript
await this.auditService.log{Type}('{action}', AuditEventResult.SUCCESS, {
  userId: command.userId,
  resource: 'resource_type',
  metadata: { /* relevant data */ },
});
```

### Failure Pattern
```typescript
try {
  // operation
  await this.auditService.log{Type}('{action}', AuditEventResult.SUCCESS, { /* ... */ });
} catch (error) {
  await this.auditService.log{Type}('{action}', AuditEventResult.FAILURE, {
    userId: command.userId,
    resource: 'resource_type',
    errorMessage: error.message,
  });
  throw error;
}
```

### Denied Pattern
```typescript
if (!hasPermission) {
  await this.auditService.logAuthz('{action}', AuditEventResult.DENIED, {
    userId: user.id,
    resource: request.url,
    errorMessage: 'Insufficient permissions',
    ipAddress: request.ip,
  });
  return false;
}
```

## Testing

### Unit Tests

Add audit service mock to each handler test:

```typescript
const mockAuditService = {
  log: jest.fn(),
  logAuth: jest.fn(),
  logAuthz: jest.fn(),
  logData: jest.fn(),
};

beforeEach(async () => {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      CreateUserHandler,
      { provide: 'IUserRepository', useValue: mockRepository },
      { provide: AuditService, useValue: mockAuditService },
    ],
  }).compile();
});

it('should log audit event on success', async () => {
  await handler.execute(command);
  expect(mockAuditService.logData).toHaveBeenCalledWith(
    'create_user',
    AuditEventResult.SUCCESS,
    expect.objectContaining({ userId: expect.any(String) }),
  );
});
```

### Integration Tests

Verify audit logs are created:

```typescript
it('should create audit log when user is created', async () => {
  const response = await request(app.getHttpServer())
    .post('/users')
    .send(createUserDto);

  expect(response.status).toBe(201);
  // Verify audit log exists (check logs or database)
});
```

## Summary

### Total Integration Points: 51

| Category | Count |
|----------|-------|
| **User Management** | 5 |
| **Role Management** | 7 |
| **Permission Management** | 6 |
| **Organization Management** | 3 |
| **Tenant Management** | 3 |
| **Workspace Management** | 3 |
| **Group Management** | 5 |
| **Region Management** | 3 |
| **Guards** | 2 |
| **Controllers (Failures)** | 14 |

### Event Type Distribution

- **AUTH Events**: 3 (ActivateUser, ChangePassword, Login)
- **AUTHZ Events**: 10 (Role/Permission assignments, Access denied)
- **DATA Events**: 38 (CRUD operations)
- **SYSTEM Events**: 0 (Future: startup, config changes)

### Priority Implementation Order

1. **Critical** (Phase 1): User management, Role/Permission assignments
2. **High** (Phase 2): Administrative operations (Role, Org, Tenant CRUD)
3. **Medium** (Phase 3): Supporting operations (Workspace, Group, Region)
4. **Critical** (Phase 4): Access control (Guards, Controller failures)

## Next Steps

1. Update `iam.module.ts` to import `AuditModule`
2. Start with Phase 1 (Critical Operations)
3. Add audit service to each handler constructor
4. Implement success and failure logging
5. Update guards for access denied events
6. Add unit tests for audit logging
7. Verify logs in development environment
8. Document any custom audit events needed

---

**Status**: Ready for implementation
**Estimated Effort**: 2-3 days for full integration
**Testing**: Required for each integration point

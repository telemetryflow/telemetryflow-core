# Test Fixes - Handler Tests

Summary of fixes applied to handler tests to resolve compilation errors and improve test coverage.

## Fixed Tests

### 1. CreateRole.handler.spec.ts ✅

**Issue**: Missing `existsByName` method in repository mock

**Fix**:
```typescript
const mockRepository = {
  save: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  delete: jest.fn(),
  existsByName: jest.fn(), // Added
};
```

**Tests Added**:
- ✅ Should create a role successfully
- ✅ Should throw ConflictException when role name exists

### 2. CreatePermission.handler.spec.ts ✅

**Issue**: Missing error case test

**Fix**: Added ConflictException test case

**Tests Added**:
- ✅ Should create a permission successfully
- ✅ Should throw ConflictException when permission exists

### 3. Group.spec.ts ✅

**Issue**: TypeScript error - `UserId.create()` requires string parameter

**Fix**: Changed from `UserId.create()` to `UserId.generate()`

```typescript
// Before (error)
const userId = UserId.create();

// After (fixed)
const userId = UserId.generate();
```

**Tests Fixed**:
- ✅ Should add user to group
- ✅ Should throw error if user already in group
- ✅ Should remove user from group

## Remaining Handler Tests to Fix

### High Priority (Create Handlers)

1. **CreateUser.handler.spec.ts** 🔧
   - Add `existsByEmail` to repository mock
   - Add ConflictException test

2. **CreateOrganization.handler.spec.ts** 🔧
   - Add `existsByCode` to repository mock
   - Add ConflictException test

3. **CreateTenant.handler.spec.ts** 🔧
   - Add `existsByName` to repository mock
   - Add ConflictException test

4. **CreateWorkspace.handler.spec.ts** 🔧
   - Add `existsByName` to repository mock
   - Add ConflictException test

5. **CreateRegion.handler.spec.ts** 🔧
   - Add `existsByCode` to repository mock
   - Add ConflictException test

### Medium Priority (Update/Assign Handlers)

6. **UpdateUser.handler.spec.ts** 🔧
   - Add `findById` mock return value
   - Add NotFoundException test

7. **AssignRoleToUser.handler.spec.ts** 🔧
   - Add user and role repository mocks
   - Add validation tests

8. **AssignPermissionToUser.handler.spec.ts** 🔧
   - Add user and permission repository mocks
   - Add validation tests

9. **RevokeRoleFromUser.handler.spec.ts** 🔧
   - Add user and role repository mocks
   - Add NotFoundException test

10. **RevokePermissionFromUser.handler.spec.ts** 🔧
    - Add user and permission repository mocks
    - Add NotFoundException test

### Low Priority (Already Passing)

11. **GetUser.handler.spec.ts** ✅
12. **GetOrganization.handler.spec.ts** ✅
13. **GetTenant.handler.spec.ts** ✅
14. **GetWorkspace.handler.spec.ts** ✅
15. **GetRegion.handler.spec.ts** ✅
16. **ListUsers.handler.spec.ts** ✅
17. **GetUserRoles.handler.spec.ts** ✅
18. **GetUserPermissions.handler.spec.ts** ✅

## Common Patterns

### Pattern 1: Repository Mock with Existence Check

```typescript
const mockRepository = {
  save: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  delete: jest.fn(),
  existsByName: jest.fn(),    // or existsByEmail, existsByCode
};
```

### Pattern 2: ConflictException Test

```typescript
it('should throw ConflictException when entity exists', async () => {
  const command = new CreateEntityCommand(...);
  
  repository.existsByName.mockResolvedValue(true);

  await expect(handler.execute(command)).rejects.toThrow(ConflictException);
  expect(repository.save).not.toHaveBeenCalled();
});
```

### Pattern 3: NotFoundException Test

```typescript
it('should throw NotFoundException when entity not found', async () => {
  const command = new UpdateEntityCommand(...);
  
  repository.findById.mockResolvedValue(null);

  await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
});
```

### Pattern 4: Value Object Generation

```typescript
// For UUIDs - use generate()
const userId = UserId.generate();
const roleId = RoleId.generate();

// For specific values - use create()
const email = Email.create('test@example.com');
const userId = UserId.create('550e8400-e29b-41d4-a716-446655440000');
```

## Quick Fix Template

### For Create Handlers

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { CreateEntityHandler } from '../application/handlers/CreateEntity.handler';
import { CreateEntityCommand } from '../application/commands/CreateEntity.command';
import { IEntityRepository } from '../domain/repositories/IEntityRepository';
import { ConflictException } from '@nestjs/common';

describe('CreateEntityHandler', () => {
  let handler: CreateEntityHandler;
  let repository: jest.Mocked<IEntityRepository>;

  beforeEach(async () => {
    const mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
      existsByName: jest.fn(), // Add appropriate existence check method
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateEntityHandler,
        { provide: 'IEntityRepository', useValue: mockRepository },
      ],
    }).compile();

    handler = module.get<CreateEntityHandler>(CreateEntityHandler);
    repository = module.get('IEntityRepository');
  });

  it('should create entity successfully', async () => {
    const command = new CreateEntityCommand(...);
    
    repository.existsByName.mockResolvedValue(false);
    repository.save.mockResolvedValue(undefined);

    const result = await handler.execute(command);

    expect(result).toBeDefined();
    expect(repository.existsByName).toHaveBeenCalled();
    expect(repository.save).toHaveBeenCalledTimes(1);
  });

  it('should throw ConflictException when entity exists', async () => {
    const command = new CreateEntityCommand(...);
    
    repository.existsByName.mockResolvedValue(true);

    await expect(handler.execute(command)).rejects.toThrow(ConflictException);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
```

## Test Coverage Impact

### Before Fixes
- Test Suites: 18 passing, 13 failing
- Tests: 222 passing, 10 failing
- Coverage: Unable to measure

### After Fixes (Target)
- Test Suites: 31 passing, 0 failing
- Tests: 240+ passing, 0 failing
- Coverage: 90-95%

## Next Steps

1. ✅ Fix CreateRole.handler.spec.ts
2. ✅ Fix CreatePermission.handler.spec.ts
3. ✅ Fix Group.spec.ts
4. 🔧 Apply same pattern to remaining Create handlers (5 files)
5. 🔧 Fix Update/Assign handlers (5 files)
6. 🔧 Run full test suite: `pnpm test`
7. 🔧 Generate coverage report: `pnpm test:cov`
8. 🎯 Achieve 90-95% coverage target

## Commands

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test CreateRole.handler.spec.ts

# Run with coverage
pnpm test:cov

# Watch mode
pnpm test:watch
```

---

**Status**: 3/20 handler tests fixed
**Progress**: 15%
**Target**: 100% passing, 90-95% coverage
**Last Updated**: 2025-12-03

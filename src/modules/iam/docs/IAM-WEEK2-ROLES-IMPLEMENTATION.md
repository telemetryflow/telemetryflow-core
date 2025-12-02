# Week 2: Roles Module Implementation

## Overview
Implement complete Roles module following DDD architecture with 5 API endpoints.

## Database Schema (Existing)

### Table: `roles`
```sql
CREATE TABLE public.roles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL PRIMARY KEY,
    name character varying NOT NULL UNIQUE,
    description character varying,
    tenant_id uuid REFERENCES tenants(tenant_id),
    "isSystem" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "deletedAt" timestamp without time zone  -- Soft deletion support
);
```

### Table: `role_permissions` (Junction)
```sql
CREATE TABLE public.role_permissions (
    role_id uuid NOT NULL REFERENCES roles(id) ON UPDATE CASCADE ON DELETE CASCADE,
    permission_id uuid NOT NULL REFERENCES permissions(id),
    PRIMARY KEY (role_id, permission_id)
);
```

## Implementation Checklist

### 1. Domain Layer

#### 1.1 Aggregates
- [ ] **Role.ts** - Role aggregate root
  ```typescript
  export class Role extends AggregateRoot {
    private constructor(
      private readonly id: RoleId,
      private name: string,
      private description: string,
      private permissions: PermissionId[],
      private tenantId: TenantId | null,
      private isSystem: boolean,
    ) {}

    static create(props): Role
    addPermission(permissionId: PermissionId): void
    removePermission(permissionId: PermissionId): void
    updateDetails(name: string, description: string): void
    hasPermission(permissionId: PermissionId): boolean
  }
  ```

#### 1.2 Value Objects
- [x] **RoleId.ts** - Already created ✅
- [ ] **PermissionId.ts** - Permission identifier
  ```typescript
  export class PermissionId extends ValueObject<{ value: string }> {
    static create(value: string): PermissionId
    getValue(): string
  }
  ```

#### 1.3 Domain Events
- [ ] **RoleCreatedEvent.ts**
- [ ] **RoleUpdatedEvent.ts**
- [ ] **RoleDeletedEvent.ts**
- [ ] **PermissionAssignedEvent.ts**
- [ ] **PermissionRemovedEvent.ts**

#### 1.4 Repository Interface
- [ ] **IRoleRepository.ts**
  ```typescript
  export interface IRoleRepository {
    save(role: Role): Promise<void>;
    findById(id: RoleId): Promise<Role | null>;
    findByName(name: string): Promise<Role | null>;
    findAll(filters?: RoleFilters): Promise<Role[]>;
    delete(id: RoleId): Promise<void>;
    existsByName(name: string): Promise<boolean>;
  }
  ```

### 2. Application Layer

#### 2.1 Commands
- [ ] **CreateRoleCommand.ts**
  ```typescript
  export class CreateRoleCommand {
    constructor(
      public readonly name: string,
      public readonly description: string,
      public readonly permissionIds: string[],
      public readonly tenantId: string | null,
    ) {}
  }
  ```

- [ ] **UpdateRoleCommand.ts**
  ```typescript
  export class UpdateRoleCommand {
    constructor(
      public readonly id: string,
      public readonly name?: string,
      public readonly description?: string,
    ) {}
  }
  ```

- [ ] **DeleteRoleCommand.ts**
  ```typescript
  export class DeleteRoleCommand {
    constructor(public readonly id: string) {}
  }
  ```

- [ ] **AssignPermissionCommand.ts**
  ```typescript
  export class AssignPermissionCommand {
    constructor(
      public readonly roleId: string,
      public readonly permissionId: string,
    ) {}
  }
  ```

- [ ] **RemovePermissionCommand.ts**
  ```typescript
  export class RemovePermissionCommand {
    constructor(
      public readonly roleId: string,
      public readonly permissionId: string,
    ) {}
  }
  ```

#### 2.2 Queries
- [ ] **GetRoleQuery.ts**
  ```typescript
  export class GetRoleQuery {
    constructor(public readonly id: string) {}
  }
  ```

- [ ] **ListRolesQuery.ts**
  ```typescript
  export class ListRolesQuery {
    constructor(
      public readonly tenantId?: string,
      public readonly includeSystem?: boolean,
      public readonly page?: number,
      public readonly pageSize?: number,
    ) {}
  }
  ```

#### 2.3 Handlers
- [ ] **CreateRoleHandler.ts** - Implements ICommandHandler
- [ ] **UpdateRoleHandler.ts** - Implements ICommandHandler
- [ ] **DeleteRoleHandler.ts** - Implements ICommandHandler
- [ ] **AssignPermissionHandler.ts** - Implements ICommandHandler
- [ ] **RemovePermissionHandler.ts** - Implements ICommandHandler
- [ ] **GetRoleHandler.ts** - Implements IQueryHandler
- [ ] **ListRolesHandler.ts** - Implements IQueryHandler

### 3. Infrastructure Layer

#### 3.1 Entities
- [ ] **RoleEntity.ts** - Map to existing 'roles' table
  ```typescript
  @Entity('roles')  // ← Map to existing table
  export class RoleEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string;

    @Column({ nullable: true })
    description: string;

    @Column({ name: 'tenant_id', nullable: true })
    tenantId: string;

    @Column({ name: 'isSystem', default: false })
    isSystem: boolean;

    @CreateDateColumn({ name: 'createdAt' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updatedAt' })
    updatedAt: Date;

    @DeleteDateColumn({ name: 'deletedAt' })
    deletedAt: Date;

    @ManyToMany(() => PermissionEntity)
    @JoinTable({
      name: 'role_permissions',
      joinColumn: { name: 'role_id', referencedColumnName: 'id' },
      inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
    })
    permissions: PermissionEntity[];
  }
  ```

- [ ] **RolePermissionEntity.ts** - Junction table entity (if needed)

#### 3.2 Repositories
- [ ] **RoleRepository.ts** - Implements IRoleRepository
  ```typescript
  @Injectable()
  export class RoleRepository implements IRoleRepository {
    constructor(
      @InjectRepository(RoleEntity)
      private readonly roleRepo: Repository<RoleEntity>,
    ) {}

    async save(role: Role): Promise<void> {
      const entity = this.toEntity(role);
      await this.roleRepo.save(entity);
    }

    async findById(id: RoleId): Promise<Role | null> {
      const entity = await this.roleRepo.findOne({
        where: { id: id.getValue() },
        relations: ['permissions'],
      });
      return entity ? this.toDomain(entity) : null;
    }

    // ... other methods
  }
  ```

#### 3.3 Mappers
- [ ] **RoleMapper.ts** - Convert between Domain and Entity
  ```typescript
  export class RoleMapper {
    static toDomain(entity: RoleEntity): Role {
      // Map entity to domain aggregate
    }

    static toEntity(domain: Role): RoleEntity {
      // Map domain aggregate to entity
    }

    static toResponse(domain: Role): RoleResponseDto {
      // Map domain to DTO
    }
  }
  ```

### 4. Presentation Layer

#### 4.1 Controller
- [ ] **RoleController.ts** - 5 endpoints
  ```typescript
  @Controller('api/v2/iam/roles')
  @ApiTags('IAM - Roles')
  export class RoleController {
    constructor(
      private readonly commandBus: CommandBus,
      private readonly queryBus: QueryBus,
    ) {}

    @Post()
    @ApiOperation({ summary: 'Create role' })
    async create(@Body() dto: CreateRoleDto): Promise<RoleResponseDto> {
      const command = new CreateRoleCommand(
        dto.name,
        dto.description,
        dto.permissionIds,
        dto.tenantId,
      );
      return await this.commandBus.execute(command);
    }

    @Get()
    @ApiOperation({ summary: 'List roles' })
    async list(@Query() query: ListRolesDto): Promise<RoleResponseDto[]> {
      const queryObj = new ListRolesQuery(
        query.tenantId,
        query.includeSystem,
        query.page,
        query.pageSize,
      );
      return await this.queryBus.execute(queryObj);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get role by ID' })
    async getById(@Param('id') id: string): Promise<RoleResponseDto> {
      const query = new GetRoleQuery(id);
      return await this.queryBus.execute(query);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update role' })
    async update(
      @Param('id') id: string,
      @Body() dto: UpdateRoleDto,
    ): Promise<RoleResponseDto> {
      const command = new UpdateRoleCommand(id, dto.name, dto.description);
      return await this.commandBus.execute(command);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete role' })
    async delete(@Param('id') id: string): Promise<void> {
      const command = new DeleteRoleCommand(id);
      await this.commandBus.execute(command);
    }

    @Post(':id/permissions/:permissionId')
    @ApiOperation({ summary: 'Assign permission to role' })
    async assignPermission(
      @Param('id') roleId: string,
      @Param('permissionId') permissionId: string,
    ): Promise<void> {
      const command = new AssignPermissionCommand(roleId, permissionId);
      await this.commandBus.execute(command);
    }

    @Delete(':id/permissions/:permissionId')
    @ApiOperation({ summary: 'Remove permission from role' })
    async removePermission(
      @Param('id') roleId: string,
      @Param('permissionId') permissionId: string,
    ): Promise<void> {
      const command = new RemovePermissionCommand(roleId, permissionId);
      await this.commandBus.execute(command);
    }
  }
  ```

#### 4.2 DTOs
- [ ] **CreateRoleDto.ts**
  ```typescript
  export class CreateRoleDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({ example: 'Developer' })
    name: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: 'Developer role with read/write access' })
    description?: string;

    @IsArray()
    @IsUUID('4', { each: true })
    @ApiProperty({ example: ['uuid1', 'uuid2'] })
    permissionIds: string[];

    @IsUUID('4')
    @IsOptional()
    @ApiProperty({ example: 'tenant-uuid' })
    tenantId?: string;
  }
  ```

- [ ] **UpdateRoleDto.ts**
- [ ] **RoleResponseDto.ts**
- [ ] **ListRolesDto.ts**

### 5. Tests

#### 5.1 Unit Tests
- [ ] **Role.spec.ts** - Test aggregate logic
- [ ] **CreateRoleHandler.spec.ts** - Test command handler
- [ ] **GetRoleHandler.spec.ts** - Test query handler
- [ ] **RoleRepository.spec.ts** - Test repository

#### 5.2 Integration Tests
- [ ] **RoleController.integration.spec.ts** - Test API endpoints

#### 5.3 E2E Tests
- [ ] **roles.e2e-spec.ts** - Test complete flow

### 6. Documentation
- [ ] **API.md** - Document all 5 endpoints
- [ ] **openapi.yaml** - OpenAPI specification

## API Endpoints

### 1. Create Role
```http
POST /api/v2/iam/roles
Content-Type: application/json

{
  "name": "Developer",
  "description": "Developer role with read/write access",
  "permissionIds": ["perm-uuid-1", "perm-uuid-2"],
  "tenantId": "tenant-uuid"
}

Response: 201 Created
{
  "id": "role-uuid",
  "name": "Developer",
  "description": "Developer role with read/write access",
  "permissions": [...],
  "tenantId": "tenant-uuid",
  "isSystem": false,
  "createdAt": "2025-11-15T10:00:00Z"
}
```

### 2. List Roles
```http
GET /api/v2/iam/roles?tenantId=tenant-uuid&includeSystem=true&page=1&pageSize=20

Response: 200 OK
[
  {
    "id": "role-uuid",
    "name": "Developer",
    "description": "Developer role",
    "permissions": [...],
    "tenantId": "tenant-uuid",
    "isSystem": false
  }
]
```

### 3. Get Role
```http
GET /api/v2/iam/roles/:id

Response: 200 OK
{
  "id": "role-uuid",
  "name": "Developer",
  "description": "Developer role",
  "permissions": [...],
  "tenantId": "tenant-uuid",
  "isSystem": false
}
```

### 4. Update Role
```http
PATCH /api/v2/iam/roles/:id
Content-Type: application/json

{
  "name": "Senior Developer",
  "description": "Updated description"
}

Response: 200 OK
{
  "id": "role-uuid",
  "name": "Senior Developer",
  "description": "Updated description",
  ...
}
```

### 5. Delete Role
```http
DELETE /api/v2/iam/roles/:id

Response: 204 No Content
```

### 6. Assign Permission
```http
POST /api/v2/iam/roles/:id/permissions/:permissionId

Response: 204 No Content
```

### 7. Remove Permission
```http
DELETE /api/v2/iam/roles/:id/permissions/:permissionId

Response: 204 No Content
```

## Implementation Order

1. **Day 1-2**: Domain Layer
   - Create Role aggregate
   - Create value objects (PermissionId)
   - Create domain events
   - Create repository interface

2. **Day 3-4**: Application Layer
   - Create all commands
   - Create all queries
   - Implement all handlers

3. **Day 5-6**: Infrastructure Layer
   - Create RoleEntity (map to existing table)
   - Implement RoleRepository
   - Create RoleMapper

4. **Day 7**: Presentation Layer
   - Create RoleController
   - Create all DTOs
   - Add validation

5. **Day 8-10**: Testing
   - Write unit tests
   - Write integration tests
   - Write E2E tests

6. **Day 11-12**: Documentation & Review
   - Write API documentation
   - Create OpenAPI spec
   - Code review
   - Performance testing

## Success Criteria

- [ ] All 5 API endpoints working
- [ ] 100% test coverage
- [ ] API documentation complete
- [ ] Performance < 100ms response time
- [ ] Security validation passed
- [ ] Code review approved

## Notes

- **No Migration Needed**: 'roles' and 'role_permissions' tables already exist
- **Soft Deletion**: Use deletedAt column for soft deletion
- **Multi-Tenancy**: Support tenant-specific and system roles
- **RBAC**: Roles can have multiple permissions
- **Event-Driven**: Publish domain events for cross-module communication

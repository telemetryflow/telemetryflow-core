import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuditModule } from "../audit/audit.module";

import { UserEntity } from "./infrastructure/persistence/entities/User.entity";
import { RoleEntity } from "./infrastructure/persistence/entities/RoleEntity";
import { TenantEntity } from "./infrastructure/persistence/entities/Tenant.entity";
import { UserRoleEntity } from "./infrastructure/persistence/entities/UserRole.entity";
import { PermissionEntity } from "./infrastructure/persistence/entities/PermissionEntity";
import { OrganizationEntity } from "./infrastructure/persistence/entities/Organization.entity";
import { WorkspaceEntity } from "./infrastructure/persistence/entities/Workspace.entity";
import { RegionEntity } from "./infrastructure/persistence/entities/RegionEntity";
import { GroupEntity } from "./infrastructure/persistence/entities/GroupEntity";
import { UserPermissionEntity } from "./infrastructure/persistence/entities/UserPermission.entity";
import { UserRepository } from "./infrastructure/persistence/UserRepository";
import { UserRoleRepository } from "./infrastructure/persistence/UserRoleRepository";
import { RoleRepository } from "./infrastructure/persistence/RoleRepository";
import { PermissionRepository } from "./infrastructure/persistence/PermissionRepository";
import { OrganizationRepository } from "./infrastructure/persistence/OrganizationRepository";
import { WorkspaceRepository } from "./infrastructure/persistence/WorkspaceRepository";
import { RegionRepository } from "./infrastructure/persistence/RegionRepository";
import { TenantRepository } from "./infrastructure/persistence/TenantRepository";
import { GroupRepository } from "./infrastructure/persistence/GroupRepository";
import { UserPermissionRepository } from "./infrastructure/persistence/UserPermissionRepository";
import { CreateUserHandler } from "./application/handlers/CreateUser.handler";
import { UpdateUserHandler } from "./application/handlers/UpdateUser.handler";
import { DeleteUserHandler } from "./application/handlers/DeleteUser.handler";
import { ActivateUserHandler } from "./application/handlers/ActivateUser.handler";
import { ChangePasswordHandler } from "./application/handlers/ChangePassword.handler";
import { GetUserHandler } from "./application/handlers/GetUser.handler";
import { ListUsersHandler } from "./application/handlers/ListUsers.handler";
import { GetOrganizationHandler } from "./application/handlers/GetOrganization.handler";
import { ListOrganizationsHandler } from "./application/handlers/ListOrganizations.handler";
import { GetRegionHandler } from "./application/handlers/GetRegion.handler";
import { ListRegionsHandler } from "./application/handlers/ListRegions.handler";
import { GetRoleHandler } from "./application/handlers/GetRole.handler";
import { ListRolesHandler } from "./application/handlers/ListRoles.handler";
import { GetPermissionHandler } from "./application/handlers/GetPermission.handler";
import { ListPermissionsHandler } from "./application/handlers/ListPermissions.handler";
import { GetTenantHandler } from "./application/handlers/GetTenant.handler";
import { ListTenantsHandler } from "./application/handlers/ListTenants.handler";
import { GetWorkspaceHandler } from "./application/handlers/GetWorkspace.handler";
import { ListWorkspacesHandler } from "./application/handlers/ListWorkspaces.handler";
import { GetGroupHandler } from "./application/handlers/GetGroup.handler";
import { ListGroupsHandler } from "./application/handlers/ListGroups.handler";
import { GetUserRolesHandler } from "./application/handlers/GetUserRoles.handler";
import { GetUserPermissionsHandler } from "./application/handlers/GetUserPermissions.handler";
import { GetRoleUsersHandler } from "./application/handlers/GetRoleUsers.handler";
import { UserController } from "./presentation/controllers/User.controller";
import { RoleController } from "./presentation/controllers/Role.controller";
import { TenantController } from "./presentation/controllers/Tenant.controller";
import { OrganizationController } from "./presentation/controllers/Organization.controller";
import { PermissionController } from "./presentation/controllers/Permission.controller";
import { WorkspaceController } from "./presentation/controllers/Workspace.controller";
import { GroupController } from "./presentation/controllers/Group.controller";
import { RegionController } from "./presentation/controllers/Region.controller";
import { AuditLogController } from "./presentation/controllers/AuditLog.controller";
import { IAMEventProcessor } from "./infrastructure/messaging/IAMEventProcessor";

const CommandHandlers = [
  CreateUserHandler,
  UpdateUserHandler,
  DeleteUserHandler,
  ActivateUserHandler,
  ChangePasswordHandler,
];

const QueryHandlers = [
  GetUserHandler,
  ListUsersHandler,
  GetOrganizationHandler,
  ListOrganizationsHandler,
  GetRegionHandler,
  ListRegionsHandler,
  GetRoleHandler,
  ListRolesHandler,
  GetPermissionHandler,
  ListPermissionsHandler,
  GetTenantHandler,
  ListTenantsHandler,
  GetWorkspaceHandler,
  ListWorkspacesHandler,
  GetGroupHandler,
  ListGroupsHandler,
  GetUserRolesHandler,
  GetUserPermissionsHandler,
  GetRoleUsersHandler,
];

const EventHandlers = [];

@Module({
  imports: [
    CqrsModule,
    AuditModule,
    TypeOrmModule.forFeature([
      UserEntity,
      RoleEntity,
      TenantEntity,
      UserRoleEntity,
      PermissionEntity,
      OrganizationEntity,
      WorkspaceEntity,
      RegionEntity,
      GroupEntity,
      UserPermissionEntity,
    ]),
  ],
  controllers: [
    UserController,
    RoleController,
    PermissionController,
    TenantController,
    OrganizationController,
    WorkspaceController,
    GroupController,
    RegionController,
    AuditLogController,
  ],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,
    { provide: "IUserRepository", useClass: UserRepository },
    { provide: "IUserRoleRepository", useClass: UserRoleRepository },
    { provide: "IRoleRepository", useClass: RoleRepository },
    { provide: "IPermissionRepository", useClass: PermissionRepository },
    { provide: "IOrganizationRepository", useClass: OrganizationRepository },
    { provide: "IWorkspaceRepository", useClass: WorkspaceRepository },
    { provide: "IRegionRepository", useClass: RegionRepository },
    { provide: "ITenantRepository", useClass: TenantRepository },
    { provide: "IGroupRepository", useClass: GroupRepository },
    {
      provide: "IUserPermissionRepository",
      useClass: UserPermissionRepository,
    },
    IAMEventProcessor,
  ],
  exports: [
    "IUserRepository",
    "IUserRoleRepository",
    "IRoleRepository",
    "IPermissionRepository",
    "IOrganizationRepository",
    "IWorkspaceRepository",
    "IRegionRepository",
    "ITenantRepository",
    "IGroupRepository",
    "IUserPermissionRepository",
  ],
})
export class IAMModule {}

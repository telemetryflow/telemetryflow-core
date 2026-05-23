import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { TypeOrmModule } from "@nestjs/typeorm";

import { RegionEntity } from "./infrastructure/persistence/entities/Region.entity";
import { OrganizationEntity } from "./infrastructure/persistence/entities/Organization.entity";
import { WorkspaceEntity } from "./infrastructure/persistence/entities/Workspace.entity";
import { TenantEntity } from "./infrastructure/persistence/entities/Tenant.entity";

import { RegionRepository } from "./infrastructure/persistence/repositories/RegionRepository";
import { OrganizationRepository } from "./infrastructure/persistence/repositories/OrganizationRepository";
import { WorkspaceRepository } from "./infrastructure/persistence/repositories/WorkspaceRepository";
import { TenantRepository } from "./infrastructure/persistence/repositories/TenantRepository";

import { RegionsController } from "./presentation/controllers/Regions.controller";
import { OrganizationsController } from "./presentation/controllers/Organizations.controller";
import { WorkspacesController } from "./presentation/controllers/Workspaces.controller";
import { TenantsController } from "./presentation/controllers/Tenants.controller";

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([
      RegionEntity,
      OrganizationEntity,
      WorkspaceEntity,
      TenantEntity,
    ]),
  ],
  controllers: [
    RegionsController,
    OrganizationsController,
    WorkspacesController,
    TenantsController,
  ],
  providers: [
    { provide: "ITenancyRegionRepository", useClass: RegionRepository },
    {
      provide: "ITenancyOrganizationRepository",
      useClass: OrganizationRepository,
    },
    { provide: "ITenancyWorkspaceRepository", useClass: WorkspaceRepository },
    { provide: "ITenancyTenantRepository", useClass: TenantRepository },
  ],
  exports: [
    "ITenancyRegionRepository",
    "ITenancyOrganizationRepository",
    "ITenancyWorkspaceRepository",
    "ITenancyTenantRepository",
  ],
})
export class TenancyModule {}

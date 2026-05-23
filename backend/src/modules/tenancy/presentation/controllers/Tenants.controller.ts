import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { Inject } from "@nestjs/common";
import { JwtAuthGuard } from "@/modules/auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/modules/auth/guards/permissions.guard";
import { RequirePermissions } from "@/modules/auth/decorators/permissions.decorator";
import { ITenantRepository } from "../../domain/repositories/ITenantRepository";
import { Tenant } from "../../domain/aggregates/Tenant";
import { TenantId } from "../../domain/value-objects/TenantId";
import { WorkspaceId } from "../../domain/value-objects/WorkspaceId";
import {
  CreateTenantDto,
  UpdateTenantDto,
  TenantResponseDto,
} from "../dto/Tenant.dto";

@ApiTags("tenancy-tenants")
@ApiBearerAuth()
@Controller("tenancy/tenants")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TenantsController {
  constructor(
    @Inject("ITenancyTenantRepository")
    private readonly tenantRepository: ITenantRepository,
  ) {}

  @Get()
  @RequirePermissions("tenants:read")
  @ApiOperation({
    summary: "List tenants",
    description: "Get all tenants, optionally filtered by workspace",
  })
  @ApiQuery({
    name: "workspaceId",
    required: false,
    description: "Filter by workspace ID",
  })
  @ApiResponse({
    status: 200,
    description: "List of tenants",
    type: [TenantResponseDto],
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async list(
    @Query("workspaceId") workspaceId?: string,
  ): Promise<TenantResponseDto[]> {
    const tenants = await this.tenantRepository.findAll(
      workspaceId ? WorkspaceId.create(workspaceId) : undefined,
    );
    return tenants.map((tenant) => this.toResponse(tenant));
  }

  @Get(":id")
  @RequirePermissions("tenants:read")
  @ApiOperation({
    summary: "Get tenant by ID",
    description: "Get a specific tenant by its ID",
  })
  @ApiParam({ name: "id", description: "Tenant UUID", type: "string" })
  @ApiResponse({
    status: 200,
    description: "Tenant details",
    type: TenantResponseDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Tenant not found" })
  async getById(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<TenantResponseDto> {
    const tenant = await this.tenantRepository.findById(TenantId.create(id));
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
    return this.toResponse(tenant);
  }

  @Post()
  @RequirePermissions("tenants:create")
  @ApiOperation({
    summary: "Create tenant",
    description: "Create a new tenant within a workspace",
  })
  @ApiBody({ type: CreateTenantDto })
  @ApiResponse({
    status: 201,
    description: "Tenant created successfully",
    type: TenantResponseDto,
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 409, description: "Tenant code already exists" })
  async create(@Body() dto: CreateTenantDto): Promise<TenantResponseDto> {
    const existing = await this.tenantRepository.findByCode(dto.code);
    if (existing) {
      throw new ConflictException(
        `Tenant with code '${dto.code}' already exists`,
      );
    }

    const tenant = Tenant.create(
      dto.name,
      dto.code,
      WorkspaceId.create(dto.workspaceId),
      dto.description,
    );
    await this.tenantRepository.save(tenant);
    return this.toResponse(tenant);
  }

  @Patch(":id")
  @RequirePermissions("tenants:update")
  @ApiOperation({
    summary: "Update tenant",
    description: "Update tenant details",
  })
  @ApiParam({ name: "id", description: "Tenant UUID", type: "string" })
  @ApiBody({ type: UpdateTenantDto })
  @ApiResponse({
    status: 200,
    description: "Tenant updated successfully",
    type: TenantResponseDto,
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Tenant not found" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenantDto,
  ): Promise<TenantResponseDto> {
    const tenant = await this.tenantRepository.findById(TenantId.create(id));
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    tenant.updateDetails(dto.name, dto.description);
    await this.tenantRepository.save(tenant);
    return this.toResponse(tenant);
  }

  @Delete(":id")
  @RequirePermissions("tenants:delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete tenant",
    description: "Soft delete a tenant",
  })
  @ApiParam({ name: "id", description: "Tenant UUID", type: "string" })
  @ApiResponse({ status: 204, description: "Tenant deleted successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Tenant not found" })
  async delete(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    const tenant = await this.tenantRepository.findById(TenantId.create(id));
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
    await this.tenantRepository.delete(TenantId.create(id));
  }

  @Patch(":id/activate")
  @RequirePermissions("tenants:update")
  @ApiOperation({
    summary: "Activate tenant",
    description: "Activate a deactivated tenant",
  })
  @ApiParam({ name: "id", description: "Tenant UUID", type: "string" })
  @ApiResponse({
    status: 200,
    description: "Tenant activated successfully",
    type: TenantResponseDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Tenant not found" })
  async activate(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<TenantResponseDto> {
    const tenant = await this.tenantRepository.findById(TenantId.create(id));
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    tenant.activate();
    await this.tenantRepository.save(tenant);
    return this.toResponse(tenant);
  }

  @Patch(":id/deactivate")
  @RequirePermissions("tenants:update")
  @ApiOperation({
    summary: "Deactivate tenant",
    description: "Deactivate an active tenant",
  })
  @ApiParam({ name: "id", description: "Tenant UUID", type: "string" })
  @ApiResponse({
    status: 200,
    description: "Tenant deactivated successfully",
    type: TenantResponseDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Tenant not found" })
  async deactivate(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<TenantResponseDto> {
    const tenant = await this.tenantRepository.findById(TenantId.create(id));
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    tenant.deactivate();
    await this.tenantRepository.save(tenant);
    return this.toResponse(tenant);
  }

  private toResponse(tenant: Tenant): TenantResponseDto {
    const response = new TenantResponseDto();
    response.tenantId = tenant.getId().getValue();
    response.name = tenant.getName();
    response.code = tenant.getCode();
    response.description = tenant.getDescription();
    response.workspaceId = tenant.getWorkspaceId().getValue();
    response.isActive = tenant.getIsActive();
    response.createdAt = tenant.getCreatedAt();
    response.updatedAt = tenant.getUpdatedAt();
    return response;
  }
}

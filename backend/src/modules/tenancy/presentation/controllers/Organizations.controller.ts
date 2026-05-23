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
import { IOrganizationRepository } from "../../domain/repositories/IOrganizationRepository";
import { Organization } from "../../domain/aggregates/Organization";
import { OrganizationId } from "../../domain/value-objects/OrganizationId";
import { RegionId } from "../../domain/value-objects/RegionId";
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  TenancyOrganizationResponseDto,
} from "../dto/Organization.dto";

@ApiTags("tenancy-organizations")
@ApiBearerAuth()
@Controller("tenancy/organizations")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OrganizationsController {
  constructor(
    @Inject("ITenancyOrganizationRepository")
    private readonly organizationRepository: IOrganizationRepository,
  ) {}

  @Get()
  @RequirePermissions("organizations:read")
  @ApiOperation({
    summary: "List organizations",
    description: "Get all organizations, optionally filtered by region",
  })
  @ApiQuery({
    name: "regionId",
    required: false,
    description: "Filter by region ID",
  })
  @ApiResponse({
    status: 200,
    description: "List of organizations",
    type: [TenancyOrganizationResponseDto],
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async list(
    @Query("regionId") regionId?: string,
  ): Promise<TenancyOrganizationResponseDto[]> {
    const organizations = await this.organizationRepository.findAll(
      regionId ? RegionId.create(regionId) : undefined,
    );
    return organizations.map((org) => this.toResponse(org));
  }

  @Get(":id")
  @RequirePermissions("organizations:read")
  @ApiOperation({
    summary: "Get organization by ID",
    description: "Get a specific organization by its ID",
  })
  @ApiParam({ name: "id", description: "Organization UUID", type: "string" })
  @ApiResponse({
    status: 200,
    description: "Organization details",
    type: TenancyOrganizationResponseDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Organization not found" })
  async getById(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<TenancyOrganizationResponseDto> {
    const organization = await this.organizationRepository.findById(
      OrganizationId.create(id),
    );
    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }
    return this.toResponse(organization);
  }

  @Post()
  @RequirePermissions("organizations:create")
  @ApiOperation({
    summary: "Create organization",
    description: "Create a new organization within a region",
  })
  @ApiBody({ type: CreateOrganizationDto })
  @ApiResponse({
    status: 201,
    description: "Organization created successfully",
    type: TenancyOrganizationResponseDto,
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 409, description: "Organization code already exists" })
  async create(
    @Body() dto: CreateOrganizationDto,
  ): Promise<TenancyOrganizationResponseDto> {
    const existing = await this.organizationRepository.findByCode(dto.code);
    if (existing) {
      throw new ConflictException(
        `Organization with code '${dto.code}' already exists`,
      );
    }

    const organization = Organization.create(
      dto.name,
      dto.code,
      RegionId.create(dto.regionId),
      dto.description,
      dto.domain,
    );
    await this.organizationRepository.save(organization);
    return this.toResponse(organization);
  }

  @Patch(":id")
  @RequirePermissions("organizations:update")
  @ApiOperation({
    summary: "Update organization",
    description: "Update organization details",
  })
  @ApiParam({ name: "id", description: "Organization UUID", type: "string" })
  @ApiBody({ type: UpdateOrganizationDto })
  @ApiResponse({
    status: 200,
    description: "Organization updated successfully",
    type: TenancyOrganizationResponseDto,
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Organization not found" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrganizationDto,
  ): Promise<TenancyOrganizationResponseDto> {
    const organization = await this.organizationRepository.findById(
      OrganizationId.create(id),
    );
    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    organization.updateDetails(dto.name, dto.description, dto.domain);
    await this.organizationRepository.save(organization);
    return this.toResponse(organization);
  }

  @Delete(":id")
  @RequirePermissions("organizations:delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete organization",
    description: "Soft delete an organization",
  })
  @ApiParam({ name: "id", description: "Organization UUID", type: "string" })
  @ApiResponse({
    status: 204,
    description: "Organization deleted successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Organization not found" })
  async delete(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    const organization = await this.organizationRepository.findById(
      OrganizationId.create(id),
    );
    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }
    await this.organizationRepository.delete(OrganizationId.create(id));
  }

  @Patch(":id/activate")
  @RequirePermissions("organizations:update")
  @ApiOperation({
    summary: "Activate organization",
    description: "Activate a deactivated organization",
  })
  @ApiParam({ name: "id", description: "Organization UUID", type: "string" })
  @ApiResponse({
    status: 200,
    description: "Organization activated successfully",
    type: TenancyOrganizationResponseDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Organization not found" })
  async activate(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<TenancyOrganizationResponseDto> {
    const organization = await this.organizationRepository.findById(
      OrganizationId.create(id),
    );
    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    organization.activate();
    await this.organizationRepository.save(organization);
    return this.toResponse(organization);
  }

  @Patch(":id/deactivate")
  @RequirePermissions("organizations:update")
  @ApiOperation({
    summary: "Deactivate organization",
    description: "Deactivate an active organization",
  })
  @ApiParam({ name: "id", description: "Organization UUID", type: "string" })
  @ApiResponse({
    status: 200,
    description: "Organization deactivated successfully",
    type: TenancyOrganizationResponseDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Organization not found" })
  async deactivate(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<TenancyOrganizationResponseDto> {
    const organization = await this.organizationRepository.findById(
      OrganizationId.create(id),
    );
    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    organization.deactivate();
    await this.organizationRepository.save(organization);
    return this.toResponse(organization);
  }

  private toResponse(organization: Organization): TenancyOrganizationResponseDto {
    const response = new TenancyOrganizationResponseDto();
    response.organizationId = organization.getId().getValue();
    response.name = organization.getName();
    response.code = organization.getCode();
    response.description = organization.getDescription();
    response.domain = organization.getDomain();
    response.regionId = organization.getRegionId().getValue();
    response.isActive = organization.getIsActive();
    response.createdAt = organization.getCreatedAt();
    response.updatedAt = organization.getUpdatedAt();
    return response;
  }
}

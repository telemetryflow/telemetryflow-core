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
import { IWorkspaceRepository } from "../../domain/repositories/IWorkspaceRepository";
import { Workspace } from "../../domain/aggregates/Workspace";
import { WorkspaceId } from "../../domain/value-objects/WorkspaceId";
import { OrganizationId } from "../../domain/value-objects/OrganizationId";
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  WorkspaceResponseDto,
} from "../dto/Workspace.dto";

@ApiTags("tenancy-workspaces")
@ApiBearerAuth()
@Controller("tenancy/workspaces")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WorkspacesController {
  constructor(
    @Inject("ITenancyWorkspaceRepository")
    private readonly workspaceRepository: IWorkspaceRepository,
  ) {}

  @Get()
  @RequirePermissions("workspaces:read")
  @ApiOperation({
    summary: "List workspaces",
    description: "Get all workspaces, optionally filtered by organization",
  })
  @ApiQuery({
    name: "organizationId",
    required: false,
    description: "Filter by organization ID",
  })
  @ApiResponse({
    status: 200,
    description: "List of workspaces",
    type: [WorkspaceResponseDto],
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async list(
    @Query("organizationId") organizationId?: string,
  ): Promise<WorkspaceResponseDto[]> {
    const workspaces = await this.workspaceRepository.findAll(
      organizationId ? OrganizationId.create(organizationId) : undefined,
    );
    return workspaces.map((ws) => this.toResponse(ws));
  }

  @Get(":id")
  @RequirePermissions("workspaces:read")
  @ApiOperation({
    summary: "Get workspace by ID",
    description: "Get a specific workspace by its ID",
  })
  @ApiParam({ name: "id", description: "Workspace UUID", type: "string" })
  @ApiResponse({
    status: 200,
    description: "Workspace details",
    type: WorkspaceResponseDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Workspace not found" })
  async getById(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<WorkspaceResponseDto> {
    const workspace = await this.workspaceRepository.findById(
      WorkspaceId.create(id),
    );
    if (!workspace) {
      throw new NotFoundException(`Workspace with ID ${id} not found`);
    }
    return this.toResponse(workspace);
  }

  @Post()
  @RequirePermissions("workspaces:create")
  @ApiOperation({
    summary: "Create workspace",
    description: "Create a new workspace within an organization",
  })
  @ApiBody({ type: CreateWorkspaceDto })
  @ApiResponse({
    status: 201,
    description: "Workspace created successfully",
    type: WorkspaceResponseDto,
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 409, description: "Workspace code already exists" })
  async create(@Body() dto: CreateWorkspaceDto): Promise<WorkspaceResponseDto> {
    const existing = await this.workspaceRepository.findByCode(dto.code);
    if (existing) {
      throw new ConflictException(
        `Workspace with code '${dto.code}' already exists`,
      );
    }

    const workspace = Workspace.create(
      dto.name,
      dto.code,
      OrganizationId.create(dto.organizationId),
      dto.description,
    );
    await this.workspaceRepository.save(workspace);
    return this.toResponse(workspace);
  }

  @Patch(":id")
  @RequirePermissions("workspaces:update")
  @ApiOperation({
    summary: "Update workspace",
    description: "Update workspace details",
  })
  @ApiParam({ name: "id", description: "Workspace UUID", type: "string" })
  @ApiBody({ type: UpdateWorkspaceDto })
  @ApiResponse({
    status: 200,
    description: "Workspace updated successfully",
    type: WorkspaceResponseDto,
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Workspace not found" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateWorkspaceDto,
  ): Promise<WorkspaceResponseDto> {
    const workspace = await this.workspaceRepository.findById(
      WorkspaceId.create(id),
    );
    if (!workspace) {
      throw new NotFoundException(`Workspace with ID ${id} not found`);
    }

    workspace.updateDetails(dto.name, dto.description);
    await this.workspaceRepository.save(workspace);
    return this.toResponse(workspace);
  }

  @Delete(":id")
  @RequirePermissions("workspaces:delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete workspace",
    description: "Soft delete a workspace",
  })
  @ApiParam({ name: "id", description: "Workspace UUID", type: "string" })
  @ApiResponse({ status: 204, description: "Workspace deleted successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Workspace not found" })
  async delete(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    const workspace = await this.workspaceRepository.findById(
      WorkspaceId.create(id),
    );
    if (!workspace) {
      throw new NotFoundException(`Workspace with ID ${id} not found`);
    }
    await this.workspaceRepository.delete(WorkspaceId.create(id));
  }

  @Patch(":id/activate")
  @RequirePermissions("workspaces:update")
  @ApiOperation({
    summary: "Activate workspace",
    description: "Activate a deactivated workspace",
  })
  @ApiParam({ name: "id", description: "Workspace UUID", type: "string" })
  @ApiResponse({
    status: 200,
    description: "Workspace activated successfully",
    type: WorkspaceResponseDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Workspace not found" })
  async activate(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<WorkspaceResponseDto> {
    const workspace = await this.workspaceRepository.findById(
      WorkspaceId.create(id),
    );
    if (!workspace) {
      throw new NotFoundException(`Workspace with ID ${id} not found`);
    }

    workspace.activate();
    await this.workspaceRepository.save(workspace);
    return this.toResponse(workspace);
  }

  @Patch(":id/deactivate")
  @RequirePermissions("workspaces:update")
  @ApiOperation({
    summary: "Deactivate workspace",
    description: "Deactivate an active workspace",
  })
  @ApiParam({ name: "id", description: "Workspace UUID", type: "string" })
  @ApiResponse({
    status: 200,
    description: "Workspace deactivated successfully",
    type: WorkspaceResponseDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Workspace not found" })
  async deactivate(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<WorkspaceResponseDto> {
    const workspace = await this.workspaceRepository.findById(
      WorkspaceId.create(id),
    );
    if (!workspace) {
      throw new NotFoundException(`Workspace with ID ${id} not found`);
    }

    workspace.deactivate();
    await this.workspaceRepository.save(workspace);
    return this.toResponse(workspace);
  }

  private toResponse(workspace: Workspace): WorkspaceResponseDto {
    const response = new WorkspaceResponseDto();
    response.workspaceId = workspace.getId().getValue();
    response.name = workspace.getName();
    response.code = workspace.getCode();
    response.description = workspace.getDescription();
    response.organizationId = workspace.getOrganizationId().getValue();
    response.isActive = workspace.getIsActive();
    response.createdAt = workspace.getCreatedAt();
    response.updatedAt = workspace.getUpdatedAt();
    return response;
  }
}

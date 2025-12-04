import { Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator';
import { CreateWorkspaceDto, UpdateWorkspaceDto } from '../dto/Workspace.dto';
import { CreateWorkspaceCommand } from '../../application/commands/CreateWorkspace.command';
import { UpdateWorkspaceCommand } from '../../application/commands/UpdateWorkspace.command';
import { DeleteWorkspaceCommand } from '../../application/commands/DeleteWorkspace.command';
import { GetWorkspaceQuery } from '../../application/queries/GetWorkspace.query';
import { ListWorkspacesQuery } from '../../application/queries/ListWorkspaces.query';

@ApiTags('iam-workspaces')
@ApiBearerAuth()
@Controller('iam/workspaces')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WorkspaceController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @RequirePermissions('workspace:write')
  @ApiOperation({ summary: 'Create workspace', description: 'Create a new workspace within an organization' })
  @ApiBody({ type: CreateWorkspaceDto })
  @ApiResponse({ status: 201, description: 'Workspace created successfully' })
  @ApiResponse({ status: 409, description: 'Workspace code already exists' })
  async create(@Body() dto: CreateWorkspaceDto) {
    const command = new CreateWorkspaceCommand(
      dto.name,
      dto.code,
      dto.organizationId,
      dto.description,
      dto.datasourceConfig,
    );
    const id = await this.commandBus.execute(command);
    return { id };
  }

  @Get()
  @RequirePermissions('workspace:read')
  @ApiOperation({ summary: 'List workspaces', description: 'Get all workspaces, optionally filtered by organization' })
  @ApiQuery({ name: 'organizationId', required: false, description: 'Filter by organization ID' })
  @ApiResponse({ status: 200, description: 'List of workspaces' })
  async list(@Query('organizationId') organizationId?: string) {
    const query = new ListWorkspacesQuery(organizationId);
    return this.queryBus.execute(query);
  }

  @Get(':id')
  @RequirePermissions('workspace:read')
  @ApiOperation({ summary: 'Get workspace', description: 'Get workspace by ID' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiResponse({ status: 200, description: 'Workspace details' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async get(@Param('id') id: string) {
    const query = new GetWorkspaceQuery(id);
    return this.queryBus.execute(query);
  }

  @Patch(':id')
  @RequirePermissions('workspace:write')
  @ApiOperation({ summary: 'Update workspace', description: 'Update workspace details' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiBody({ type: UpdateWorkspaceDto })
  @ApiResponse({ status: 200, description: 'Workspace updated successfully' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateWorkspaceDto) {
    const command = new UpdateWorkspaceCommand(
      id,
      dto.name,
      dto.description,
      dto.datasourceConfig,
    );
    await this.commandBus.execute(command);
    return { message: 'Workspace updated successfully' };
  }

  @Delete(':id')
  @RequirePermissions('workspace:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete workspace', description: 'Soft delete workspace' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiResponse({ status: 204, description: 'Workspace deleted successfully' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async delete(@Param('id') id: string) {
    const command = new DeleteWorkspaceCommand(id);
    await this.commandBus.execute(command);
    return { message: 'Workspace deleted successfully' };
  }
}

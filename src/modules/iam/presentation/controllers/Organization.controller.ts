import { Controller, Post, Get, Put, Delete, Body, Param, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { CreateOrganizationCommand } from '../../application/commands/CreateOrganization.command';
import { UpdateOrganizationCommand } from '../../application/commands/UpdateOrganization.command';
import { DeleteOrganizationCommand } from '../../application/commands/DeleteOrganization.command';
import { GetOrganizationQuery } from '../../application/queries/GetOrganization.query';
import { ListOrganizationsQuery } from '../../application/queries/ListOrganizations.query';
import { CreateOrganizationDto, UpdateOrganizationDto } from '../dto/Organization.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator';

@ApiTags('iam-organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('organizations')
export class OrganizationController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @RequirePermissions('organization:write')
  @ApiOperation({ summary: 'Create organization', description: 'Create a new organization within a region' })
  @ApiBody({ type: CreateOrganizationDto })
  @ApiResponse({ status: 201, description: 'Organization created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Organization code already exists' })
  async create(@Body() dto: CreateOrganizationDto) {
    const command = new CreateOrganizationCommand(
      dto.name,
      dto.code,
      dto.regionId,
      dto.description,
      dto.domain,
    );
    const id = await this.commandBus.execute(command);
    return { id };
  }

  @Get()
  @RequirePermissions('organization:read')
  @ApiOperation({ summary: 'List organizations', description: 'Get all organizations, optionally filtered by region' })
  @ApiResponse({ status: 200, description: 'List of organizations' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async list(@Query('regionId') regionId?: string) {
    const query = new ListOrganizationsQuery(regionId);
    return await this.queryBus.execute(query);
  }

  @Get(':id')
  @RequirePermissions('organization:read')
  @ApiOperation({ summary: 'Get organization', description: 'Get organization by ID' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiResponse({ status: 200, description: 'Organization details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async get(@Param('id') id: string) {
    const query = new GetOrganizationQuery(id);
    return await this.queryBus.execute(query);
  }

  @Put(':id')
  @RequirePermissions('organization:write')
  @ApiOperation({ summary: 'Update organization', description: 'Update organization details' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiBody({ type: UpdateOrganizationDto })
  @ApiResponse({ status: 200, description: 'Organization updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateOrganizationDto) {
    const command = new UpdateOrganizationCommand(id, dto.name, dto.description, dto.domain);
    await this.commandBus.execute(command);
    return { success: true };
  }

  @Delete(':id')
  @RequirePermissions('organization:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete organization', description: 'Soft delete organization' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiResponse({ status: 204, description: 'Organization deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async delete(@Param('id') id: string) {
    const command = new DeleteOrganizationCommand(id);
    await this.commandBus.execute(command);
  }
}

import { Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator';
import { CreateTenantDto, UpdateTenantDto } from '../dto/Tenant.dto';
import { CreateTenantCommand } from '../../application/commands/CreateTenant.command';
import { UpdateTenantCommand } from '../../application/commands/UpdateTenant.command';
import { DeleteTenantCommand } from '../../application/commands/DeleteTenant.command';
import { GetTenantQuery } from '../../application/queries/GetTenant.query';
import { ListTenantsQuery } from '../../application/queries/ListTenants.query';

@ApiTags('iam-tenants')
@ApiBearerAuth()
@Controller('iam/tenants')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TenantController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @RequirePermissions('tenant:write')
  @ApiOperation({ summary: 'Create tenant', description: 'Create a new tenant within a workspace' })
  @ApiBody({ type: CreateTenantDto })
  @ApiResponse({ status: 201, description: 'Tenant created successfully' })
  @ApiResponse({ status: 409, description: 'Tenant code already exists' })
  async create(@Body() dto: CreateTenantDto) {
    const command = new CreateTenantCommand(
      dto.name,
      dto.code,
      dto.workspaceId,
      dto.domain,
    );
    const id = await this.commandBus.execute(command);
    return { id };
  }

  @Get()
  @RequirePermissions('tenant:read')
  @ApiOperation({ summary: 'List tenants', description: 'Get all tenants, optionally filtered by workspace' })
  @ApiQuery({ name: 'workspaceId', required: false, description: 'Filter by workspace ID' })
  @ApiResponse({ status: 200, description: 'List of tenants' })
  async list(@Query('workspaceId') workspaceId?: string) {
    const query = new ListTenantsQuery(workspaceId);
    return this.queryBus.execute(query);
  }

  @Get(':id')
  @RequirePermissions('tenant:read')
  @ApiOperation({ summary: 'Get tenant', description: 'Get tenant by ID' })
  @ApiParam({ name: 'id', description: 'Tenant ID' })
  @ApiResponse({ status: 200, description: 'Tenant details' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async get(@Param('id') id: string) {
    const query = new GetTenantQuery(id);
    return this.queryBus.execute(query);
  }

  @Patch(':id')
  @RequirePermissions('tenant:write')
  @ApiOperation({ summary: 'Update tenant', description: 'Update tenant details' })
  @ApiParam({ name: 'id', description: 'Tenant ID' })
  @ApiBody({ type: UpdateTenantDto })
  @ApiResponse({ status: 200, description: 'Tenant updated successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    const command = new UpdateTenantCommand(id, dto.name, dto.domain);
    await this.commandBus.execute(command);
    return { message: 'Tenant updated successfully' };
  }

  @Delete(':id')
  @RequirePermissions('tenant:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete tenant', description: 'Soft delete tenant' })
  @ApiParam({ name: 'id', description: 'Tenant ID' })
  @ApiResponse({ status: 204, description: 'Tenant deleted successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async delete(@Param('id') id: string) {
    const command = new DeleteTenantCommand(id);
    await this.commandBus.execute(command);
    return { message: 'Tenant deleted successfully' };
  }
}

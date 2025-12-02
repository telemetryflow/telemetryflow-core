import { Controller, Post, Get, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator';
import { CreateRoleCommand } from '../../application/commands/CreateRole.command';
import { UpdateRoleCommand } from '../../application/commands/UpdateRole.command';
import { DeleteRoleCommand } from '../../application/commands/DeleteRole.command';
import { AssignPermissionCommand } from '../../application/commands/AssignPermission.command';
import { RemovePermissionCommand } from '../../application/commands/RemovePermission.command';
import { GetRoleQuery } from '../../application/queries/GetRole.query';
import { ListRolesQuery } from '../../application/queries/ListRoles.query';
import { GetRoleUsersQuery } from '../../application/queries/GetRoleUsers.query';
import { RoleResponseDto } from '../../application/dto/RoleResponse.dto';
import { CreateRoleDto, UpdateRoleDto, ListRolesDto, AssignPermissionDto } from '../dto/Role.dto';

@ApiTags('iam-roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RoleController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @RequirePermissions('role:write')
  @ApiOperation({ summary: 'Create role' })
  @ApiResponse({ status: 201, type: RoleResponseDto })
  async create(@Body() dto: CreateRoleDto): Promise<RoleResponseDto> {
    const command = new CreateRoleCommand(
      dto.name,
      dto.description,
      dto.permissionIds || [],
      dto.tenantId,
    );
    return await this.commandBus.execute(command);
  }

  @Get()
  @RequirePermissions('role:read')
  @ApiOperation({ summary: 'List roles' })
  @ApiResponse({ status: 200, type: [RoleResponseDto] })
  async list(@Query() query: ListRolesDto): Promise<RoleResponseDto[]> {
    const queryObj = new ListRolesQuery(query.tenantId, query.includeSystem);
    return await this.queryBus.execute(queryObj);
  }

  @Get(':id')
  @RequirePermissions('role:read')
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiResponse({ status: 200, type: RoleResponseDto })
  async getById(@Param('id') id: string): Promise<RoleResponseDto> {
    const query = new GetRoleQuery(id);
    return await this.queryBus.execute(query);
  }

  @Patch(':id')
  @RequirePermissions('role:write')
  @ApiOperation({ summary: 'Update role' })
  @ApiResponse({ status: 200, type: RoleResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ): Promise<RoleResponseDto> {
    const command = new UpdateRoleCommand(id, dto.name, dto.description);
    return await this.commandBus.execute(command);
  }

  @Delete(':id')
  @RequirePermissions('role:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete role' })
  @ApiResponse({ status: 204 })
  async delete(@Param('id') id: string): Promise<void> {
    const command = new DeleteRoleCommand(id);
    await this.commandBus.execute(command);
  }

  @Get(':id/permissions')
  @RequirePermissions('role:read')
  @ApiOperation({ summary: 'Get role permissions' })
  @ApiResponse({ status: 200, description: 'List of permissions for the role' })
  async getPermissions(@Param('id') id: string): Promise<any[]> {
    const role = await this.queryBus.execute(new GetRoleQuery(id));
    return role.permissions || [];
  }

  @Post(':id/permissions')
  @RequirePermissions('role:write')
  @ApiOperation({ summary: 'Assign permission to role' })
  @ApiResponse({ status: 200, type: RoleResponseDto })
  async assignPermission(
    @Param('id') id: string,
    @Body() dto: AssignPermissionDto,
  ): Promise<RoleResponseDto> {
    const command = new AssignPermissionCommand(id, dto.permissionId);
    return await this.commandBus.execute(command);
  }

  @Delete(':id/permissions/:permissionId')
  @RequirePermissions('role:write')
  @ApiOperation({ summary: 'Remove permission from role' })
  @ApiResponse({ status: 200, type: RoleResponseDto })
  async removePermission(
    @Param('id') id: string,
    @Param('permissionId') permissionId: string,
  ): Promise<RoleResponseDto> {
    const command = new RemovePermissionCommand(id, permissionId);
    return await this.commandBus.execute(command);
  }

  @Get(':id/users')
  @RequirePermissions('role:read')
  @ApiOperation({ summary: 'Get users with this role' })
  @ApiResponse({ status: 200, type: [String] })
  async getRoleUsers(@Param('id') id: string): Promise<string[]> {
    const query = new GetRoleUsersQuery(id);
    return await this.queryBus.execute(query);
  }
}

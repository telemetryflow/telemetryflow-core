import { Controller, Post, Get, Put, Delete, Body, Param, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator';
import { CreateUserCommand } from '../../application/commands/CreateUser.command';
import { UpdateUserCommand } from '../../application/commands/UpdateUser.command';
import { DeleteUserCommand } from '../../application/commands/DeleteUser.command';
import { ActivateUserCommand } from '../../application/commands/ActivateUser.command';
import { ChangePasswordCommand } from '../../application/commands/ChangePassword.command';
import { GetUserQuery } from '../../application/queries/GetUser.query';
import { ListUsersQuery } from '../../application/queries/ListUsers.query';
import { AssignRoleToUserCommand } from '../../application/commands/AssignRoleToUser.command';
import { RevokeRoleFromUserCommand } from '../../application/commands/RevokeRoleFromUser.command';
import { GetUserRolesQuery } from '../../application/queries/GetUserRoles.query';
import { AssignPermissionToUserCommand } from '../../application/commands/AssignPermissionToUser.command';
import { RevokePermissionFromUserCommand } from '../../application/commands/RevokePermissionFromUser.command';
import { GetUserPermissionsQuery } from '../../application/queries/GetUserPermissions.query';
import { AssignRoleDto } from '../dto/UserRole.dto';
import { AssignPermissionToUserDto } from '../dto/UserPermission.dto';
import { CreateUserDto, UpdateUserDto, AdminResetPasswordDto } from '../dto/User.dto';
import { UserResponseDto } from '../../application/dto/UserResponse.dto';

@ApiTags('iam-users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @RequirePermissions('user:write')
  @ApiOperation({ summary: 'Create user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiBody({ type: CreateUserDto })
  async create(@Body() dto: CreateUserDto) {
    const command = new CreateUserCommand(dto.email, dto.password, dto.firstName, dto.lastName);
    const id = await this.commandBus.execute(command);
    return { id };
  }

  @Get()
  @RequirePermissions('user:read')
  @ApiOperation({ summary: 'List users' })
  @ApiResponse({ status: 200, type: [UserResponseDto] })
  async list(@Query('email') email?: string, @Query('organizationId') organizationId?: string) {
    const query = new ListUsersQuery(1, 20, email, organizationId);
    return await this.queryBus.execute(query);
  }

  @Get(':id')
  @RequirePermissions('user:read')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiParam({ name: 'id', description: 'User ID' })
  async get(@Param('id') id: string) {
    const query = new GetUserQuery(id);
    return await this.queryBus.execute(query);
  }

  @Put(':id')
  @RequirePermissions('user:write')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ type: UpdateUserDto })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const command = new UpdateUserCommand(id, dto.firstName, dto.lastName, dto.avatar, dto.timezone, dto.locale);
    await this.commandBus.execute(command);
    return { success: true };
  }

  @Delete(':id')
  @RequirePermissions('user:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user' })
  async delete(@Param('id') id: string) {
    const command = new DeleteUserCommand(id);
    await this.commandBus.execute(command);
  }

  @Post(':id/activate')
  @RequirePermissions('user:write')
  @ApiOperation({ summary: 'Activate user' })
  async activate(@Param('id') id: string) {
    const command = new ActivateUserCommand(id);
    await this.commandBus.execute(command);
    return { success: true };
  }

  @Post(':id/deactivate')
  @RequirePermissions('user:write')
  @ApiOperation({ summary: 'Deactivate user' })
  async deactivate(@Param('id') id: string) {
    const user = await this.queryBus.execute(new GetUserQuery(id));
    // Deactivate logic here
    return { success: true };
  }

  @Put(':id/password')
  @RequirePermissions('user:write')
  @ApiOperation({ summary: 'Admin reset user password' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ type: AdminResetPasswordDto })
  async changePassword(@Param('id') id: string, @Body() dto: AdminResetPasswordDto) {
    const command = new ChangePasswordCommand(id, dto.password);
    await this.commandBus.execute(command);
    return { success: true };
  }

  @Post(':id/roles')
  @RequirePermissions('user:write')
  @ApiOperation({ summary: 'Assign role to user' })
  async assignRole(@Param('id') id: string, @Body() dto: AssignRoleDto) {
    const command = new AssignRoleToUserCommand(id, dto.roleId);
    await this.commandBus.execute(command);
    return { success: true };
  }

  @Delete(':id/roles/:roleId')
  @RequirePermissions('user:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke role from user' })
  async revokeRole(@Param('id') id: string, @Param('roleId') roleId: string) {
    const command = new RevokeRoleFromUserCommand(id, roleId);
    await this.commandBus.execute(command);
  }

  @Get(':id/roles')
  @RequirePermissions('user:read')
  @ApiOperation({ summary: 'Get user roles' })
  async getUserRoles(@Param('id') id: string) {
    const query = new GetUserRolesQuery(id);
    return await this.queryBus.execute(query);
  }

  @Post(':id/permissions')
  @RequirePermissions('user:write')
  @ApiOperation({ summary: 'Assign permission to user' })
  async assignPermission(@Param('id') id: string, @Body() dto: AssignPermissionToUserDto) {
    const command = new AssignPermissionToUserCommand(id, dto.permissionId);
    await this.commandBus.execute(command);
    return { success: true };
  }

  @Delete(':id/permissions/:permissionId')
  @RequirePermissions('user:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke permission from user' })
  async revokePermission(@Param('id') id: string, @Param('permissionId') permissionId: string) {
    const command = new RevokePermissionFromUserCommand(id, permissionId);
    await this.commandBus.execute(command);
  }

  @Get(':id/permissions')
  @RequirePermissions('user:read')
  @ApiOperation({ summary: 'Get user permissions' })
  async getUserPermissions(@Param('id') id: string) {
    const query = new GetUserPermissionsQuery(id);
    return await this.queryBus.execute(query);
  }
}

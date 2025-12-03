import { Controller, Post, Get, Patch, Delete, Body, Param, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator';
import { CreateGroupCommand } from '../../application/commands/CreateGroup.command';
import { UpdateGroupCommand } from '../../application/commands/UpdateGroup.command';
import { DeleteGroupCommand } from '../../application/commands/DeleteGroup.command';
import { AddUserToGroupCommand } from '../../application/commands/AddUserToGroup.command';
import { RemoveUserFromGroupCommand } from '../../application/commands/RemoveUserFromGroup.command';
import { GetGroupQuery } from '../../application/queries/GetGroup.query';
import { ListGroupsQuery } from '../../application/queries/ListGroups.query';
import { GroupResponseDto } from '../../application/dto/GroupResponse.dto';
import { CreateGroupDto, UpdateGroupDto, AddUserDto } from '../dto/Group.dto';

@ApiTags('iam-groups')
@ApiBearerAuth()
@Controller('iam/groups')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class GroupController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @RequirePermissions('group:write')
  @ApiOperation({ summary: 'Create group' })
  @ApiResponse({ status: 201, type: GroupResponseDto })
  async create(@Body() dto: CreateGroupDto): Promise<GroupResponseDto> {
    const command = new CreateGroupCommand(dto.name, dto.description, dto.organizationId);
    return await this.commandBus.execute(command);
  }

  @Get()
  @RequirePermissions('group:read')
  @ApiOperation({ summary: 'List groups' })
  @ApiResponse({ status: 200, type: [GroupResponseDto] })
  async list(): Promise<GroupResponseDto[]> {
    const query = new ListGroupsQuery();
    return await this.queryBus.execute(query);
  }

  @Get(':id')
  @RequirePermissions('group:read')
  @ApiOperation({ summary: 'Get group by ID' })
  @ApiResponse({ status: 200, type: GroupResponseDto })
  async getById(@Param('id') id: string): Promise<GroupResponseDto> {
    const query = new GetGroupQuery(id);
    return await this.queryBus.execute(query);
  }

  @Patch(':id')
  @RequirePermissions('group:write')
  @ApiOperation({ summary: 'Update group' })
  @ApiResponse({ status: 200, type: GroupResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateGroupDto): Promise<GroupResponseDto> {
    const command = new UpdateGroupCommand(id, dto.name, dto.description);
    return await this.commandBus.execute(command);
  }

  @Delete(':id')
  @RequirePermissions('group:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete group' })
  @ApiResponse({ status: 204 })
  async delete(@Param('id') id: string): Promise<void> {
    const command = new DeleteGroupCommand(id);
    await this.commandBus.execute(command);
  }

  @Post(':id/users')
  @RequirePermissions('group:write')
  @ApiOperation({ summary: 'Add user to group' })
  @ApiResponse({ status: 200, type: GroupResponseDto })
  async addUser(@Param('id') id: string, @Body() dto: AddUserDto): Promise<GroupResponseDto> {
    const command = new AddUserToGroupCommand(id, dto.userId);
    return await this.commandBus.execute(command);
  }

  @Get(':id/users')
  @RequirePermissions('group:read')
  @ApiOperation({ summary: 'Get users in group' })
  @ApiResponse({ status: 200, type: GroupResponseDto })
  async getUsers(@Param('id') id: string): Promise<GroupResponseDto> {
    const query = new GetGroupQuery(id);
    return await this.queryBus.execute(query);
  }

  @Delete(':id/users/:userId')
  @RequirePermissions('group:write')
  @ApiOperation({ summary: 'Remove user from group' })
  @ApiResponse({ status: 200, type: GroupResponseDto })
  async removeUser(@Param('id') id: string, @Param('userId') userId: string): Promise<GroupResponseDto> {
    const command = new RemoveUserFromGroupCommand(id, userId);
    return await this.commandBus.execute(command);
  }
}

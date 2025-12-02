import { Controller, Post, Get, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator';
import { CreatePermissionCommand } from '../../application/commands/CreatePermission.command';
import { UpdatePermissionCommand } from '../../application/commands/UpdatePermission.command';
import { DeletePermissionCommand } from '../../application/commands/DeletePermission.command';
import { GetPermissionQuery } from '../../application/queries/GetPermission.query';
import { ListPermissionsQuery } from '../../application/queries/ListPermissions.query';
import { PermissionResponseDto } from '../../application/dto/PermissionResponse.dto';
import { CreatePermissionDto, UpdatePermissionDto, ListPermissionsDto } from '../dto/Permission.dto';

@ApiTags('iam-permissions')
@ApiBearerAuth()
@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @RequirePermissions('permission:write')
  @ApiOperation({ summary: 'Create permission' })
  @ApiResponse({ status: 201, type: PermissionResponseDto })
  async create(@Body() dto: CreatePermissionDto): Promise<PermissionResponseDto> {
    const command = new CreatePermissionCommand(
      dto.name,
      dto.description,
      dto.resource,
      dto.action,
    );
    return await this.commandBus.execute(command);
  }

  @Get()
  @RequirePermissions('permission:read')
  @ApiOperation({ summary: 'List permissions' })
  @ApiResponse({ status: 200, type: [PermissionResponseDto] })
  async list(@Query() query: ListPermissionsDto): Promise<PermissionResponseDto[]> {
    const queryObj = new ListPermissionsQuery(query.resource);
    return await this.queryBus.execute(queryObj);
  }

  @Get(':id')
  @RequirePermissions('permission:read')
  @ApiOperation({ summary: 'Get permission by ID' })
  @ApiResponse({ status: 200, type: PermissionResponseDto })
  async getById(@Param('id') id: string): Promise<PermissionResponseDto> {
    const query = new GetPermissionQuery(id);
    return await this.queryBus.execute(query);
  }

  @Patch(':id')
  @RequirePermissions('permission:write')
  @ApiOperation({ summary: 'Update permission' })
  @ApiResponse({ status: 200, type: PermissionResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePermissionDto,
  ): Promise<PermissionResponseDto> {
    const command = new UpdatePermissionCommand(
      id,
      dto.name,
      dto.description,
      dto.resource,
      dto.action,
    );
    return await this.commandBus.execute(command);
  }

  @Delete(':id')
  @RequirePermissions('permission:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete permission' })
  @ApiResponse({ status: 204 })
  async delete(@Param('id') id: string): Promise<void> {
    const command = new DeletePermissionCommand(id);
    await this.commandBus.execute(command);
  }
}

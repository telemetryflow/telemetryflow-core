import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator';
import { CreateRetentionPolicyCommand } from '../../application/commands/CreateRetentionPolicy.command';
import { UpdateRetentionPolicyCommand } from '../../application/commands/UpdateRetentionPolicy.command';
import { DeleteRetentionPolicyCommand } from '../../application/commands/DeleteRetentionPolicy.command';
import { GetRetentionPolicyQuery } from '../../application/queries/GetRetentionPolicy.query';
import { ListRetentionPoliciesQuery } from '../../application/queries/ListRetentionPolicies.query';
import { CreateRetentionPolicyDto } from '../dto/CreateRetentionPolicy.dto';
import { UpdateRetentionPolicyDto } from '../dto/UpdateRetentionPolicy.dto';
import { EnforceRetentionDto } from '../dto/EnforceRetention.dto';
import { RetentionEnforcementService } from '../../application/services/RetentionEnforcement.service';
import { DataType } from '../../domain/aggregates/RetentionPolicy';

@ApiTags('Retention')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('retention/policies')
export class RetentionPolicyController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly enforcementService: RetentionEnforcementService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new retention policy' })
  @ApiResponse({ status: 201, description: 'Retention policy created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'Policy with same name already exists' })
  async create(
    @Body() dto: CreateRetentionPolicyDto,
    @CurrentUser() user: { organizationId: string },
  ) {
    const command = new CreateRetentionPolicyCommand(
      dto.name,
      dto.dataType as DataType,
      dto.retentionDays,
      user.organizationId,
      dto.description,
      dto.archiveEnabled,
      dto.archiveDestination,
      dto.filters,
    );

    const id = await this.commandBus.execute(command);
    return { id, message: 'Retention policy created successfully' };
  }

  @Get()
  @ApiOperation({ summary: 'List retention policies' })
  @ApiQuery({ name: 'dataType', required: false, enum: ['logs', 'metrics', 'traces', 'alerts', 'exemplars'] })
  @ApiQuery({ name: 'includeDefaults', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of retention policies' })
  async list(
    @CurrentUser() user: { organizationId: string },
    @Query('dataType') dataType?: string,
    @Query('includeDefaults') includeDefaults?: string,
  ) {
    const query = new ListRetentionPoliciesQuery(
      user.organizationId,
      dataType as DataType | undefined,
      includeDefaults !== 'false',
    );

    return this.queryBus.execute(query);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get retention statistics' })
  @ApiQuery({ name: 'dataType', required: false, enum: ['logs', 'metrics', 'traces', 'alerts', 'exemplars'] })
  @ApiResponse({ status: 200, description: 'Retention statistics' })
  async getStatistics(
    @CurrentUser() user: { organizationId: string },
    @Query('dataType') dataType?: string,
  ) {
    return this.enforcementService.getStatistics(
      user.organizationId,
      dataType as DataType | undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a retention policy by ID' })
  @ApiResponse({ status: 200, description: 'Retention policy details' })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    const query = new GetRetentionPolicyQuery(id, user.organizationId);
    return this.queryBus.execute(query);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a retention policy' })
  @ApiResponse({ status: 200, description: 'Retention policy updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 403, description: 'Cannot modify default or other org policies' })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRetentionPolicyDto,
    @CurrentUser() user: { organizationId: string },
  ) {
    const command = new UpdateRetentionPolicyCommand(
      id,
      user.organizationId,
      dto.name,
      dto.description,
      dto.retentionDays,
      dto.archiveEnabled,
      dto.archiveDestination,
      dto.filters,
      dto.isActive,
    );

    await this.commandBus.execute(command);
    return { message: 'Retention policy updated successfully' };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a retention policy' })
  @ApiResponse({ status: 204, description: 'Retention policy deleted successfully' })
  @ApiResponse({ status: 403, description: 'Cannot delete default policies' })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    const command = new DeleteRetentionPolicyCommand(id, user.organizationId);
    await this.commandBus.execute(command);
  }

  @Post('enforce')
  @ApiOperation({ summary: 'Manually enforce retention policies' })
  @ApiResponse({ status: 200, description: 'Retention enforcement results' })
  async enforceRetention(
    @Body() dto: EnforceRetentionDto,
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.enforcementService.enforceRetention(
      dto.dataType as DataType | undefined,
      user.organizationId,
      dto.dryRun ?? false,
    );
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate a retention policy' })
  @ApiResponse({ status: 200, description: 'Policy activated' })
  async activate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    const command = new UpdateRetentionPolicyCommand(id, user.organizationId, undefined, undefined, undefined, undefined, undefined, undefined, true);
    await this.commandBus.execute(command);
    return { message: 'Retention policy activated' };
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a retention policy' })
  @ApiResponse({ status: 200, description: 'Policy deactivated' })
  async deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    const command = new UpdateRetentionPolicyCommand(id, user.organizationId, undefined, undefined, undefined, undefined, undefined, undefined, false);
    await this.commandBus.execute(command);
    return { message: 'Retention policy deactivated' };
  }
}

import { Controller, Post, Get, Patch, Delete, Body, Param, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator';
import { CreateRegionCommand } from '../../application/commands/CreateRegion.command';
import { UpdateRegionCommand } from '../../application/commands/UpdateRegion.command';
import { DeleteRegionCommand } from '../../application/commands/DeleteRegion.command';
import { GetRegionQuery } from '../../application/queries/GetRegion.query';
import { ListRegionsQuery } from '../../application/queries/ListRegions.query';
import { RegionResponseDto } from '../../application/dto/RegionResponse.dto';
import { CreateRegionDto, UpdateRegionDto } from '../dto/Region.dto';

@ApiTags('iam-regions')
@ApiBearerAuth()
@Controller('iam/regions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RegionController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @RequirePermissions('region:write')
  @ApiOperation({ summary: 'Create region' })
  @ApiResponse({ status: 201, type: RegionResponseDto })
  async create(@Body() dto: CreateRegionDto): Promise<RegionResponseDto> {
    const command = new CreateRegionCommand(dto.name, dto.code, dto.description);
    return await this.commandBus.execute(command);
  }

  @Get()
  @RequirePermissions('region:read')
  @ApiOperation({ summary: 'List regions' })
  @ApiResponse({ status: 200, type: [RegionResponseDto] })
  async list(): Promise<RegionResponseDto[]> {
    const query = new ListRegionsQuery();
    return await this.queryBus.execute(query);
  }

  @Get(':id')
  @RequirePermissions('region:read')
  @ApiOperation({ summary: 'Get region by ID' })
  @ApiResponse({ status: 200, type: RegionResponseDto })
  async getById(@Param('id') id: string): Promise<RegionResponseDto> {
    const query = new GetRegionQuery(id);
    return await this.queryBus.execute(query);
  }

  @Patch(':id')
  @RequirePermissions('region:write')
  @ApiOperation({ summary: 'Update region' })
  @ApiResponse({ status: 200, type: RegionResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateRegionDto): Promise<RegionResponseDto> {
    const command = new UpdateRegionCommand(id, dto.name, dto.description);
    return await this.commandBus.execute(command);
  }

  @Delete(':id')
  @RequirePermissions('region:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete region' })
  @ApiResponse({ status: 204 })
  async delete(@Param('id') id: string): Promise<void> {
    const command = new DeleteRegionCommand(id);
    await this.commandBus.execute(command);
  }
}

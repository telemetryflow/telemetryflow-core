import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
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
  ApiBody,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { Inject } from "@nestjs/common";
import { JwtAuthGuard } from "@/modules/auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/modules/auth/guards/permissions.guard";
import { RequirePermissions } from "@/modules/auth/decorators/permissions.decorator";
import { IRegionRepository } from "../../domain/repositories/IRegionRepository";
import { Region } from "../../domain/aggregates/Region";
import { RegionId } from "../../domain/value-objects/RegionId";
import {
  CreateRegionDto,
  UpdateRegionDto,
  RegionResponseDto,
} from "../dto/Region.dto";

@ApiTags("tenancy-regions")
@ApiBearerAuth()
@Controller("tenancy/regions")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RegionsController {
  constructor(
    @Inject("ITenancyRegionRepository")
    private readonly regionRepository: IRegionRepository,
  ) {}

  @Get()
  @RequirePermissions("regions:read")
  @ApiOperation({
    summary: "List regions",
    description: "Get all available regions",
  })
  @ApiResponse({
    status: 200,
    description: "List of regions",
    type: [RegionResponseDto],
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async list(): Promise<RegionResponseDto[]> {
    const regions = await this.regionRepository.findAll();
    return regions.map((region) => this.toResponse(region));
  }

  @Get(":id")
  @RequirePermissions("regions:read")
  @ApiOperation({
    summary: "Get region by ID",
    description: "Get a specific region by its ID",
  })
  @ApiParam({ name: "id", description: "Region UUID", type: "string" })
  @ApiResponse({
    status: 200,
    description: "Region details",
    type: RegionResponseDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Region not found" })
  async getById(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<RegionResponseDto> {
    const region = await this.regionRepository.findById(RegionId.create(id));
    if (!region) {
      throw new NotFoundException(`Region with ID ${id} not found`);
    }
    return this.toResponse(region);
  }

  @Post()
  @RequirePermissions("regions:create")
  @ApiOperation({
    summary: "Create region",
    description: "Create a new region",
  })
  @ApiBody({ type: CreateRegionDto })
  @ApiResponse({
    status: 201,
    description: "Region created successfully",
    type: RegionResponseDto,
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 409, description: "Region code already exists" })
  async create(@Body() dto: CreateRegionDto): Promise<RegionResponseDto> {
    const existing = await this.regionRepository.findByCode(dto.code);
    if (existing) {
      throw new ConflictException(
        `Region with code '${dto.code}' already exists`,
      );
    }

    const region = Region.create(dto.name, dto.code, dto.description || "");
    await this.regionRepository.save(region);
    return this.toResponse(region);
  }

  @Patch(":id")
  @RequirePermissions("regions:update")
  @ApiOperation({
    summary: "Update region",
    description: "Update region details",
  })
  @ApiParam({ name: "id", description: "Region UUID", type: "string" })
  @ApiBody({ type: UpdateRegionDto })
  @ApiResponse({
    status: 200,
    description: "Region updated successfully",
    type: RegionResponseDto,
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Region not found" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateRegionDto,
  ): Promise<RegionResponseDto> {
    const region = await this.regionRepository.findById(RegionId.create(id));
    if (!region) {
      throw new NotFoundException(`Region with ID ${id} not found`);
    }

    region.updateDetails(dto.name, dto.description);
    await this.regionRepository.save(region);
    return this.toResponse(region);
  }

  @Delete(":id")
  @RequirePermissions("regions:delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete region",
    description: "Soft delete a region",
  })
  @ApiParam({ name: "id", description: "Region UUID", type: "string" })
  @ApiResponse({ status: 204, description: "Region deleted successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Region not found" })
  async delete(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    const region = await this.regionRepository.findById(RegionId.create(id));
    if (!region) {
      throw new NotFoundException(`Region with ID ${id} not found`);
    }
    await this.regionRepository.delete(RegionId.create(id));
  }

  @Patch(":id/activate")
  @RequirePermissions("regions:update")
  @ApiOperation({
    summary: "Activate region",
    description: "Activate a deactivated region",
  })
  @ApiParam({ name: "id", description: "Region UUID", type: "string" })
  @ApiResponse({
    status: 200,
    description: "Region activated successfully",
    type: RegionResponseDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Region not found" })
  async activate(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<RegionResponseDto> {
    const region = await this.regionRepository.findById(RegionId.create(id));
    if (!region) {
      throw new NotFoundException(`Region with ID ${id} not found`);
    }

    region.activate();
    await this.regionRepository.save(region);
    return this.toResponse(region);
  }

  @Patch(":id/deactivate")
  @RequirePermissions("regions:update")
  @ApiOperation({
    summary: "Deactivate region",
    description: "Deactivate an active region",
  })
  @ApiParam({ name: "id", description: "Region UUID", type: "string" })
  @ApiResponse({
    status: 200,
    description: "Region deactivated successfully",
    type: RegionResponseDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Region not found" })
  async deactivate(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<RegionResponseDto> {
    const region = await this.regionRepository.findById(RegionId.create(id));
    if (!region) {
      throw new NotFoundException(`Region with ID ${id} not found`);
    }

    region.deactivate();
    await this.regionRepository.save(region);
    return this.toResponse(region);
  }

  private toResponse(region: Region): RegionResponseDto {
    const response = new RegionResponseDto();
    response.id = region.getId().getValue();
    response.name = region.getName();
    response.code = region.getCode();
    response.description = region.getDescription();
    response.isActive = region.getIsActive();
    response.createdAt = region.getCreatedAt();
    response.updatedAt = region.getUpdatedAt();
    return response;
  }
}

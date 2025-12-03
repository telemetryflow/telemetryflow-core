import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator';
import { AuditService } from '../../../audit/audit.service';

@ApiTags('iam-audit')
@Controller('audit')
export class AuditLogController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @ApiOperation({ summary: 'List audit logs' })
  async list(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
  ) {
    return this.auditService.query({
      limit: limit || 50,
      offset: offset || 0,
      userId,
      action,
    });
  }

  @Get('logs/:id')
  @RequirePermissions('audit:read')
  @ApiOperation({ summary: 'Get audit log' })
  async get(@Param('id') id: string) {
    return this.auditService.getById(id);
  }

  @Get('count')
  @RequirePermissions('audit:read')
  @ApiOperation({ summary: 'Get audit count' })
  async count() {
    return this.auditService.count();
  }

  @Get('statistics')
  @RequirePermissions('audit:read')
  @ApiOperation({ summary: 'Get audit statistics' })
  async statistics() {
    return this.auditService.getStatistics();
  }

  @Get('export')
  @RequirePermissions('audit:read')
  @ApiOperation({ summary: 'Export audit logs' })
  async export(@Query('format') format: string) {
    return this.auditService.export(format);
  }
}

import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  UseGuards,
  NotFoundException,
  Res,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { Response } from "express";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { AuditService } from "../../audit.service";
import { ListAuditLogsQueryDto, GetAuditStatisticsQueryDto } from "../dto";

@ApiTags("audit")
@ApiBearerAuth()
@Controller("audit")
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get("graph")
  @ApiOperation({
    summary: "Get audit chart data",
    description:
      "Returns time-series or grouped chart data from audit_logs, scoped to the authenticated user's organization. " +
      "type: registrations | active_users | login_activity | registrations_by_region",
  })
  @ApiResponse({ status: 200, description: "Chart series data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getGraph(
    @Query("type") type: string,
    @Query("from") from: string,
    @Query("to") to: string,
    @Req() req: any,
  ) {
    const organizationId: string | undefined =
      req.user?.organizationId ?? req.user?.organization_id;
    const fromMs = Number(from) || Date.now() - 7 * 24 * 60 * 60 * 1000;
    const toMs = Number(to) || Date.now();
    return this.auditService.getGraphData(type, fromMs, toMs, organizationId);
  }

  @Get("logs")
  @ApiOperation({
    summary: "List audit logs",
    description:
      "Get audit logs with pagination, filtering by event type, result, user, action, resource, and date range",
  })
  @ApiResponse({ status: 200, description: "Paginated list of audit logs" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async listLogs(@Query() query: ListAuditLogsQueryDto) {
    const { page = 1, pageSize = 20 } = query;
    const offset = (page - 1) * pageSize;

    const filterOpts = {
      userId: query.userId,
      userEmail: query.userEmail,
      eventType: query.eventType,
      result: query.result,
      action: query.action,
      resource: query.resource,
      startDate: query.startDate,
      endDate: query.endDate,
      search: query.search,
    };

    const data = await this.auditService.query({
      limit: pageSize,
      offset,
      ...filterOpts,
    });

    const { count: total } = await this.auditService.countFiltered(filterOpts);
    const totalPages = Math.ceil(total / pageSize);

    return {
      data,
      total,
      page,
      page_size: pageSize,
      total_pages: totalPages,
      has_next: page < totalPages,
      has_previous: page > 1,
    };
  }

  @Get("count")
  @ApiOperation({
    summary: "Get audit log count",
    description: "Get the total count of audit logs, optionally filtered",
  })
  @ApiResponse({ status: 200, description: "Audit log count" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getCount(@Query() query: ListAuditLogsQueryDto) {
    return this.auditService.countFiltered({
      userId: query.userId,
      userEmail: query.userEmail,
      eventType: query.eventType,
      result: query.result,
      action: query.action,
      resource: query.resource,
      startDate: query.startDate,
      endDate: query.endDate,
      search: query.search,
    });
  }

  @Get("statistics")
  @ApiOperation({
    summary: "Get audit statistics",
    description:
      "Get aggregated audit statistics grouped by event type and result, optionally filtered",
  })
  @ApiResponse({ status: 200, description: "Audit statistics" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getStatistics(@Query() query: GetAuditStatisticsQueryDto) {
    const rawStats = await this.auditService.getStatistics({
      eventType: query.eventType,
      result: query.result,
      userEmail: query.userEmail,
      startDate: query.from,
      endDate: query.to,
    });

    // Transform raw grouped data into structured statistics response
    const byEventType: Record<string, number> = {
      AUTH: 0,
      AUTHZ: 0,
      DATA: 0,
      SYSTEM: 0,
    };
    const byResult: Record<string, number> = {
      SUCCESS: 0,
      FAILURE: 0,
      DENIED: 0,
    };
    let total = 0;

    for (const row of rawStats) {
      const count = Number(row.count) || 0;
      total += count;

      if (row.event_type && byEventType[row.event_type] !== undefined) {
        byEventType[row.event_type] += count;
      }
      if (row.result && byResult[row.result] !== undefined) {
        byResult[row.result] += count;
      }
    }

    return {
      total,
      timestamp: new Date().toISOString(),
      by_event_type: byEventType,
      by_result: byResult,
    };
  }

  @Get("export")
  @ApiOperation({
    summary: "Export audit logs",
    description: "Export audit logs as CSV or JSON",
  })
  @ApiResponse({ status: 200, description: "Exported audit logs" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async exportLogs(
    @Query() query: ListAuditLogsQueryDto,
    @Res() res: Response,
  ) {
    const format = query.format || "json";
    const data = await this.auditService.export(format);

    if (format === "csv") {
      const headers = [
        "id",
        "timestamp",
        "user_id",
        "user_email",
        "event_type",
        "action",
        "resource",
        "result",
        "ip_address",
      ];

      const csvRows = [
        headers.join(","),
        ...data.map((row: any) =>
          headers
            .map((h) => {
              const val = row[h] ?? "";
              // Escape values containing commas or quotes
              const strVal = String(val);
              if (strVal.includes(",") || strVal.includes('"')) {
                return `"${strVal.replace(/"/g, '""')}"`;
              }
              return strVal;
            })
            .join(","),
        ),
      ];

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="audit-logs-${Date.now()}.csv"`,
      );
      return res.send(csvRows.join("\n"));
    }

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="audit-logs-${Date.now()}.json"`,
    );
    return res.json(data);
  }

  @Get("logs/:id")
  @ApiOperation({
    summary: "Get audit log by ID",
    description: "Get a single audit log entry by its ID",
  })
  @ApiParam({ name: "id", description: "Audit log ID" })
  @ApiResponse({ status: 200, description: "Audit log details" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Audit log not found" })
  async getById(@Param("id") id: string) {
    const log = await this.auditService.getById(id);
    if (!log) {
      throw new NotFoundException(`Audit log with ID "${id}" not found`);
    }
    return log;
  }
}

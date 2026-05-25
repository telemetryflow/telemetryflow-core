import { randomUUID } from "crypto";
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from "@nestjs/swagger";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { JwtAuthGuard } from "@/modules/auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/modules/auth/guards/permissions.guard";
import { RequirePermissions } from "@/modules/auth/decorators/permissions.decorator";
import { CreatePolicyCommand } from "../../application/commands/CreatePolicy.command";
import { UpdatePolicyCommand } from "../../application/commands/UpdatePolicy.command";
import { DeletePolicyCommand } from "../../application/commands/DeletePolicy.command";
import { TogglePolicyCommand } from "../../application/commands/TogglePolicy.command";
import { TestMaskingRuleCommand } from "../../application/commands/TestMaskingRule.command";
import { GetPolicyQuery } from "../../application/queries/GetPolicy.query";
import { ListPoliciesQuery } from "../../application/queries/ListPolicies.query";
import { CreatePolicyDto } from "../dto/CreatePolicy.dto";
import { UpdatePolicyDto } from "../dto/UpdatePolicy.dto";
import { TestRuleDto } from "../dto/TestRule.dto";
import {
  PolicyResponseDto,
  ListPoliciesResponseDto,
  TestRuleResponseDto,
} from "../../application/dto/PolicyResponse.dto";

@ApiTags("Data Masking")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("data-masking")
export class DataMaskingController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // ─── Policies ─────────────────────────────────────────────────────────────

  @Get("policies")
  @RequirePermissions("data-masking:read")
  @ApiOperation({
    summary: "List PII masking policies",
    description:
      "Returns all data masking policies for the authenticated user's organization. " +
      "Supports filtering by workspace, enabled state, and name search.",
  })
  @ApiQuery({
    name: "workspaceId",
    required: false,
    type: String,
    format: "uuid",
  })
  @ApiQuery({ name: "enabled", required: false, type: Boolean })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "page", required: false, type: Number, example: 1 })
  @ApiQuery({ name: "pageSize", required: false, type: Number, example: 20 })
  @ApiResponse({
    status: 200,
    description: "Paginated list of masking policies",
    type: ListPoliciesResponseDto,
  })
  async listPolicies(
    @Request() req: any,
    @Query("workspaceId") workspaceId?: string,
    @Query("enabled") enabledRaw?: string,
    @Query("search") search?: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query("pageSize", new DefaultValuePipe(20), ParseIntPipe)
    pageSize: number = 20,
  ): Promise<ListPoliciesResponseDto> {
    const organizationId = req.user?.organizationId ?? req.user?.sub;
    const enabled =
      enabledRaw === undefined ? undefined : enabledRaw === "true";

    return this.queryBus.execute(
      new ListPoliciesQuery(
        organizationId,
        page,
        pageSize,
        workspaceId,
        enabled,
        search,
      ),
    );
  }

  @Get("policies/:id")
  @RequirePermissions("data-masking:read")
  @ApiOperation({ summary: "Get a masking policy by ID" })
  @ApiParam({ name: "id", description: "Policy UUID", format: "uuid" })
  @ApiResponse({ status: 200, type: PolicyResponseDto })
  @ApiResponse({ status: 404, description: "Policy not found" })
  async getPolicy(
    @Param("id", ParseUUIDPipe) id: string,
    @Request() req: any,
  ): Promise<PolicyResponseDto> {
    const organizationId = req.user?.organizationId ?? req.user?.sub;
    return this.queryBus.execute(new GetPolicyQuery(id, organizationId));
  }

  @Post("policies")
  @RequirePermissions("data-masking:write")
  @ApiOperation({
    summary: "Create a PII masking policy",
    description:
      "Creates a new masking policy with one or more rules. Rules are sorted by " +
      "priority at ingestion time (lower = runs first). The policy is immediately " +
      "active if `enabled: true`.",
  })
  @ApiBody({ type: CreatePolicyDto })
  @ApiResponse({ status: 201, type: PolicyResponseDto })
  async createPolicy(
    @Body() dto: CreatePolicyDto,
    @Request() req: any,
  ): Promise<PolicyResponseDto> {
    const organizationId = req.user?.organizationId ?? req.user?.sub;
    const userId = req.user?.userId ?? req.user?.sub;

    return this.commandBus.execute(
      new CreatePolicyCommand(
        organizationId,
        dto.name,
        (dto.rules ?? []).map((r) => ({ ...r, id: r.id ?? randomUUID() })),
        userId,
        dto.description,
        dto.workspaceId,
        dto.enabled ?? true,
      ),
    );
  }

  @Patch("policies/:id")
  @RequirePermissions("data-masking:write")
  @ApiOperation({
    summary: "Update a masking policy",
    description:
      "Updates policy fields and/or rules. Supplying `rules` replaces the entire " +
      "rule list — omit the field to leave rules unchanged.",
  })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiBody({ type: UpdatePolicyDto })
  @ApiResponse({ status: 200, type: PolicyResponseDto })
  @ApiResponse({ status: 404, description: "Policy not found" })
  async updatePolicy(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdatePolicyDto,
    @Request() req: any,
  ): Promise<PolicyResponseDto> {
    const organizationId = req.user?.organizationId ?? req.user?.sub;
    const userId = req.user?.userId ?? req.user?.sub;

    return this.commandBus.execute(
      new UpdatePolicyCommand(
        id,
        organizationId,
        userId,
        dto.name,
        dto.description,
        dto.rules?.map((r) => ({ ...r, id: r.id ?? randomUUID() })),
        dto.enabled,
      ),
    );
  }

  @Delete("policies/:id")
  @RequirePermissions("data-masking:delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a masking policy (soft delete)" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiResponse({ status: 204, description: "Policy deleted" })
  @ApiResponse({ status: 404, description: "Policy not found" })
  async deletePolicy(
    @Param("id", ParseUUIDPipe) id: string,
    @Request() req: any,
  ): Promise<void> {
    const organizationId = req.user?.organizationId ?? req.user?.sub;
    return this.commandBus.execute(new DeletePolicyCommand(id, organizationId));
  }

  @Patch("policies/:id/enable")
  @RequirePermissions("data-masking:manage")
  @ApiOperation({ summary: "Enable a masking policy" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiResponse({ status: 200, type: PolicyResponseDto })
  async enablePolicy(
    @Param("id", ParseUUIDPipe) id: string,
    @Request() req: any,
  ): Promise<PolicyResponseDto> {
    const organizationId = req.user?.organizationId ?? req.user?.sub;
    const userId = req.user?.userId ?? req.user?.sub;
    return this.commandBus.execute(
      new TogglePolicyCommand(id, organizationId, true, userId),
    );
  }

  @Patch("policies/:id/disable")
  @RequirePermissions("data-masking:manage")
  @ApiOperation({ summary: "Disable a masking policy" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiResponse({ status: 200, type: PolicyResponseDto })
  async disablePolicy(
    @Param("id", ParseUUIDPipe) id: string,
    @Request() req: any,
  ): Promise<PolicyResponseDto> {
    const organizationId = req.user?.organizationId ?? req.user?.sub;
    const userId = req.user?.userId ?? req.user?.sub;
    return this.commandBus.execute(
      new TogglePolicyCommand(id, organizationId, false, userId),
    );
  }

  // ─── Built-in Patterns ────────────────────────────────────────────────────

  @Get("builtin-patterns")
  @RequirePermissions("data-masking:read")
  @ApiOperation({
    summary: "List built-in PII pattern definitions",
    description:
      "Returns all built-in pattern names with their regex source and a sample " +
      "match description, to assist in building masking rules.",
  })
  @ApiResponse({
    status: 200,
    description: "Array of built-in pattern definitions",
  })
  getBuiltinPatterns() {
    const {
      BUILTIN_PATTERNS,
    } = require("../../domain/value-objects/MaskingRule");
    return Object.entries(BUILTIN_PATTERNS).map(
      ([name, regex]: [string, RegExp]) => ({
        name,
        regexSource: regex.source,
        flags: regex.flags,
        description: BUILTIN_DESCRIPTIONS[name] ?? "",
      }),
    );
  }

  // ─── Test ──────────────────────────────────────────────────────────────────

  @Post("test-rule")
  @RequirePermissions("data-masking:write")
  @ApiOperation({
    summary: "Test a masking rule against sample input",
    description:
      "Dry-run a single masking rule against provided sample text. " +
      "No data is persisted. Useful for verifying regex patterns before saving.",
  })
  @ApiBody({ type: TestRuleDto })
  @ApiResponse({ status: 200, type: TestRuleResponseDto })
  async testRule(@Body() dto: TestRuleDto): Promise<TestRuleResponseDto> {
    return this.commandBus.execute(
      new TestMaskingRuleCommand(
        { ...dto.rule, id: dto.rule.id ?? randomUUID() },
        dto.sampleInput,
      ),
    );
  }
}

const BUILTIN_DESCRIPTIONS: Record<string, string> = {
  EMAIL: "Standard email addresses (RFC-5322 simplified)",
  CREDIT_CARD:
    "Major credit card numbers — Visa, Mastercard, Amex, Discover, JCB",
  SSN: "US Social Security Numbers in XXX-XX-XXXX format",
  PHONE: "North American phone numbers in various formats",
  IP_ADDRESS: "IPv4 addresses",
  JWT_TOKEN: "JSON Web Tokens (header.payload.signature)",
  API_KEY_GENERIC: "Generic API key / secret / password key-value pairs",
  URL_CREDENTIALS:
    "URLs containing embedded credentials (https://user:pass@...)",
  AWS_ACCESS_KEY: "AWS IAM access key IDs (AKIA*, ASIA*, etc.)",
  PRIVATE_KEY: "PEM-encoded private key blocks",
};

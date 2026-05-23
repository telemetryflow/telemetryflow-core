/**
 * TenantContext Value Object
 * Multi-tenant context for query filtering
 */
export interface TenantContextProps {
  organizationId: string;
  workspaceId?: string;
  tenantId?: string;
}

export class TenantContext {
  private constructor(
    private readonly _organizationId: string,
    private readonly _workspaceId?: string,
    private readonly _tenantId?: string,
  ) {}

  static create(props: TenantContextProps): TenantContext {
    if (!props.organizationId) {
      throw new Error('organizationId is required');
    }
    return new TenantContext(
      props.organizationId,
      props.workspaceId,
      props.tenantId,
    );
  }

  get organizationId(): string {
    return this._organizationId;
  }

  get workspaceId(): string | undefined {
    return this._workspaceId;
  }

  get tenantId(): string | undefined {
    return this._tenantId;
  }

  /**
   * Convert to filter object for repository queries
   */
  toFilter(): Record<string, string | undefined> {
    const filter: Record<string, string | undefined> = {
      organizationId: this._organizationId,
    };

    if (this._workspaceId) {
      filter.workspaceId = this._workspaceId;
    }

    if (this._tenantId) {
      filter.tenantId = this._tenantId;
    }

    return filter;
  }

  /**
   * Convert to ClickHouse query parameters
   */
  toClickHouseParams(): Record<string, string> {
    const params: Record<string, string> = {
      organizationId: this._organizationId,
    };

    if (this._workspaceId) {
      params.workspaceId = this._workspaceId;
    }

    if (this._tenantId) {
      params.tenantId = this._tenantId;
    }

    return params;
  }

  /**
   * Build WHERE conditions for ClickHouse queries
   */
  toClickHouseConditions(): string[] {
    const conditions = ['organization_id = {organizationId:String}'];

    if (this._workspaceId) {
      conditions.push('workspace_id = {workspaceId:String}');
    }

    if (this._tenantId) {
      conditions.push('tenant_id = {tenantId:String}');
    }

    return conditions;
  }

  toJSON(): TenantContextProps {
    return {
      organizationId: this._organizationId,
      workspaceId: this._workspaceId,
      tenantId: this._tenantId,
    };
  }
}

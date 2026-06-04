const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let _cachedOrgId: string | null = null;

export function getDefaultOrgId(): string {
  if (_cachedOrgId) return _cachedOrgId;
  const ref =
    process.env.DEFAULT_ORGANIZATION_ID ||
    process.env.CLICKHOUSE_LOGS_DEFAULT_ORG_ID ||
    "";
  if (UUID_RE.test(ref)) {
    _cachedOrgId = ref;
  }
  return ref;
}

export function setDefaultOrgId(orgId: string): void {
  if (orgId) _cachedOrgId = orgId;
}

export function resolveOrganizationId(req: any): string {
  return (
    req?.user?.organizationId ||
    req?.apiKey?.organizationId ||
    getDefaultOrgId() ||
    ""
  );
}

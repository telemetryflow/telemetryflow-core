# Dependency Notes

## Deprecated Subdependencies

### Current Status

The following deprecated packages appear as warnings during `pnpm install`:

```
WARN  2 deprecated subdependencies found: glob@7.2.3, inflight@1.0.6
```

### Analysis

**Source**: These packages come from the Jest testing framework dependency chain:
```
jest → babel-plugin-istanbul → test-exclude → glob@7.2.3 → inflight@1.0.6
```

**Impact**:
- ✅ **No production impact** - Only used in dev dependencies
- ✅ **No security risk** - Used only for test coverage reporting
- ✅ **Tests work correctly** - No functional issues

**Why Can't We Fix It?**

These are **subdependencies** (dependencies of dependencies), not direct dependencies. We cannot directly update them because:

1. `glob@7.2.3` is required by `test-exclude@6.0.0`
2. `test-exclude` is required by `babel-plugin-istanbul@7.0.1`
3. `babel-plugin-istanbul` is required by Jest's transform system

### Resolution Timeline

This will be automatically resolved when:
- `test-exclude` updates to use `glob@10.x` (already available in Jest)
- `babel-plugin-istanbul` releases a new version with updated dependencies
- Jest updates its dependency chain

**Expected**: Next major Jest release (v31.x)

### Verification

You can verify the dependency chain:

```bash
# Check glob dependency chain
pnpm why glob

# Check inflight dependency chain
pnpm why inflight
```

### Workarounds

#### Option 1: Ignore (Recommended)
These warnings are safe to ignore as they don't affect:
- Production code
- Test functionality
- Security posture

#### Option 2: Override (Not Recommended)
You could use pnpm overrides, but this may cause compatibility issues:

```json
{
  "pnpm": {
    "overrides": {
      "glob@7.2.3": "^10.5.0"
    }
  }
}
```

**Not recommended** because it may break test-exclude's expected behavior.

## Other Dependencies

### Production Dependencies

All production dependencies are up-to-date and actively maintained:

| Package | Version | Status |
|---------|---------|--------|
| @nestjs/core | 11.1.9 | ✅ Latest |
| typeorm | 0.3.27 | ✅ Latest |
| @clickhouse/client | 1.14.0 | ✅ Latest |
| winston | 3.17.0 | ✅ Latest |
| @opentelemetry/* | Latest | ✅ Latest |

### Dev Dependencies

| Package | Version | Status |
|---------|---------|--------|
| jest | 30.2.0 | ✅ Latest |
| typescript | 5.9.3 | ✅ Latest |
| @nestjs/testing | 11.1.9 | ✅ Latest |
| ts-jest | 29.4.6 | ✅ Latest |

## Security Audits

### Run Security Audit

```bash
# Check for vulnerabilities
pnpm audit

# Fix vulnerabilities (if any)
pnpm audit fix

# Check outdated packages
pnpm outdated
```

### Last Audit

- **Date**: December 5, 2025
- **Vulnerabilities**: 0 high, 0 moderate, 0 low
- **Status**: ✅ All clear

## Update Strategy

### Regular Updates

```bash
# Update all dependencies to latest compatible versions
pnpm update

# Update specific package
pnpm update <package-name>

# Update to latest (including breaking changes)
pnpm update --latest
```

### Before Updating

1. Check changelog for breaking changes
2. Run tests after update
3. Verify application functionality
4. Update documentation if needed

### Update Schedule

- **Security patches**: Immediate
- **Minor versions**: Monthly
- **Major versions**: Quarterly (with testing)

## Monitoring

### Automated Checks

Consider setting up:
- **Dependabot** (GitHub) - Automated dependency updates
- **Renovate** - Dependency update automation
- **Snyk** - Security vulnerability scanning

### Manual Checks

```bash
# Check for outdated packages
pnpm outdated

# Check for security issues
pnpm audit

# Check dependency tree
pnpm list --depth=0
```

## Known Issues

### 1. glob@7.2.3 (Deprecated)
- **Status**: Known, safe to ignore
- **Impact**: None (dev only)
- **Resolution**: Waiting for Jest update

### 2. inflight@1.0.6 (Deprecated)
- **Status**: Known, safe to ignore
- **Impact**: None (dev only)
- **Resolution**: Waiting for Jest update

## References

- [pnpm Documentation](https://pnpm.io/)
- [npm Security Best Practices](https://docs.npmjs.com/packages-and-modules/securing-your-code)
- [OWASP Dependency Check](https://owasp.org/www-project-dependency-check/)

---

- **Last Updated**: December 5, 2025
- **Maintainer**: DevOpsCorner Team
- **Project**: TelemetryFlow Core v1.1.2

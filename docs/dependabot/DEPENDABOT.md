<div align="center">
  <img src="assets/tfo-logo-light.svg#gh-light-mode-only" alt="TelemetryFlow Logo" width="600">
  <img src="assets/tfo-logo-dark.svg#gh-dark-mode-only" alt="TelemetryFlow Logo" width="600">
</div>

# Dependabot Configuration

## Overview

Dependabot automatically checks for dependency updates and creates pull requests to keep TelemetryFlow Core secure and up-to-date.

## Configuration

Location: `.github/dependabot.yml`

### Monitored Ecosystems

1. **npm (pnpm)** - Node.js dependencies
2. **Docker** - Container images
3. **GitHub Actions** - CI/CD workflows

### Update Schedule

| Ecosystem | Day | Time | Timezone |
|-----------|-----|------|----------|
| npm | Monday | 09:00 | Asia/Jakarta |
| Docker | Monday | 10:00 | Asia/Jakarta |
| GitHub Actions | Monday | 11:00 | Asia/Jakarta |

## How It Works

### 1. Automatic Checks

Dependabot runs weekly on Monday mornings:
- Scans `package.json` for npm updates
- Scans `Dockerfile` and `docker-compose.yml` for image updates
- Scans `.github/workflows/*.yml` for action updates

### 2. Pull Request Creation

When updates are found, Dependabot:
- Creates a PR with the update
- Assigns to `@devopscorner`
- Adds appropriate labels
- Includes changelog and release notes
- Runs CI/CD tests automatically

### 3. Review Process

**For each PR:**
1. Review the changelog
2. Check for breaking changes
3. Verify CI/CD tests pass
4. Test locally if needed
5. Merge or close

## PR Limits

- **npm**: Max 10 open PRs
- **Docker**: Max 5 open PRs
- **GitHub Actions**: Max 5 open PRs

## Commit Message Format

Dependabot uses conventional commits:

```
chore(deps): bump @nestjs/core from 11.1.8 to 11.1.9
chore(docker): bump node from 18-alpine to 20-alpine
chore(ci): bump actions/checkout from 3 to 4
```

## Ignored Dependencies

### glob@7.x and inflight@1.x

These are intentionally ignored because:
- They are Jest subdependencies
- Cannot be directly updated
- Will be fixed in Jest v31.x
- See [DEPENDENCY_NOTES.md](./DEPENDENCY_NOTES.md) for details

## Labels

Dependabot PRs are automatically labeled:

- `dependencies` - All dependency updates
- `npm` - Node.js package updates
- `docker` - Docker image updates
- `github-actions` - GitHub Actions updates

## Managing Dependabot

### Enable/Disable

**Enable** (default):
```yaml
# .github/dependabot.yml exists
```

**Disable**:
```bash
# Delete or rename .github/dependabot.yml
mv .github/dependabot.yml .github/dependabot.yml.disabled
```

### Pause Updates

To temporarily pause updates:

1. Go to GitHub repository settings
2. Navigate to Security & analysis
3. Click "Dependabot version updates"
4. Pause updates

### Change Schedule

Edit `.github/dependabot.yml`:

```yaml
schedule:
  interval: "daily"    # or "weekly", "monthly"
  day: "monday"        # for weekly
  time: "09:00"
  timezone: "Asia/Jakarta"
```

## Security Updates

Dependabot also monitors for security vulnerabilities:

- **Automatic**: Security updates are created immediately
- **Priority**: Security PRs are marked as high priority
- **Alerts**: GitHub sends email notifications

### Enable Security Updates

1. Go to repository Settings
2. Security & analysis
3. Enable "Dependabot security updates"

## Best Practices

### 1. Review Regularly

- Check Dependabot PRs weekly
- Don't let PRs accumulate
- Merge or close promptly

### 2. Test Before Merging

```bash
# Checkout PR locally
gh pr checkout <PR-number>

# Install dependencies
pnpm install

# Run tests
pnpm test

# Run application
pnpm dev
```

### 3. Group Related Updates

If multiple PRs update related packages:
- Review together
- Test together
- Merge together

### 4. Monitor Breaking Changes

Watch for:
- Major version updates (e.g., 10.x → 11.x)
- Deprecated features
- API changes
- Migration guides

### 5. Keep CI/CD Green

- Ensure all tests pass
- Fix failing tests before merging
- Update test snapshots if needed

## Troubleshooting

### PR Creation Failed

**Issue**: Dependabot can't create PR

**Solutions**:
1. Check branch protection rules
2. Verify Dependabot has write access
3. Check for merge conflicts
4. Review `.github/dependabot.yml` syntax

### Too Many PRs

**Issue**: Too many open PRs

**Solutions**:
1. Reduce `open-pull-requests-limit`
2. Change schedule to monthly
3. Ignore specific dependencies
4. Batch review and merge

### Tests Failing

**Issue**: CI/CD tests fail on Dependabot PR

**Solutions**:
1. Check if update introduces breaking changes
2. Update tests to match new behavior
3. Check for peer dependency conflicts
4. Review package changelog

### Merge Conflicts

**Issue**: PR has merge conflicts

**Solutions**:
1. Rebase PR on main branch
2. Let Dependabot recreate PR
3. Manually resolve conflicts

## Commands

Dependabot responds to comments on PRs:

```bash
# Rebase PR
@dependabot rebase

# Recreate PR
@dependabot recreate

# Merge PR
@dependabot merge

# Squash and merge
@dependabot squash and merge

# Ignore this dependency
@dependabot ignore this dependency

# Ignore this major version
@dependabot ignore this major version

# Ignore this minor version
@dependabot ignore this minor version
```

## Integration with CI/CD

Dependabot PRs automatically trigger:
- Unit tests
- Integration tests
- Linting
- Type checking
- Build verification

**Required checks** must pass before merge.

## Notifications

### Email Notifications

Configure in GitHub settings:
- Security alerts: Immediate
- Dependabot PRs: Daily digest
- Failed updates: Immediate

### Slack Integration

To get Dependabot notifications in Slack:

1. Install GitHub app in Slack
2. Subscribe to repository
3. Configure notification preferences

```
/github subscribe devopscorner/telemetryflow-core
/github subscribe devopscorner/telemetryflow-core reviews comments
```

## Statistics

Track Dependabot activity:
- PRs created per week
- Average merge time
- Security vulnerabilities fixed
- Dependencies kept up-to-date

## Related Documentation

- [DEPENDENCY_NOTES.md](./DEPENDENCY_NOTES.md) - Dependency management
- [SECURITY.md](../SECURITY.md) - Security policy
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution guidelines

## References

- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [Configuration Options](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file)
- [Dependabot Commands](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/managing-pull-requests-for-dependency-updates)

---

**Last Updated**: December 5, 2025
**Version**: 1.1.2
**Project**: TelemetryFlow Core

**Built with ❤️ by DevOpsCorner Indonesia**

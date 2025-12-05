# Dependabot Quick Reference

## 📋 Configuration Summary

| Setting | Value |
|---------|-------|
| **Location** | `.github/dependabot.yml` |
| **Schedule** | Weekly (Monday) |
| **Timezone** | Asia/Jakarta (WIB) |
| **Ecosystems** | npm, Docker, GitHub Actions |

## ⏰ Update Schedule

| Ecosystem | Time | Max PRs |
|-----------|------|---------|
| npm (pnpm) | 09:00 WIB | 10 |
| Docker | 10:00 WIB | 5 |
| GitHub Actions | 11:00 WIB | 5 |

## 🏷️ Labels

- `dependencies` - All updates
- `npm` - Node.js packages
- `docker` - Docker images
- `github-actions` - CI/CD workflows

## 💬 PR Commands

```bash
@dependabot rebase              # Rebase on main
@dependabot recreate            # Recreate PR
@dependabot merge               # Merge PR
@dependabot squash and merge    # Squash and merge
@dependabot ignore this dependency
@dependabot ignore this major version
```

## ✅ Review Checklist

- [ ] Read changelog
- [ ] Check for breaking changes
- [ ] Verify CI/CD passes
- [ ] Test locally (if major update)
- [ ] Merge or close

## 🚫 Ignored Dependencies

- `glob@7.x` - Jest subdependency
- `inflight@1.x` - Jest subdependency

*Will be fixed in Jest v31.x*

## 🔧 Quick Actions

### Test PR Locally
```bash
gh pr checkout <PR-number>
pnpm install
pnpm test
```

### Batch Merge
```bash
# Review all Dependabot PRs
gh pr list --label dependencies

# Merge if tests pass
gh pr merge <PR-number> --squash
```

### Pause Updates
```bash
# Disable temporarily
mv .github/dependabot.yml .github/dependabot.yml.disabled

# Re-enable
mv .github/dependabot.yml.disabled .github/dependabot.yml
```

## 📊 Commit Format

```
chore(deps): bump <package> from <old> to <new>
chore(docker): bump <image> from <old> to <new>
chore(ci): bump <action> from <old> to <new>
```

## 🔗 Links

- [Full Documentation](./DEPENDABOT.md)
- [Dependency Notes](./DEPENDENCY_NOTES.md)
- [GitHub Docs](https://docs.github.com/en/code-security/dependabot)

---

**Quick Tip**: Review and merge Dependabot PRs every Monday to keep dependencies fresh! 🚀

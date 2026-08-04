# Releasing GPT-Nexus

This document explains how to release a new version of GPT-Nexus.

## Overview

Releasing GPT-Nexus is automated through a single command that validates, builds, and creates the release commit and tag. The entire process takes under one minute.

## Prerequisites

Before releasing, ensure you have:

- Clean git working tree (no uncommitted changes)
- Updated `manifest.json` with the new version
- Updated `CHANGELOG.md` with the new version
- Created/updated the announcement in `announcements/current.md`

## Release Workflow

### Step 1: Update Version in manifest.json

Update the version in `manifest.json`:

```json
{
  "version": "2.0.2"
}
```

### Step 2: Update CHANGELOG.md

Add a new section for the upcoming release:

```markdown
## [2.0.2] - 2026-08-05

### Added
- New feature X
- New feature Y

### Fixed
- Bug fix Z
```

### Step 3: Write Announcement Markdown

Edit `announcements/current.md` with the new announcement:

```markdown
---
id: 2.0.2-release
version: 2.0.2
type: release
priority: high
title: GPT-Nexus 2.0.2
summary: Bug fixes and performance improvements.
---

# GPT-Nexus 2.0.2

Bug fixes and performance improvements.
```

**Important:** The `version` in the announcement must match the version in `manifest.json`.

### Step 4: Run Release Command

```bash
npm run release
```

This will:

1. **Run release checks** - Validates git status, required files, version matching, and CHANGELOG
2. **Build announcement** - Generates `announcements.json` from the markdown
3. **Validate JSON** - Ensures the generated JSON is valid
4. **Create commit** - Creates a release commit with message "Release v{version}"
5. **Create tag** - Creates a git tag `v{version}`
6. **Display summary** - Shows release summary

### Step 5: Push to GitHub

```bash
git push origin main
git push origin v2.0.2
```

Or use the `--push` flag to push automatically:

```bash
npm run release -- --push
```

## Release Commands

### `npm run release:check`

Run validation checks without performing the release. Useful for verifying everything is ready before releasing.

**Checks performed:**
- Git working tree is clean
- Required files exist (manifest.json, CHANGELOG.md, announcements/)
- Manifest version matches announcement version
- CHANGELOG.md contains the version
- announcements.json exists and is valid

### `npm run release`

Perform the complete release pipeline.

**Steps performed:**
1. Run release checks
2. Build announcement
3. Validate announcement JSON
4. Create release commit
5. Create git tag
6. Display summary

**Optional flags:**
- `--push` - Automatically push to remote after creating tag

## Validation Rules

The release will fail if:

- **Git working tree is dirty** - Commit or stash changes first
- **Required files missing** - Ensure manifest.json, CHANGELOG.md, and announcements/ exist
- **Version mismatch** - Manifest version must equal announcement version
- **CHANGELOG missing version** - Add the version to CHANGELOG.md
- **Invalid announcement JSON** - Run `npm run build:announcement` first

## Example Output

```
🚀 Starting release pipeline...

1/6 Running release checks...
🔍 Running release checks...
✅ Git working tree is clean.
✅ Found: manifest.json
✅ Found: CHANGELOG.md
✅ Found: announcements/
✅ Manifest version: 2.0.2
✅ Found announcement markdown: current.md
✅ Announcement version: 2.0.2
✅ Version match: manifest == announcement
✅ CHANGELOG.md contains version 2.0.2
✅ announcements.json is valid
✅ Announcement ID: 2.0.2-release
==================================================
✅ All release checks passed!

Ready to release version 2.0.2
Run: npm run release

2/6 Building announcement...
📢 Building announcements...
📖 Reading: current.md
✅ announcements.json generated successfully!

3/6 Validating announcement JSON...
✅ Announcement JSON is valid.

4/6 Creating release commit...
✅ Release commit created: Release v2.0.2

5/6 Creating git tag...
✅ Git tag created: v2.0.2

6/6 Pushing to remote...
✅ Pushed to remote: main + v2.0.2

==================================================
🎉 Release Summary
==================================================
✔ Version: 2.0.2
✔ Announcement: 2.0.2-release
✔ Changelog: Updated
✔ Tag: v2.0.2
✔ Pushed: Yes

==================================================

✅ Release complete!
```

## Troubleshooting

### Release Checks Failed

**Error:** "Git working tree is not clean"

**Solution:** Commit or stash your changes before releasing.

**Error:** "Version mismatch: manifest.json (2.0.2) != announcement (2.0.1)"

**Solution:** Update the `version` field in `announcements/current.md` to match manifest.json.

**Error:** "CHANGELOG.md does not contain version 2.0.2"

**Solution:** Add a section for version 2.0.2 in CHANGELOG.md.

**Error:** "announcements.json does not exist"

**Solution:** Run `npm run build:announcement` to generate it.

### Build Failed

**Error:** "No valid YAML front matter found"

**Solution:** Ensure your announcement file starts with `---` and has valid YAML front matter.

**Error:** "Missing required field: id"

**Solution:** Add the `id` field to your announcement front matter.

### Git Operations Failed

**Error:** "Failed to create release commit"

**Solution:** Check git status and resolve any conflicts.

**Error:** "Failed to create git tag"

**Solution:** Ensure the tag doesn't already exist. Delete existing tag with `git tag -d v{version}`.

**Error:** "Failed to push to remote"

**Solution:** Check your git remote configuration and authentication.

## Best Practices

### Version Numbers

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes (backwards compatible)

### Announcement Priority

Choose the right priority for your release:
- **critical**: Security fixes, breaking changes
- **high**: Major features, important updates
- **normal**: Standard releases (default)
- **low**: Minor updates, tips

### CHANGELOG Format

Follow [Keep a Changelog](https://keepachangelog.com/) format:
```markdown
## [2.0.2] - 2026-08-05

### Added
- New feature

### Changed
- Modified behavior

### Deprecated
- Soon-to-be-removed feature

### Removed
- Removed feature

### Fixed
- Bug fix

### Security
- Security fix
```

### Testing Before Release

Before releasing:
1. Test the extension locally with the new version
2. Verify the announcement renders correctly
3. Test action buttons if present
4. Check responsive design
5. Verify dark mode support

## Quick Reference

### Standard Release

```bash
# 1. Update version in manifest.json
# 2. Update CHANGELOG.md
# 3. Update announcements/current.md
# 4. Run release
npm run release
# 5. Push
git push origin main
git push origin v{version}
```

### Release with Auto-Push

```bash
npm run release -- --push
```

### Check Before Releasing

```bash
npm run release:check
```

### Build Announcement Only

```bash
npm run build:announcement
```

## Timeline

A typical release takes less than one minute:

- **Checks**: ~5 seconds
- **Build**: ~2 seconds
- **Validation**: ~1 second
- **Commit**: ~2 seconds
- **Tag**: ~1 second
- **Push**: ~10 seconds (if using --push)

**Total**: ~20 seconds without push, ~30 seconds with push.

## Post-Release

After releasing:

1. **Verify on GitHub** - Check that the tag and release appear on GitHub
2. **Monitor announcement** - Watch the announcement appear in the extension
3. **Check for issues** - Monitor GitHub issues for any problems
4. **Update documentation** - Update any relevant docs if needed

## Rollback

If you need to rollback a release:

```bash
# Delete the tag locally
git tag -d v{version}

# Delete the tag remotely
git push origin :refs/tags/v{version}

# Revert the commit
git revert HEAD

# Push the revert
git push origin main
```

## Automation

The release pipeline is designed to be fully automated. No manual JSON editing, no manual validation, and no forgotten version updates.

The only manual steps are:
1. Updating the version in manifest.json
2. Updating CHANGELOG.md
3. Writing the announcement in Markdown

Everything else is handled by the release script.

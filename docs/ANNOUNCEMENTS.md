# Announcements System

This document explains how to create, build, and publish announcements for GPT-Nexus.

## Overview

Announcements are authored in Markdown files with YAML front matter. A build script converts these Markdown files into the JSON format consumed by the extension.

**Key benefit:** You never need to manually edit `announcements.json` again. Write in Markdown, run the build script, and the JSON is generated automatically.

## Directory Structure

```
chatgpt-nexus/
├── announcements/
│   ├── current.md          # Current announcement (recommended)
│   ├── 2.0.1.md            # Versioned announcement (alternative)
│   └── assets/             # Images referenced in announcements
│       └── banner-2.0.1.png
├── scripts/
│   └── build-announcement.js
└── docs/
    └── ANNOUNCEMENTS.md    # This file
```

## Creating an Announcement

### Step 1: Create or Edit the Markdown File

Navigate to the `announcements/` directory and create or edit `current.md`:

```bash
# Edit the current announcement
vim announcements/current.md

# Or create a versioned file
vim announcements/2.0.1.md
```

### Step 2: Add YAML Front Matter

Every announcement file must start with YAML front matter between `---` delimiters:

```yaml
---
id: 2.0.1-release
version: 2.0.1
type: release
priority: high
title: GPT-Nexus 2.0.1
summary: Night Sky, premium themes and visual improvements.
publishedAt: 2026-08-04T18:00:00Z
primaryImageUrl: assets/banner-2.0.1.png

actions:
  - label: View Changelog
    type: url
    target: https://github.com/roonakyadav/chatgpt-nexus/releases

  - label: Try Visual Effects
    type: internal
    target: appearance.visualEffects
---
```

### Step 3: Add Markdown Content

After the front matter, add your announcement body in Markdown:

```markdown
# Welcome to GPT-Nexus 2.0.1

We're excited to introduce **Night Sky**, our premium dark theme.

## What's New

### 🌙 Night Sky Theme
A beautiful, deep dark theme designed for long coding sessions.

### ✨ Visual Effects
New visual effects engine with smooth animations.

## Improvements

- **Performance**: 40% faster rendering
- **Accessibility**: Better keyboard navigation

Thank you for using GPT-Nexus!
```

## Front Matter Fields

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier for the announcement. Bumping this re-pops the bubble for all users. |
| `title` | string | Announcement title (displayed in modal header). |
| `summary` | string | Short preview text (displayed in bubble and as highlighted subtitle). |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `version` | string | Version label (e.g., "2.0.1"). Displayed next to title. |
| `type` | string | Announcement type. Controls icon and badge. See [Types](#types). |
| `priority` | string | Display behavior. See [Priorities](#priorities). |
| `publishedAt` | string | ISO 8601 timestamp (e.g., "2026-08-04T18:00:00Z"). |
| `primaryImageUrl` | string | URL to hero image (relative to repo root). |
| `actions` | array | Action buttons. See [Actions](#actions). |

## Types

The `type` field controls the icon and badge displayed in the modal header.

| Type | Icon | Badge | Use Case |
|------|------|-------|----------|
| `release` | 🚀 | Release | New version releases |
| `tip` | 💡 | Tip | Tips and tricks |
| `bugfix` | 🐞 | Bug Fix | Bug fix announcements |
| `warning` | ⚠️ | Warning | Important warnings |
| `community` | ❤️ | Community | Community updates |
| `info` | ℹ️ | Info | General information (default) |

If omitted, defaults to `info`.

## Priorities

The `priority` field controls how the announcement is displayed.

| Priority | Bubble | Unread Dot | Auto-Open | Use Case |
|----------|--------|------------|-----------|----------|
| `low` | Never | Yes | Never | Minor updates |
| `normal` | Yes | Yes | Never | Standard announcements (default) |
| `high` | Yes | Yes | Once | Important updates |
| `critical` | Never | Yes | Until seen | Urgent announcements |

If omitted, defaults to `normal`.

## Actions

The `actions` field defines buttons displayed at the bottom of the modal.

### Action Structure

```yaml
actions:
  - label: Button Label
    type: url
    target: https://example.com
```

### Action Types

#### `url` - External Links

Opens an external URL in a new tab.

```yaml
- label: View Changelog
  type: url
  target: https://github.com/roonakyadav/chatgpt-nexus/releases
```

#### `internal` - Extension Navigation

Navigates to extension features.

```yaml
- label: Try Visual Effects
  type: internal
  target: appearance.visualEffects
```

**Supported internal targets:**

- `appearance.visualEffects` - Opens extension options (visual effects)
- `appearance.themes` - Opens extension options (themes)
- `about` - Opens extension options (about)
- `promptManager` - Opens prompt manager (already on ChatGPT page)
- `announcementHistory` - Future placeholder

### Action Limits

- Maximum 3 actions per announcement
- First action is styled as primary (filled button)
- Remaining actions are styled as secondary (outlined buttons)

## Adding Images

### Hero Images

Add a `primaryImageUrl` field pointing to your image:

```yaml
primaryImageUrl: assets/banner-2.0.1.png
```

**Image requirements:**

- Store images in `announcements/assets/` or use absolute URLs
- Recommended size: 1200x400px
- Supported formats: PNG, JPG, WebP
- Images are lazy-loaded with skeleton animation
- Rounded corners applied automatically

### Markdown Images

You can also include images in the Markdown body:

```markdown
![Feature screenshot](assets/screenshot.png)
```

## Building the Announcement

### Build Command

```bash
npm run build:announcement
```

### What the Build Script Does

1. Reads the markdown file from `announcements/current.md` (or the first `.md` file found)
2. Parses the YAML front matter
3. Validates required fields
4. Validates priority, type, and action values
5. Converts the markdown body to `bodyMarkdown`
6. Generates `announcements.json` in the project root
7. Outputs success message with announcement details

### Validation Errors

The build will fail with helpful errors if:

- Missing required fields (`id`, `title`, `summary`)
- Invalid priority (must be: `low`, `normal`, `high`, `critical`)
- Invalid type (must be: `release`, `tip`, `bugfix`, `warning`, `community`, `info`)
- Invalid action type (must be: `url`, `internal`)
- Malformed front matter
- Missing markdown content after front matter

Example error output:

```
❌ Validation errors:
   - Missing required field: id
   - Invalid priority: urgent. Must be one of: low, normal, high, critical
```

## Publishing

### Step 1: Build the Announcement

```bash
npm run build:announcement
```

### Step 2: Commit the Changes

```bash
git add announcements/current.md announcements.json
git commit -m "feat: add 2.0.1 release announcement"
```

### Step 3: Push to GitHub

```bash
git push origin main
```

### Step 4: Verify

The announcement will be fetched from:
```
https://raw.githubusercontent.com/roonakyadav/chatgpt-nexus/refs/heads/main/announcements.json
```

Users will see the announcement based on the priority settings:
- **Normal/High**: Bubble appears once, red dot until dismissed
- **Critical**: Modal auto-opens until dismissed
- **Low**: Only red dot, no bubble

## Versioning Announcements

### Option 1: Use `current.md` (Recommended)

Always edit `announcements/current.md`. When you want to publish a new announcement:

1. Replace the content of `current.md` with the new announcement
2. Build: `npm run build:announcement`
3. Commit and push

### Option 2: Use Versioned Files

Create versioned files like `2.0.1.md`, `2.0.2.md`, etc. The build script will use the first `.md` file it finds.

To switch announcements:

1. Create new version file: `announcements/2.0.2.md`
2. Remove or rename old file
3. Build: `npm run build:announcement`
4. Commit and push

## Best Practices

### Writing Effective Announcements

1. **Keep it concise**: Users scan announcements quickly
2. **Use clear headings**: Structure with H2/H3 headers
3. **Highlight key points**: Use bold for important information
4. **Include actions**: Give users clear next steps
5. **Add visuals**: Hero images make announcements more engaging

### Priority Guidelines

- Use `critical` sparingly - only for urgent security or breaking changes
- Use `high` for major feature releases or important updates
- Use `normal` for standard release notes and feature announcements
- Use `low` for minor tips, community updates, or non-essential information

### Type Guidelines

- Use `release` for version releases
- Use `bugfix` for bug fix announcements
- Use `warning` for important warnings or deprecations
- Use `community` for community spotlights or contributions
- Use `tip` for tips and tricks
- Use `info` for general information

## Troubleshooting

### Build Fails

**Error:** "No valid YAML front matter found"

**Solution:** Ensure your file starts with `---` and ends front matter with `---` on its own line.

**Error:** "Missing required field: id"

**Solution:** Add the `id` field to your front matter.

### Announcement Not Showing

**Check:**
1. Did you run `npm run build:announcement`?
2. Did you commit and push `announcements.json`?
3. Is the `id` different from the previous announcement?
4. Check browser console for errors
5. Wait up to 30 minutes for cache to refresh (or force refresh by clicking megaphone)

### Image Not Loading

**Check:**
1. Is the image path correct relative to the repo root?
2. Is the image committed to the repository?
3. Is the image URL publicly accessible?
4. Check browser network tab for 404 errors

## Example Complete Announcement

```markdown
---
id: 2.0.1-release
version: 2.0.1
type: release
priority: high
title: GPT-Nexus 2.0.1
summary: Night Sky, premium themes and visual improvements.
publishedAt: 2026-08-04T18:00:00Z
primaryImageUrl: assets/banner-2.0.1.png

actions:
  - label: View Changelog
    type: url
    target: https://github.com/roonakyadav/chatgpt-nexus/releases

  - label: Try Visual Effects
    type: internal
    target: appearance.visualEffects
---

# Welcome to GPT-Nexus 2.0.1

We're excited to introduce **Night Sky**, our premium dark theme.

## What's New

### 🌙 Night Sky Theme
A beautiful, deep dark theme designed for long coding sessions.

### ✨ Visual Effects
New visual effects engine with smooth animations.

## Improvements

- **Performance**: 40% faster rendering
- **Accessibility**: Better keyboard navigation

Thank you for using GPT-Nexus!
```

## Technical Details

### Output Format

The build script generates `announcements.json` in this format:

```json
{
  "v": 1,
  "current": {
    "id": "2.0.1-release",
    "version": "2.0.1",
    "title": "GPT-Nexus 2.0.1",
    "summary": "Night Sky, premium themes and visual improvements.",
    "bodyMarkdown": "# Welcome to GPT-Nexus 2.0.1\n\n...",
    "publishedAt": "2026-08-04T18:00:00Z",
    "primaryImageUrl": "assets/banner-2.0.1.png",
    "type": "release",
    "priority": "high",
    "actions": [
      {
        "label": "View Changelog",
        "type": "url",
        "target": "https://github.com/roonakyadav/chatgpt-nexus/releases"
      }
    ]
  }
}
```

This matches the schema consumed by the extension's announcement system.

### Runtime Behavior

The extension runtime does not know Markdown exists. It only consumes the generated `announcements.json` file. The Markdown authoring workflow is purely a developer convenience.

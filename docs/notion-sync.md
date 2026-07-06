# Notion Sync

This site treats Notion as the source CMS and Astro as the static renderer. The sync scripts use the Notion Block API, convert database properties to MDX frontmatter, recursively convert page block children to MDX, and download Notion image/file assets into `public/notion-assets/{slug}/`.

## Notion setup

1. Create a Notion integration at <https://www.notion.so/my-integrations>.
2. Copy the internal integration token.
3. Open each source database in Notion and share it with the integration.
4. For the default `data-source` mode, copy each source's Data Source ID.

For `NOTION_API_MODE=data-source`, use Data Source IDs, not Database IDs.
Do not paste a Data Source ID into `NOTION_PROJECTS_DATABASE_ID` or `NOTION_NOTES_DATABASE_ID`.

## Environment

Copy `.env.example` to `.env` and fill the values:

```bash
NOTION_API_TOKEN=
NOTION_VERSION=2026-03-11
NOTION_API_MODE=data-source

# Data Source IDs for Notion API 2025-09-03+
NOTION_PROJECTS_DATA_SOURCE_ID=
NOTION_NOTES_DATA_SOURCE_ID=

# Optional legacy database mode only
# NOTION_PROJECTS_DATABASE_ID=
# NOTION_NOTES_DATABASE_ID=
# later
NOTION_BLOG_DATA_SOURCE_ID=
```

The token is only read by local Node scripts. It is not used in browser code.

The sync scripts keep legacy database mode for older integrations:

- `NOTION_API_MODE=data-source`: uses `NOTION_*_DATA_SOURCE_ID`
- `NOTION_API_MODE=database`: uses `NOTION_*_DATABASE_ID`

## Required properties

Projects should include:

- `Name` or `Title`
- `Slug` optional; generated from title when missing
- `Published` or `Public` checkbox, or `Status`/`Visibility` select/status with `Published` or `Public`
- `Featured`, `Status`, `Group`, `Domain`, `Tags`, `Stack`, `Roles`, `Related Notes`
- Optional URL fields: `Repo`, `Deploy`, `Demo`

Lab Notes should include:

- `Name` or `Title`
- `Slug` optional; generated from title when missing
- `Published` or `Public` checkbox, or `Status`/`Visibility` select/status with `Published` or `Public`
- `Type`, `Status`, `Domain`, `Methods`, `Date`, `Related Project`, `Related Notes`, `Tags`

If a publish property is present, only public/published pages are synced. If no publish property exists, the script does not add a Notion query filter.

## Commands

```bash
npm run sync:notion
npm run sync:notion:projects
npm run sync:notion:notes
npm run sync:notion:blog
npm run notion:debug
```

Default sync targets:

- Projects data source -> `src/content/projects/*.mdx`
- Lab Notes data source -> `src/content/notes/*.mdx`

Generated MDX includes `generated: true` and:

```mdx
{/* This file is generated from Notion. Do not edit directly. */}
```

Projects and notes are generated content. Existing generated files are overwritten. Existing manual files are backed up to `*.mdx.backup-{timestamp}` before overwrite, but the repository should not keep seed project or note MDX once Notion is the source of truth.

## Assets

Image and file blocks are downloaded at sync time:

```text
public/notion-assets/{slug}/{blockId}.{ext}
```

MDX references images with site-root paths such as:

```mdx
<figure>
  <img src="/notion-assets/example-slug/blockid.png" alt="Caption" />
  <figcaption>Caption</figcaption>
</figure>
```

If an external asset cannot be downloaded, the generated MDX keeps the original URL and adds a TODO comment.

## Supported blocks

The converter supports paragraphs, headings, bulleted and numbered lists, to-do items, toggles, quotes, callouts, code, dividers, images, files, bookmarks, link previews, tables, table rows, and child pages. Unsupported blocks are left as MDX comments so they are visible during review.

## Adding Blog later

1. Add `NOTION_BLOG_DATA_SOURCE_ID` to `.env`.
2. Add an Astro `blog` content collection in `src/content/config.ts`.
3. Run `npm run sync:notion:blog`.
4. Review generated files in `src/content/blog/*.mdx` and commit them with any downloaded assets.

## GitHub Actions sync

`.github/workflows/sync-notion.yml` runs on a daily schedule and can also be started manually. Add these repository secrets:

```bash
NOTION_API_TOKEN
NOTION_PROJECTS_DATA_SOURCE_ID
NOTION_NOTES_DATA_SOURCE_ID
```

For legacy database mode only, use `NOTION_API_MODE=database` and provide:

```bash
NOTION_PROJECTS_DATABASE_ID
NOTION_NOTES_DATABASE_ID
```

The GitHub Actions workflow sets `NOTION_VERSION=2026-03-11` and `NOTION_API_MODE=data-source`.

The workflow runs `notion:debug`, syncs Notion MDX/assets, runs `check` and `build`, then commits changes under `src/content/projects`, `src/content/notes`, and `public/notion-assets`.

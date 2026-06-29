import { listBlockChildren, notion, type AnyNotionObject, type SyncTargetKey } from './notion-client';
import { downloadNotionAsset } from './notion-assets';
import { escapeMarkdownInline, escapeMdxAttribute, richTextToMarkdown, richTextToPlain } from './notion-rich-text';

type Frontmatter = Record<string, unknown>;

const statusValues = ['seed', 'growing', 'stable', 'archived'] as const;
const projectGroups = ['research', 'ml', 'product', 'archived'] as const;
const noteTypes = ['weekly-brief', 'paper-review', 'experiment-log', 'implementation-note', 'learning-note', 'retrospective'] as const;

export async function pageToMdx(page: AnyNotionObject, target: SyncTargetKey) {
  const title = getTitle(page.properties);
  const explicitSlug = getPropertyText(page.properties, ['Slug', 'slug']);
  const slug = explicitSlug ? slugify(explicitSlug, page.id) : slugify(title, page.id);
  const frontmatter = await buildFrontmatter(page, target, title, slug);
  const body = await blocksToMdx(page.id, slug);

  return {
    slug,
    mdx: renderMdx(frontmatter, body),
  };
}

export function shouldSyncPage(page: AnyNotionObject, target: SyncTargetKey) {
  if (target !== 'projects') return true;

  const properties = page.properties || {};
  const title = getTitle(properties);
  const titleSlug = slugify(title, page.id);
  const status = getPropertyText(properties, ['Status', 'State']);
  const type = getPropertyText(properties, ['Group', 'Type', '타입']);
  const summary = getPropertyText(properties, ['Summary', 'Description', 'Problem', 'One-liner', '문제-해결 one-liner']);
  const stack = getPropertyList(properties, ['Stack', 'Stacks', 'Tech Stack', 'Technologies', '스택 stack']);
  const roles = getPropertyList(properties, ['Roles', 'Role', '역할 role']);
  const domain = getPropertyList(properties, ['Domain', 'Domains', 'Tags']);
  const links = [
    getPropertyUrl(properties, ['Repo', 'Repository', 'Git Repository', 'GitHub']),
    getPropertyUrl(properties, ['Deploy', 'Deployment', '배포 Deploy']),
    getPropertyUrl(properties, ['Demo', 'Demonstration', '시연 및 소개 Demonstration']),
  ];
  const normalizedMarkers = [status, type].map((value) => slugify(value));

  if (!title || title === 'Untitled' || titleSlug.startsWith('notion-')) return false;
  if (normalizedMarkers.some((value) => value === 'idea')) return false;

  return Boolean(
    summary
    || stack.length > 0
    || roles.length > 0
    || domain.length > 0
    || links.some(Boolean)
  );
}

export async function blocksToMdx(blockId: string, slug: string): Promise<string> {
  const blocks = await listBlockChildren(blockId);
  const lines: string[] = [];

  for (const block of blocks) {
    const mdx = await blockToMdx(block, slug);
    if (mdx) lines.push(mdx);
  }

  return lines.join('\n\n').trim();
}

async function blockToMdx(block: AnyNotionObject, slug: string): Promise<string> {
  const value = block[block.type] || {};

  switch (block.type) {
    case 'paragraph':
      return withChildren(richTextToMarkdown(value.rich_text), block, slug);
    case 'heading_1':
      return `# ${escapeMarkdownInline(richTextToPlain(value.rich_text))}`;
    case 'heading_2':
      return `## ${escapeMarkdownInline(richTextToPlain(value.rich_text))}`;
    case 'heading_3':
      return `### ${escapeMarkdownInline(richTextToPlain(value.rich_text))}`;
    case 'bulleted_list_item':
      return listItem('-', value.rich_text, block, slug);
    case 'numbered_list_item':
      return listItem('1.', value.rich_text, block, slug);
    case 'to_do':
      return listItem(`- [${value.checked ? 'x' : ' '}]`, value.rich_text, block, slug);
    case 'toggle':
      return detailsBlock(value.rich_text, block, slug);
    case 'quote':
      return quoteBlock(value.rich_text, block, slug);
    case 'callout':
      return calloutBlock(value.rich_text, block, slug);
    case 'code':
      return codeBlock(value);
    case 'divider':
      return '---';
    case 'image':
      return assetBlockToMdx(block, value, slug, 'image');
    case 'file':
    case 'pdf':
      return assetBlockToMdx(block, value, slug, 'file');
    case 'bookmark':
    case 'link_preview':
      return linkBlock(value);
    case 'table':
      return tableBlock(block, value, slug);
    case 'table_row':
      return tableRow(value);
    case 'child_page':
      return `## ${escapeMarkdownInline(value.title || 'Child page')}`;
    case 'unsupported':
      return `{/* Unsupported Notion block skipped: ${block.id} */}`;
    default:
      return value.rich_text
        ? withChildren(richTextToMarkdown(value.rich_text), block, slug)
        : `{/* Unsupported Notion block type: ${block.type} (${block.id}) */}`;
  }
}

async function withChildren(markdown: string, block: AnyNotionObject, slug: string) {
  const child = block.has_children ? await blocksToMdx(block.id, slug) : '';
  return [markdown, child].filter(Boolean).join('\n\n');
}

async function listItem(marker: string, richText: AnyNotionObject[] = [], block: AnyNotionObject, slug: string) {
  const child = block.has_children ? await blocksToMdx(block.id, slug) : '';
  const text = richTextToMarkdown(richText);
  return `${marker} ${text}${child ? `\n${indent(child, '  ')}` : ''}`;
}

async function detailsBlock(richText: AnyNotionObject[] = [], block: AnyNotionObject, slug: string) {
  const summary = escapeMdxAttribute(richTextToPlain(richText) || 'Toggle');
  const child = block.has_children ? await blocksToMdx(block.id, slug) : '';
  return `<details>\n  <summary>${summary}</summary>\n\n${child}\n</details>`;
}

async function quoteBlock(richText: AnyNotionObject[] = [], block: AnyNotionObject, slug: string) {
  const child = block.has_children ? await blocksToMdx(block.id, slug) : '';
  const content = [richTextToMarkdown(richText), child].filter(Boolean).join('\n\n');
  return prefixLines(content, '> ');
}

async function calloutBlock(richText: AnyNotionObject[] = [], block: AnyNotionObject, slug: string) {
  const child = block.has_children ? await blocksToMdx(block.id, slug) : '';
  const content = [richTextToMarkdown(richText), child].filter(Boolean).join('\n\n');
  return prefixLines(content, '> ');
}

function codeBlock(value: AnyNotionObject) {
  const language = String(value.language || '').replace(/[^a-zA-Z0-9_+-]/g, '');
  return `\`\`\`${language}\n${richTextToPlain(value.rich_text)}\n\`\`\``;
}

async function assetBlockToMdx(block: AnyNotionObject, value: AnyNotionObject, slug: string, kind: 'image' | 'file') {
  const sourceUrl = value.type === 'external' ? value.external?.url : value.file?.url;
  if (!sourceUrl) return `{/* TODO: Notion ${kind} block has no downloadable URL: ${block.id} */}`;

  const caption = richTextToPlain(value.caption || []);
  const fallbackCaption = caption || "Source: author's Notion note";
  const asset = await downloadNotionAsset(sourceUrl, slug, block.id);
  const sourceComment = asset.downloaded ? '' : `\n{/* TODO: Asset download failed (${asset.error}); source left as original URL. */}`;

  if (kind === 'file') {
    return `<figure>${sourceComment}\n  <a href="${escapeMdxAttribute(asset.src)}">${escapeMdxAttribute(caption || asset.filename)}</a>\n  <figcaption>${escapeMdxAttribute(fallbackCaption)}</figcaption>\n</figure>`;
  }

  return `<figure>${sourceComment}\n  <img src="${escapeMdxAttribute(asset.src)}" alt="${escapeMdxAttribute(fallbackCaption)}" />\n  <figcaption>${escapeMdxAttribute(fallbackCaption)}</figcaption>\n</figure>`;
}

function linkBlock(value: AnyNotionObject) {
  const url = value.url || value.link_preview?.url;
  return url ? `[${escapeMarkdownInline(url)}](${url})` : '';
}

async function tableBlock(block: AnyNotionObject, value: AnyNotionObject, _slug: string) {
  const rows = block.has_children ? await listBlockChildren(block.id) : [];
  const renderedRows = rows.filter((row) => row.type === 'table_row').map((row) => tableRow(row.table_row));
  if (renderedRows.length === 0) return '';

  const firstRowCellCount = renderedRows[0].split('|').length - 2;
  const separator = `| ${Array.from({ length: Math.max(firstRowCellCount, 1) }, () => '---').join(' | ')} |`;

  if (value.has_column_header) {
    return [renderedRows[0], separator, ...renderedRows.slice(1)].join('\n');
  }

  return [separator, ...renderedRows].join('\n');
}

function tableRow(value: AnyNotionObject) {
  const cells = (value.cells || []).map((cell: AnyNotionObject[]) => richTextToMarkdown(cell).replace(/\|/g, '\\|'));
  return `| ${cells.join(' | ')} |`;
}

async function buildFrontmatter(page: AnyNotionObject, target: SyncTargetKey, title: string, slug: string): Promise<Frontmatter> {
  const properties = page.properties || {};
  const relatedNotes = await getPropertyReferenceSlugs(properties, ['Related Notes', 'Related Note']);
  const common = {
    title,
    slug,
    generated: true,
    status: normalizeStatus(getPropertyText(properties, ['Status', 'State'])),
    domain: getPropertyList(properties, ['Domain', 'Domains', 'Tags']),
    tags: getPropertyList(properties, ['Tags']),
    relatedNotes,
    summary: getPropertyText(properties, ['Summary', 'Description', 'Problem', 'One-liner', '문제-해결 one-liner']),
  };

  if (target === 'projects') {
    return {
      ...common,
      group: normalizeProjectGroup(getPropertyText(properties, ['Group', 'Type', '타입'])),
      program: emptyToUndefined(getPropertyText(properties, ['Program', 'Research Program'])),
      stack: getPropertyList(properties, ['Stack', 'Stacks', 'Tech Stack', 'Technologies', '스택 stack']),
      roles: getPropertyList(properties, ['Roles', 'Role', '역할 role']),
      dataset: emptyToUndefined(getPropertyText(properties, ['Dataset', 'Period', '시작일 종료일'])),
      output: emptyToUndefined(getPropertyText(properties, ['Output', 'Result', 'Type', '타입'])),
      repo: getPropertyUrl(properties, ['Repo', 'Repository', 'Git Repository', 'GitHub']),
      repoPrivate: getPropertyCheckbox(properties, ['Repo Private', 'Private Repo']),
      deploy: getPropertyUrl(properties, ['Deploy', 'Deployment', '배포 Deploy']),
      demo: getPropertyUrl(properties, ['Demo', 'Demonstration', '시연 및 소개 Demonstration']),
      notion: page.url || '',
      relatedNotes: common.relatedNotes,
      featured: getPropertyCheckbox(properties, ['Featured']) || false,
      problem: common.summary,
    };
  }

  if (target === 'notes') {
    const relatedProject = await getPropertyReferenceSlugs(properties, ['Related Project', 'Project']);
    const sourceNotes = await getPropertyReferenceSlugs(properties, ['Source Notes', 'Source Note']);

    return {
      ...common,
      type: normalizeNoteType(getPropertyText(properties, ['Type'])),
      methods: getPropertyList(properties, ['Methods', 'Method']),
      date: getPropertyDate(properties, ['Date']) || page.created_time?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      readTime: getPropertyNumber(properties, ['Read Time', 'ReadTime']),
      relatedProject: relatedProject[0] || getPropertyText(properties, ['Related Project', 'Project']),
      relatedNotes: common.relatedNotes,
      sourceNotes,
      trackedFields: getPropertyList(properties, ['Tracked Fields']),
      outputs: getPropertyList(properties, ['Outputs']),
      selectedForReview: emptyToUndefined(getPropertyText(properties, ['Selected For Review'])),
      next: emptyToUndefined(getPropertyText(properties, ['Next'])),
      notion: page.url || '',
    };
  }

  return {
    ...common,
    date: getPropertyDate(properties, ['Date', 'Published Date']) || page.created_time?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    featured: getPropertyCheckbox(properties, ['Featured']) || false,
    notion: page.url || '',
  };
}

function renderMdx(frontmatter: Frontmatter, body: string) {
  const yaml = Object.entries(frontmatter)
    .filter(([, value]) => value !== undefined && value !== '' && !(Array.isArray(value) && value.length === 0))
    .map(([key, value]) => `${key}: ${yamlValue(value)}`)
    .join('\n');

  const content = body || '{/* TODO: Add Notion page content. */}';
  return `---\n${yaml}\n---\n\n{/* This file is generated from Notion. Do not edit directly. */}\n\n${content.trim()}\n`;
}

function getProperty(properties: AnyNotionObject = {}, names: string[]) {
  const normalizedNames = names.map(normalizePropertyName);
  return Object.entries<AnyNotionObject>(properties).find(([name]) => normalizedNames.includes(normalizePropertyName(name)))?.[1];
}

function getTitle(properties: AnyNotionObject = {}) {
  const named = getProperty(properties, ['Title', 'Name', 'Project', 'Project Name', '프로젝트 이름']);
  const property = named || Object.values<AnyNotionObject>(properties).find((item) => item.type === 'title');
  return richTextToPlain(property?.title || []) || 'Untitled';
}

function getPropertyText(properties: AnyNotionObject, names: string[]) {
  const property = getProperty(properties, names);
  if (!property) return '';
  if (property.type === 'title') return richTextToPlain(property.title);
  if (property.type === 'rich_text') return richTextToPlain(property.rich_text);
  if (property.type === 'select') return property.select?.name || '';
  if (property.type === 'status') return property.status?.name || '';
  if (property.type === 'multi_select') return property.multi_select?.map((item: AnyNotionObject) => item.name).join(', ') || '';
  if (property.type === 'url') return property.url || '';
  if (property.type === 'date') return property.date?.start || '';
  if (property.type === 'number') return String(property.number ?? '');
  if (property.type === 'relation') return property.relation?.map((item: AnyNotionObject) => item.id).join(', ') || '';
  return '';
}

function getPropertyList(properties: AnyNotionObject, names: string[]) {
  const property = getProperty(properties, names);
  if (!property) return [];
  if (property.type === 'multi_select') return property.multi_select?.map((item: AnyNotionObject) => item.name) || [];
  if (property.type === 'select') return property.select?.name ? [property.select.name] : [];
  if (property.type === 'status') return property.status?.name ? [property.status.name] : [];
  if (property.type === 'relation') return property.relation?.map((item: AnyNotionObject) => item.id) || [];
  return splitList(getPropertyText(properties, names));
}

async function getPropertyReferenceSlugs(properties: AnyNotionObject, names: string[]) {
  const property = getProperty(properties, names);
  if (!property || property.type !== 'relation') return getPropertyList(properties, names);

  const slugs = await Promise.all((property.relation || []).map(async (reference: AnyNotionObject) => {
    const page = await retrievePage(reference.id);
    const pageProperties = page?.properties || {};
    const title = getTitle(pageProperties);
    return slugify(getPropertyText(pageProperties, ['Slug', 'slug']) || title || reference.id);
  }));

  return slugs.filter(Boolean);
}

const pageCache = new Map<string, AnyNotionObject>();

async function retrievePage(pageId: string) {
  if (pageCache.has(pageId)) return pageCache.get(pageId);
  const page = await notion.pages.retrieve({ page_id: pageId }) as AnyNotionObject;
  pageCache.set(pageId, page);
  return page;
}

function getPropertyUrl(properties: AnyNotionObject, names: string[]) {
  const value = getPropertyText(properties, names).trim();
  return value.startsWith('http') ? value : '';
}

function getPropertyDate(properties: AnyNotionObject, names: string[]) {
  const property = getProperty(properties, names);
  if (property?.type === 'date') return property.date?.start || '';
  return getPropertyText(properties, names);
}

function getPropertyNumber(properties: AnyNotionObject, names: string[]) {
  const property = getProperty(properties, names);
  if (property?.type === 'number') return property.number ?? undefined;
  const value = Number(getPropertyText(properties, names));
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function getPropertyCheckbox(properties: AnyNotionObject, names: string[]) {
  const property = getProperty(properties, names);
  return property?.type === 'checkbox' ? Boolean(property.checkbox) : undefined;
}

function normalizeStatus(value: string) {
  const normalized = slugify(value);
  if (statusValues.includes(normalized as any)) return normalized;
  if (['done', 'complete', 'completed', 'published', 'public'].includes(normalized)) return 'stable';
  if (['active', 'progress', 'wip'].includes(normalized)) return 'growing';
  if (['archive', 'old'].includes(normalized)) return 'archived';
  return 'seed';
}

function normalizeProjectGroup(value: string) {
  const normalized = slugify(value);
  if (projectGroups.includes(normalized as any)) return normalized;
  if (normalized.includes('research')) return 'research';
  if (normalized.includes('ml') || normalized.includes('machine-learning') || normalized.includes('data')) return 'ml';
  if (normalized.includes('archive')) return 'archived';
  return 'product';
}

function normalizeNoteType(value: string) {
  const normalized = slugify(value);
  return noteTypes.includes(normalized as any) ? normalized : 'learning-note';
}

function slugify(value: string, fallbackId = '') {
  const slug = String(value || '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  const compactId = fallbackId.replace(/-/g, '').slice(-12);
  if (slug && !(slug === 'untitled' && compactId)) return slug;
  return compactId ? `notion-${compactId}` : 'untitled';
}

function normalizePropertyName(value: string) {
  return String(value || '').toLowerCase().replace(/[\s_-]+/g, '').trim();
}

function splitList(value: string) {
  return String(value || '').split(/[,/|]/).map((item) => item.trim()).filter(Boolean);
}

function emptyToUndefined(value: string) {
  return value || undefined;
}

function yamlValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.length ? `\n${value.map((item) => `  - ${yamlScalar(item)}`).join('\n')}` : '[]';
  }
  return yamlScalar(value);
}

function yamlScalar(value: unknown) {
  if (typeof value === 'boolean' || typeof value === 'number') return String(value);
  return JSON.stringify(String(value).replace(/\s+/g, ' ').trim());
}

function indent(value: string, prefix: string) {
  return value.split('\n').map((line) => `${prefix}${line}`).join('\n');
}

function prefixLines(value: string, prefix: string) {
  return value.split('\n').map((line) => `${prefix}${line}`).join('\n');
}

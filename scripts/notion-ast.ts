import { downloadNotionAsset } from './notion-assets';
import { listBlockChildren, type AnyNotionObject } from './notion-client';

export type NotionRichText = {
  type: string;
  plainText: string;
  href: string;
  equation: string;
  annotations: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: string;
  };
};

export type NotionAsset = {
  src: string;
  filename: string;
  downloaded: boolean;
  error?: string;
  sourceType: string;
  sourceUrl: string;
};

export type NotionBlockAst = {
  id: string;
  type: string;
  hasChildren: boolean;
  children: NotionBlockAst[];
  richText: NotionRichText[];
  caption: NotionRichText[];
  title: string;
  url: string;
  color: string;
  icon: string;
  checked: boolean;
  language: string;
  expression: string;
  listStartIndex?: number;
  listFormat: string;
  table: {
    hasColumnHeader: boolean;
    hasRowHeader: boolean;
    tableWidth?: number;
  };
  cells: NotionRichText[][];
  widthRatio?: number;
  syncedFromBlockId?: string;
  asset?: NotionAsset;
  raw: AnyNotionObject;
};

export async function fetchNotionBlockAst(blockId: string, slug: string, seen = new Set<string>()): Promise<NotionBlockAst[]> {
  if (seen.has(blockId)) return [];

  const nextSeen = new Set(seen);
  nextSeen.add(blockId);
  const blocks = await listBlockChildren(blockId);
  return normalizeNotionBlocks(blocks, slug, nextSeen);
}

export async function normalizeNotionBlocks(blocks: AnyNotionObject[], slug: string, seen = new Set<string>()): Promise<NotionBlockAst[]> {
  return Promise.all(blocks.map((block) => normalizeNotionBlock(block, slug, seen)));
}

async function normalizeNotionBlock(block: AnyNotionObject, slug: string, seen: Set<string>): Promise<NotionBlockAst> {
  const value = block[block.type] || {};
  const inlineChildren = Array.isArray(block.children)
    ? await normalizeNotionBlocks(block.children, slug, seen)
    : undefined;
  const children = inlineChildren ?? (block.has_children ? await fetchNotionBlockAst(block.id, slug, seen) : []);
  const asset = isAssetBlock(block.type) ? await notionAsset(block, value, slug) : undefined;

  return {
    id: block.id || '',
    type: block.type || 'unsupported',
    hasChildren: Boolean(block.has_children || children.length),
    children,
    richText: normalizeRichText(value.rich_text || []),
    caption: normalizeRichText(value.caption || []),
    title: value.title || '',
    url: value.url || value.link_preview?.url || block.url || '',
    color: value.color || 'default',
    icon: notionIcon(value.icon),
    checked: Boolean(value.checked),
    language: String(value.language || ''),
    expression: String(value.expression || ''),
    listStartIndex: typeof value.list_start_index === 'number' ? value.list_start_index : undefined,
    listFormat: value.list_format || 'numbers',
    table: {
      hasColumnHeader: Boolean(value.has_column_header),
      hasRowHeader: Boolean(value.has_row_header),
      tableWidth: typeof value.table_width === 'number' ? value.table_width : undefined,
    },
    cells: (value.cells || []).map((cell: AnyNotionObject[]) => normalizeRichText(cell)),
    widthRatio: typeof value.width_ratio === 'number' ? value.width_ratio : undefined,
    syncedFromBlockId: value.synced_from?.block_id || undefined,
    asset,
    raw: block,
  };
}

export function normalizeRichText(richText: AnyNotionObject[] = []): NotionRichText[] {
  return richText.map((item) => ({
    type: item.type || 'text',
    plainText: item.plain_text || item.equation?.expression || '',
    href: item.href || item.text?.link?.url || '',
    equation: item.equation?.expression || '',
    annotations: {
      bold: Boolean(item.annotations?.bold),
      italic: Boolean(item.annotations?.italic),
      strikethrough: Boolean(item.annotations?.strikethrough),
      underline: Boolean(item.annotations?.underline),
      code: Boolean(item.annotations?.code),
      color: item.annotations?.color || 'default',
    },
  }));
}

function isAssetBlock(type: string) {
  return ['image', 'file', 'pdf', 'video', 'audio'].includes(type);
}

async function notionAsset(block: AnyNotionObject, value: AnyNotionObject, slug: string): Promise<NotionAsset | undefined> {
  const sourceType = value.type || '';
  const sourceUrl = sourceType === 'external' ? value.external?.url : value.file?.url;
  if (!sourceUrl) return undefined;

  const asset = await downloadNotionAsset(sourceUrl, slug, block.id);
  const keepSourceFallback = sourceType === 'external';
  return {
    ...asset,
    src: asset.downloaded || keepSourceFallback ? asset.src : '',
    sourceType,
    sourceUrl: asset.downloaded ? '' : sourceUrl,
  };
}

function notionIcon(icon: AnyNotionObject | null = {}) {
  if (!icon) return '';
  if (icon.type === 'emoji') return icon.emoji || '';
  if (icon.type === 'external') return icon.external?.url ? 'link' : '';
  if (icon.type === 'file') return 'file';
  return '';
}

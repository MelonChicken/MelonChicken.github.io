import { NotionToMarkdown } from 'notion-to-md';
import { downloadNotionAsset } from './notion-assets';
import { notion, type AnyNotionObject } from './notion-client';

const mediaTypes = ['image', 'file', 'pdf', 'video', 'audio'] as const;

export async function notionPageToMarkdown(pageId: string, slug: string) {
  const n2m = new NotionToMarkdown({
    notionClient: notion,
    config: {
      parseChildPages: false,
      separateChildPage: false,
      convertImagesToBase64: false,
    },
  });

  for (const type of mediaTypes) {
    n2m.setCustomTransformer(type, async (block) => renderMediaBlock(block as AnyNotionObject, type, slug));
  }

  const blocks = await n2m.pageToMarkdown(pageId);
  const markdown = n2m.toMarkdownString(blocks).parent || '';
  return normalizeGeneratedMarkdown(markdown);
}

async function renderMediaBlock(block: AnyNotionObject, type: typeof mediaTypes[number], slug: string) {
  const value = block[type] || {};
  const sourceUrl = value.type === 'external' ? value.external?.url : value.file?.url;
  if (!sourceUrl) return '';

  const caption = (value.caption || []).map((item: AnyNotionObject) => item.plain_text || '').join('').trim();
  const asset = await downloadNotionAsset(sourceUrl, slug, block.id || `${type}-asset`);
  const href = asset.src;
  if (!href) return `> ${escapeMarkdownText(caption || `${type} asset could not be downloaded.`)}`;

  if (type === 'image') {
    const alt = escapeImageAlt(caption || 'Notion image');
    const captionLine = caption ? `\n\n*${escapeMarkdownText(caption)}*` : '';
    return `![${alt}](${href})${captionLine}`;
  }

  const label = escapeMarkdownText(caption || value.name || `Open ${type}`);
  return `[${label}](${href})`;
}

export function normalizeGeneratedMarkdown(markdown: string) {
  return String(markdown || '')
    .replace(/\r\n/g, '\n')
    .replace(/\*{4}/g, '')
    .replace(/[ \t]+$/gm, '')
    .replace(/^ +(?=\t)/gm, '')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

function escapeImageAlt(value: string) {
  return value.replace(/[\\\[\]]/g, '\\$&').replace(/\r?\n/g, ' ');
}

function escapeMarkdownText(value: string) {
  return value.replace(/([\\\[\]])/g, '\\$1').replace(/\r?\n/g, ' ');
}

import { type NotionBlockAst, type NotionRichText } from './notion-ast';

export const SUPPORTED_NOTION_BLOCKS = [
  'paragraph',
  'heading_1',
  'heading_2',
  'heading_3',
  'heading_4',
  'heading_1_toggle',
  'heading_2_toggle',
  'heading_3_toggle',
  'bulleted_list_item',
  'numbered_list_item',
  'to_do',
  'quote',
  'callout',
  'toggle',
  'code',
  'equation',
  'image',
  'file',
  'pdf',
  'video',
  'audio',
  'table',
  'table_row',
  'divider',
  'column_list',
  'column',
  'bookmark',
  'embed',
  'link_preview',
] as const;

const componentImports = [
  "import NotionBookmark from '../../components/notion/NotionBookmark.astro';",
  "import NotionCallout from '../../components/notion/NotionCallout.astro';",
  "import NotionColumns from '../../components/notion/NotionColumns.astro';",
  "import NotionToggle from '../../components/notion/NotionToggle.astro';",
].join('\n');

export function notionMdxImports() {
  return componentImports;
}

export async function renderNotionBlocks(blocks: NotionBlockAst[]): Promise<string> {
  return renderBlocks(blocks);
}

async function renderBlocks(blocks: NotionBlockAst[], listDepth = 0): Promise<string> {
  const chunks: string[] = [];

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    if (isListBlock(block)) {
      const type = block.type;
      const group: NotionBlockAst[] = [block];
      while (index + 1 < blocks.length && blocks[index + 1].type === type) {
        group.push(blocks[index + 1]);
        index += 1;
      }

      chunks.push(await renderList(type, group, listDepth));
      continue;
    }

    const rendered = await renderBlock(block);
    if (rendered) chunks.push(rendered);
  }

  return chunks.join('\n\n').trim();
}

async function renderBlock(block: NotionBlockAst): Promise<string> {
  switch (block.type) {
    case 'paragraph':
      return renderParagraph(block);
    case 'heading_1':
      return heading(1, block.richText);
    case 'heading_2':
      return heading(2, block.richText);
    case 'heading_3':
      return heading(3, block.richText);
    case 'heading_4':
      return heading(4, block.richText);
    case 'heading_1_toggle':
      return renderToggle(block, 1);
    case 'heading_2_toggle':
      return renderToggle(block, 2);
    case 'heading_3_toggle':
      return renderToggle(block, 3);
    case 'numbered_list_item':
      return renderList('numbered_list_item', [block]);
    case 'bulleted_list_item':
      return renderList('bulleted_list_item', [block]);
    case 'to_do':
      return renderTodo(block);
    case 'quote':
      return renderQuote(block);
    case 'callout':
      return renderCallout(block);
    case 'toggle':
      return renderToggle(block);
    case 'code':
      return renderCode(block);
    case 'equation':
      return renderEquation(block);
    case 'image':
      return renderFigure(block, 'img');
    case 'file':
    case 'pdf':
    case 'video':
    case 'audio':
      return renderFile(block);
    case 'table':
      return renderTable(block);
    case 'table_row':
      return renderTableRow(block);
    case 'divider':
      return '---';
    case 'column_list':
      return renderColumns(block);
    case 'column':
      return renderColumn(block);
    case 'bookmark':
    case 'embed':
    case 'link_preview':
      return renderBookmark(block);
    case 'synced_block':
      return block.children.length
        ? renderBlocks(block.children)
        : unsupportedComment(block, `synced_from=${block.syncedFromBlockId || 'none'}`);
    case 'child_page':
      return childReference('Child page', block);
    case 'child_database':
      return childReference('Child database', block);
    case 'table_of_contents':
      return `{/* Notion table_of_contents skipped: site TOC is generated from rendered headings. */}`;
    case 'breadcrumb':
      return unsupportedComment(block, 'site navigation provides breadcrumb context');
    case 'unsupported':
      return unsupportedComment(block);
    default:
      return block.richText.length
        ? renderParagraph(block)
        : unsupportedComment(block);
  }
}

async function renderParagraph(block: NotionBlockAst) {
  const text = renderRichText(block.richText);
  const paragraph = text || '<p class="notion-empty" aria-hidden="true"></p>';
  return appendChildren(paragraph, block);
}

function heading(level: 1 | 2 | 3 | 4, richText: NotionRichText[]) {
  return `${'#'.repeat(level)} ${renderRichText(richText) || 'Untitled'}`;
}

async function renderList(type: 'numbered_list_item' | 'bulleted_list_item', blocks: NotionBlockAst[], listDepth = 0) {
  const start = blocks[0]?.listStartIndex ?? 1;
  const items = await Promise.all(blocks.map((block, index) => renderListItem(type, block, listDepth, start + index)));
  return items.join('\n');
}

async function renderListItem(type: 'numbered_list_item' | 'bulleted_list_item', block: NotionBlockAst, listDepth: number, number: number) {
  const marker = type === 'bulleted_list_item' ? '-' : `${block.listStartIndex ?? number}.`;
  const baseIndent = '    '.repeat(listDepth);
  const text = renderRichText(block.richText);
  const child = block.children.length ? await renderBlocks(block.children) : '';
  return `${baseIndent}${marker} ${text}${child ? `\n${indent(child, '    ')}` : ''}`;
}

async function renderTodo(block: NotionBlockAst) {
  const child = block.children.length ? await renderBlocks(block.children) : '';
  return `- [${block.checked ? 'x' : ' '}] ${renderRichText(block.richText)}${child ? `\n${indent(child, '    ')}` : ''}`;
}

async function renderQuote(block: NotionBlockAst) {
  const child = block.children.length ? await renderBlocks(block.children) : '';
  const content = [renderRichText(block.richText), child].filter(Boolean).join('\n\n');
  return prefixLines(content, '> ');
}

async function renderCallout(block: NotionBlockAst) {
  const child = block.children.length ? await renderBlocks(block.children) : '';
  const content = [renderRichText(block.richText), child].filter(Boolean).join('\n\n');
  return `<NotionCallout icon="${escapeAttr(block.icon)}" color="${escapeAttr(block.color)}">\n\n${content}\n\n</NotionCallout>`;
}

async function renderToggle(block: NotionBlockAst, headingLevel = 0) {
  const child = block.children.length ? await renderBlocks(block.children) : '';
  return `<NotionToggle summary="${escapeAttr(renderPlainText(block.richText) || 'Toggle')}" headingLevel={${headingLevel}}>\n\n${child}\n\n</NotionToggle>`;
}

function renderCode(block: NotionBlockAst) {
  const language = block.language.replace(/[^a-zA-Z0-9_+-]/g, '');
  const code = renderPlainText(block.richText);
  const caption = renderRichText(block.caption);
  return `\`\`\`${language}\n${code}\n\`\`\`${caption ? `\n\n_${caption}_` : ''}`;
}

function renderEquation(block: NotionBlockAst) {
  const expression = block.expression.trim();
  return expression ? `$$\n${expression}\n$$` : '';
}

function renderFigure(block: NotionBlockAst, tag: 'img') {
  if (!block.asset?.src) {
    return block.asset?.error
      ? `{/* TODO: Notion image download failed and expiring Notion URL was not stored: ${block.id} (${block.asset.error}) */}`
      : `{/* TODO: Notion image block has no downloadable URL: ${block.id} */}`;
  }
  const caption = renderRichText(block.caption);
  const alt = escapeAttr(renderPlainText(block.caption) || "Source: author's Notion note");
  const sourceComment = block.asset.downloaded ? '' : `\n{/* TODO: Asset download failed (${block.asset.error}); source left as original URL. */}`;
  return `<figure class="notion-figure">${sourceComment}\n  <${tag} src="${escapeAttr(block.asset.src)}" alt="${alt}" />\n  <figcaption>${caption || escapeHtml("Source: author's Notion note")}</figcaption>\n</figure>`;
}

function renderFile(block: NotionBlockAst) {
  if (!block.asset?.src) {
    return block.asset?.error
      ? `{/* TODO: Notion ${block.type} download failed and expiring Notion URL was not stored: ${block.id} (${block.asset.error}) */}`
      : `{/* TODO: Notion ${block.type} block has no downloadable URL: ${block.id} */}`;
  }
  const caption = renderRichText(block.caption) || escapeHtml(block.asset.filename);
  const sourceComment = block.asset.downloaded ? '' : `\n{/* TODO: Asset download failed (${block.asset.error}); source left as original URL. */}`;
  return `<figure class="notion-figure notion-file">${sourceComment}\n  <a href="${escapeAttr(block.asset.src)}">${caption}</a>\n  <figcaption>${caption}</figcaption>\n</figure>`;
}

function renderTable(block: NotionBlockAst) {
  const rows = block.children.filter((child) => child.type === 'table_row').map((row) => renderTableRow(row, block));
  if (!rows.length) return '';
  const firstRowCellCount = rows[0].split('|').length - 2;
  const separator = `| ${Array.from({ length: Math.max(firstRowCellCount, 1) }, () => '---').join(' | ')} |`;
  return block.table.hasColumnHeader
    ? [rows[0], separator, ...rows.slice(1)].join('\n')
    : [separator, ...rows].join('\n');
}

function renderTableRow(block: NotionBlockAst, table?: NotionBlockAst) {
  const cells = block.cells.map((cell, index) => {
    const content = renderRichText(cell).replace(/\|/g, '\\|');
    return table?.table.hasRowHeader && index === 0 ? `<strong>${content}</strong>` : content;
  });
  return `| ${cells.join(' | ')} |`;
}

async function renderColumns(block: NotionBlockAst) {
  const columns = await Promise.all(block.children.map(renderColumn));
  return `<NotionColumns>\n\n${columns.join('\n\n')}\n\n</NotionColumns>`;
}

async function renderColumn(block: NotionBlockAst) {
  const style = block.widthRatio ? ` style="--notion-column-ratio:${block.widthRatio}"` : '';
  const content = block.children.length ? await renderBlocks(block.children) : '';
  return `<div class="notion-column"${style}>\n\n${content}\n\n</div>`;
}

function renderBookmark(block: NotionBlockAst) {
  const href = block.url || renderPlainText(block.richText);
  if (!href) return `{/* Notion ${block.type} block has no URL: ${block.id} */}`;
  return `<NotionBookmark href="${escapeAttr(href)}" label="${escapeAttr(href)}" />`;
}

function childReference(kind: string, block: NotionBlockAst) {
  const label = escapeMarkdownInline(block.title || kind);
  return block.url ? `### [${label}](${escapeUrl(block.url)})` : `### ${label}`;
}

function unsupportedComment(block: NotionBlockAst, detail = '') {
  console.warn(`[notion] Unsupported block: ${block.type} (${block.id})${detail ? ` ${detail}` : ''}`);
  return `{/* TODO(notion): unsupported block type: ${block.type}${detail ? `; ${escapeComment(detail)}` : ''} */}`;
}

async function appendChildren(markdown: string, block: NotionBlockAst) {
  const child = block.children.length ? await renderBlocks(block.children) : '';
  return [markdown, child].filter(Boolean).join('\n\n');
}

export function renderRichText(richText: NotionRichText[]) {
  return richText.map(renderRichTextItem).join('').trim();
}

function renderRichTextItem(item: NotionRichText) {
  if (item.type === 'equation') return mathInline(item.equation || item.plainText);

  let text = escapeHtml(item.plainText).replace(/\$/g, '&#36;').replace(/\n/g, '<br />');
  if (!text) return '';

  if (item.annotations.code) text = `<code>${text.replace(/`/g, '&#96;')}</code>`;
  if (item.annotations.bold) text = `<strong>${text}</strong>`;
  if (item.annotations.italic) text = `<em>${text}</em>`;
  if (item.annotations.strikethrough) text = `<s>${text}</s>`;
  if (item.annotations.underline) text = `<u>${text}</u>`;

  const colorClass = notionColorClass(item.annotations.color);
  text = `<span${colorClass ? ` class="${colorClass}"` : ''}>${text}</span>`;
  if (item.href) text = `<a href="${escapeAttr(item.href)}">${text}</a>`;

  return text;
}

function renderPlainText(richText: NotionRichText[]) {
  return richText.map((item) => item.plainText || item.equation).join('').trim();
}

function notionColorClass(color: string) {
  if (!color || color === 'default') return '';
  return `notion-color-${color.replace(/[^a-zA-Z0-9_-]/g, '')}`;
}

function mathInline(expression: string) {
  const value = expression.trim();
  return value ? `$${value}$` : '';
}

function escapeMarkdownInline(value: string) {
  return value.replace(/([\\`*_{}\[\]()#+.!|$])/g, '\\$1');
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(value: string) {
  return escapeHtml(value).replace(/"/g, '&quot;');
}

function escapeUrl(value: string) {
  return value.replace(/\)/g, '%29');
}

function escapeComment(value: string) {
  return value.replace(/\*\//g, '* /');
}

function indent(value: string, prefix: string) {
  return value.split('\n').map((line) => `${prefix}${line}`).join('\n');
}

function prefixLines(value: string, prefix: string) {
  return value.split('\n').map((line) => `${prefix}${line}`).join('\n');
}

function isListBlock(block: NotionBlockAst): block is NotionBlockAst & { type: 'numbered_list_item' | 'bulleted_list_item' } {
  return block.type === 'numbered_list_item' || block.type === 'bulleted_list_item';
}

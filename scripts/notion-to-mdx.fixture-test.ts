import assert from 'node:assert/strict';
import { NotionMarkdownAdapter } from './notion-markdown-adapter';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import type { MdBlock } from 'notion-to-md/build/types';
import { getNotionBlacklistReason } from './notion-sync-blacklist';

const n2m = new NotionMarkdownAdapter({ notionClient: {} as any });
const annotations = {
  bold: false,
  italic: false,
  strikethrough: false,
  underline: false,
  code: false,
  color: 'default' as const,
};

const processor = await createMarkdownProcessor();
const block = (type: string, parent: string, children: MdBlock[] = []): MdBlock => ({ type, parent, children, blockId: 'fixture' });
const markdown = n2m.toMarkdownString([
  block('numbered_list_item', '1. First', [block('quote', '> Introduction', [
    block('paragraph', '⇒ First paragraph'),
    block('paragraph', 'Second paragraph'),
    block('bulleted_list_item', '- Nested explanation'),
  ])]),
  block('numbered_list_item', '2. Second', [block('quote', '> Another quote')]),
  block('paragraph', 'Parent paragraph', [block('bulleted_list_item', '- Child list')]),
  block('numbered_list_item', '10. Wide marker', [block('quote', '> Tenth quote')]),
]).parent;
const { code: html } = await processor.render(markdown);
assert.doesNotMatch(html, /<pre|<code/);
assert.match(html, /<li>\s*<p>First<\/p>\s*<blockquote>/);
assert.match(html, /First paragraph<\/p>\s*<p>Second paragraph<\/p>\s*<ul>/);
assert.equal((html.match(/<blockquote>/g) || []).length, 3);
const richText = n2m.annotatePlainText('강조', { ...annotations, bold: true, color: 'blue' });
const rendered = await processor.render(`일반${richText}문장 ${n2m.annotatePlainText('**literal** <tag> $5', annotations)}`);
assert.match(rendered.code, /notion-color-blue"><strong>강조<\/strong><\/span>문장/);
assert.doesNotMatch(rendered.code, /<strong>literal|<tag>/);
const codeBlock = await processor.render(n2m.toMarkdownString([
  block('quote', '> Code example', [block('code', '```js\nconst x = 1;\n```')]),
]).parent);
assert.match(codeBlock.code, /<pre/);
const coloredBlock = await n2m.blockToMarkdown({ type: 'paragraph', paragraph: {
  color: 'blue', rich_text: [{ type: 'text', plain_text: 'Block color', annotations }],
} } as any);
assert.match(coloredBlock, /notion-color-blue/);
const emptyBlock = await n2m.blockToMarkdown({ type: 'paragraph', paragraph: { rich_text: [] } } as any);
assert.match(emptyBlock, /notion-empty/);
assert.equal(
  getNotionBlacklistReason({
    target: 'notes',
    title: 'Animal Behaviour Analysis Weekly Brief',
    slug: 'animal-behaviour-analysis-weekly-brief',
    type: 'learning-note',
  }),
  'title:\\bweekly[\\s_-]*(brief|report)\\b',
);
assert.equal(
  getNotionBlacklistReason({
    target: 'notes',
    title: 'Ordinary title',
    slug: 'ordinary-title',
    type: 'weekly-report',
  }),
  'type:weekly-report',
);
assert.equal(
  getNotionBlacklistReason({
    target: 'notes',
    title: 'Reading note',
    slug: 'reading-note',
    type: 'learning-note',
  }),
  '',
);

console.log('notion-to-md adapter assertions passed');

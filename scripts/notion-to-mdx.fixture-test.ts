import assert from 'node:assert/strict';
import { blocksToMdxFromBlocks } from './notion-to-mdx';
import { richTextToMarkdown } from './notion-rich-text';

const rt = (plain_text: string, annotations = {}, extra = {}) => [{ type: 'text', plain_text, annotations, ...extra }];
const block = (id: string, type: string, text = '', children: any[] = [], extra: Record<string, unknown> = {}) => ({
  id,
  type,
  has_children: children.length > 0,
  children,
  [type]: type === 'equation'
    ? { expression: text, ...extra }
    : { rich_text: rt(text), ...extra },
});

const mdx = await blocksToMdxFromBlocks([
  block('a', 'numbered_list_item', 'Parent A', [
    block('a-p', 'paragraph', 'Child paragraph'),
    block('a1', 'numbered_list_item', 'Child A-1', [
      block('a1b1', 'bulleted_list_item', 'Bullet A'),
      block('a1b2', 'bulleted_list_item', 'Bullet B'),
    ]),
    block('a2', 'numbered_list_item', 'Child A-2', [
      block('a2q', 'quote', 'Child quote'),
      block('a2e', 'equation', 'E = mc^2'),
    ]),
  ]),
  block('b', 'numbered_list_item', 'Parent B', [
    block('b1', 'numbered_list_item', 'Child B-1'),
  ]),
  block('sep', 'paragraph', 'break'),
  block('c', 'numbered_list_item', 'Starts at three', [], { list_start_index: 3 }),
  block('todo1', 'to_do', 'Checked task', [], { checked: true }),
  block('todo2', 'to_do', 'Unchecked task', [], { checked: false }),
  block('toggle1', 'toggle', 'Toggle title', [block('toggle-p', 'paragraph', 'Toggle child')]),
  block('callout1', 'callout', 'Callout title', [block('callout-p', 'paragraph', 'Callout child')], {
    icon: { type: 'emoji', emoji: '!' },
    color: 'blue_background',
  }),
  block('table1', 'table', '', [
    { id: 'tr1', type: 'table_row', has_children: false, table_row: { cells: [rt('H1'), rt('H2')] } },
    { id: 'tr2', type: 'table_row', has_children: false, table_row: { cells: [rt('R1'), rt('$ value')] } },
  ], { has_column_header: true, has_row_header: true }),
  block('cols', 'column_list', '', [
    block('col1', 'column', '', [block('col1p', 'paragraph', 'Column one')], { width_ratio: 0.3 }),
    block('col2', 'column', '', [block('col2p', 'paragraph', 'Column two')], { width_ratio: 0.7 }),
  ]),
  { id: 'synced', type: 'synced_block', has_children: false, synced_block: { synced_from: { block_id: 'source' } } },
  { id: 'unsupported', type: 'unsupported', has_children: false, unsupported: {} },
], 'fixture');

assert.match(mdx, /1\. Parent A\n {4}Child paragraph\n {4}\n {4}1\. Child A-1\n {8}- Bullet A\n {8}- Bullet B/m);
assert.match(mdx, /2\. Parent B\n {4}1\. Child B-1/m);
assert.match(mdx, /break\n\n3\. Starts at three/);
assert.match(mdx, /- \[x\] Checked task/);
assert.match(mdx, /- \[ \] Unchecked task/);
assert.match(mdx, /<details class="notion-toggle">/);
assert.match(mdx, /<aside class="notion-callout notion-color-blue_background">/);
assert.match(mdx, /\| \*\*H1\*\* \| H2 \|/);
assert.match(mdx, /\\\$ value/);
assert.match(mdx, /<div class="notion-columns">/);
assert.match(mdx, /Synced Notion block reference skipped: source/);
assert.match(mdx, /Unsupported Notion block skipped: unsupported/);

assert.equal(
  richTextToMarkdown(rt('[$5]', { bold: true }, { text: { link: { url: 'https://example.com/a)b' } } })),
  '[**\\[\\$5\\]**](https://example.com/a%29b)',
);

console.log('notion-to-mdx fixture assertions passed');

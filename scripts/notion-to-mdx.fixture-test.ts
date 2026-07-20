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
  {
    id: 'rt1',
    type: 'paragraph',
    has_children: false,
    paragraph: {
      rich_text: [
        ...rt('Bold link', { bold: true }, { text: { link: { url: 'https://example.com/a)b' } } }),
        ...rt(' and colored', { underline: true, color: 'yellow_background' }),
      ],
    },
  },
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

assert.match(mdx, /1\. <span>Parent A<\/span>\n {4}<span>Child paragraph<\/span>\n {4}\n {4}1\. <span>Child A-1<\/span>\n {8}- <span>Bullet A<\/span>\n {8}- <span>Bullet B<\/span>/m);
assert.match(mdx, /2\. <span>Parent B<\/span>\n {4}1\. <span>Child B-1<\/span>/m);
assert.match(mdx, /<span>break<\/span>\n\n<a href="https:\/\/example\.com\/a\)b"><span><strong>Bold link<\/strong><\/span><\/a><span class="notion-color-yellow_background"><u> and colored<\/u><\/span>\n\n3\. <span>Starts at three<\/span>/);
assert.match(mdx, /- \[x\] <span>Checked task<\/span>/);
assert.match(mdx, /- \[ \] <span>Unchecked task<\/span>/);
assert.match(mdx, /<NotionToggle summary="Toggle title" headingLevel=\{0\}>/);
assert.match(mdx, /<NotionCallout icon="!" color="blue_background">/);
assert.match(mdx, /\| <strong><span>H1<\/span><\/strong> \| <span>H2<\/span> \|/);
assert.match(mdx, /<span>&#36; value<\/span>/);
assert.match(mdx, /<NotionColumns>/);
assert.match(mdx, /TODO\(notion\): unsupported block type: synced_block; synced_from=source/);
assert.match(mdx, /TODO\(notion\): unsupported block type: unsupported/);

assert.equal(
  richTextToMarkdown(rt('[$5]', { bold: true }, { text: { link: { url: 'https://example.com/a)b' } } })),
  '[**\\[\\$5\\]**](https://example.com/a%29b)',
);

console.log('notion-to-mdx fixture assertions passed');

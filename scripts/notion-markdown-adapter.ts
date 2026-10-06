import { NotionToMarkdown } from 'notion-to-md';
import type { Annotations, MdBlock, MdStringObject } from 'notion-to-md/build/types';

// Compose each subtree before indenting it. Quote children must not inherit
// the containing list's indentation (four spaces become a Markdown code block).
export class NotionMarkdownAdapter extends NotionToMarkdown {
  async blockToMarkdown(block: Parameters<NotionToMarkdown['blockToMarkdown']>[0]): Promise<string> {
    if ('type' in block) {
      const value = block[block.type as keyof typeof block] as { rich_text?: Array<{ annotations: Annotations }>; color?: string };
      if (value?.rich_text && value.color && value.color !== 'default') {
        block = { ...block, [block.type]: { ...value, rich_text: value.rich_text.map((item) => ({
          ...item, annotations: { ...item.annotations, color: item.annotations.color === 'default' ? value.color : item.annotations.color },
        })) } } as typeof block;
      }
    }
    const result = await super.blockToMarkdown(block);
    return 'type' in block && block.type === 'paragraph' && !result
      ? '<p class="notion-empty" aria-hidden="true"></p>' : result;
  }

  toMarkdownString(blocks: MdBlock[] = [], pageIdentifier = 'parent', nestingLevel = 0): MdStringObject {
    const content = blocks.map((block) => {
      const child = block.type === 'callout' ? '' : this.toMarkdownString(block.children).parent || '';
      const parent = block.parent;
      switch (block.type) {
        case 'quote':
          return [parent, child && child.split('\n').map((line) => `> ${line}`).join('\n')].filter(Boolean).join('\n>\n');
        case 'bulleted_list_item':
        case 'numbered_list_item':
        case 'to_do': {
          const width = parent.match(/^(?:\d+\.|-) /)?.[0].length || 2;
          const lines = parent.split('\n');
          return lines[0] + (lines.length > 1 ? '\n' + indent(lines.slice(1).join('\n'), width) : '')
            + (child ? '\n\n' + indent(child, width) : '');
        }
        case 'toggle':
          return `<details>\n<summary>${parent}</summary>\n\n${child}\n\n</details>`;
        case 'child_page':
          return ''; // Child pages are synced separately, not embedded.
        default:
          return [parent, child].filter(Boolean).join('\n\n');
      }
    }).filter(Boolean).join('\n\n');
    return { [pageIdentifier]: nestingLevel ? indent(content, nestingLevel * 4) : content };
  }

  annotatePlainText(text: string, annotations: Annotations): string {
    // Inline HTML preserves adjacent annotations even inside Korean words,
    // and keeps literal Markdown characters from changing the block structure.
    let value = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/([\\`*_{}\[\]$])/g, (char) => `&#${char.charCodeAt(0)};`).replace(/\n/g, '<br />');
    if (!value) return '';
    for (const [enabled, tag] of [
      [annotations.code, 'code'], [annotations.bold, 'strong'], [annotations.italic, 'em'],
      [annotations.strikethrough, 's'], [annotations.underline, 'u'],
    ] as const) {
      if (enabled) value = `<${tag}>${value}</${tag}>`;
    }
    const color = annotations.color;
    return color && color !== 'default'
      ? `<span class="notion-color-${color.replace(/[^a-z_]/g, '')}">${value}</span>`
      : value;
  }
}

function indent(value: string, width: number) {
  return value.split('\n').map((line) => ' '.repeat(width) + line).join('\n');
}

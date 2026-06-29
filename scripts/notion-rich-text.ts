type RichTextItem = {
  plain_text?: string;
  href?: string | null;
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
  };
};

export function richTextToPlain(richText: RichTextItem[] = []) {
  return richText.map((item) => item.plain_text || '').join('').trim();
}

export function richTextToMarkdown(richText: RichTextItem[] = []) {
  return richText
    .map((item) => {
      const rawText = item.plain_text || '';
      if (!rawText) return '';

      const annotations = item.annotations || {};
      let text = annotations.code ? escapeCode(rawText) : escapeMarkdownInline(rawText);

      if (annotations.code) text = `\`${text}\``;
      if (annotations.bold) text = `**${text}**`;
      if (annotations.italic) text = `_${text}_`;
      if (annotations.strikethrough) text = `~~${text}~~`;
      if (annotations.underline) text = `<u>${text}</u>`;
      if (item.href) text = `[${text}](${escapeUrl(item.href)})`;

      return text;
    })
    .join('')
    .trim();
}

export function escapeMarkdownInline(value: string) {
  return value.replace(/([\\`*_{}\[\]()#+.!|])/g, '\\$1');
}

export function escapeMdxAttribute(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeCode(value: string) {
  return value.replace(/`/g, '\\`');
}

function escapeUrl(value: string) {
  return value.replace(/\)/g, '%29');
}

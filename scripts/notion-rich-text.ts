type RichTextItem = {
  type?: string;
  plain_text?: string;
  href?: string | null;
  text?: {
    link?: {
      url?: string;
    } | null;
  };
  equation?: {
    expression?: string;
  };
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
  };
};

export function richTextToPlain(richText: RichTextItem[] = []) {
  return richText.map((item) => item.plain_text || item.equation?.expression || '').join('').trim();
}

export function richTextToMarkdown(richText: RichTextItem[] = []) {
  return richText
    .map((item) => {
      if (item.type === 'equation') {
        return mathInline(item.equation?.expression || item.plain_text || '');
      }

      const rawText = item.plain_text || '';
      if (!rawText) return '';

      const annotations = item.annotations || {};
      let text = annotations.code ? escapeCode(rawText) : escapeMarkdownInline(rawText);

      if (annotations.code) text = `\`${text}\``;
      if (annotations.bold) text = `**${text}**`;
      if (annotations.italic) text = `_${text}_`;
      if (annotations.strikethrough) text = `~~${text}~~`;
      if (annotations.underline) text = `<u>${text}</u>`;
      const href = item.href || item.text?.link?.url;
      if (href) text = `[${text}](${escapeUrl(href)})`;

      return text;
    })
    .join('')
    .trim();
}

function mathInline(expression: string) {
  const value = expression.trim();
  return value ? `$${value}$` : '';
}

export function escapeMarkdownInline(value: string) {
  return value.replace(/([\\`*_{}\[\]()#+.!|$])/g, '\\$1');
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

import fs from 'node:fs/promises';
import path from 'node:path';

const roots = ['src/content/notes', 'src/content/projects'];
const problems: string[] = [];

for (const root of roots) {
  for (const filePath of await markdownFiles(root)) {
    const content = await fs.readFile(filePath, 'utf8');
    if (!/^---[\s\S]*?\ngenerated:\s*true\b/m.test(content)) continue;
    validateGeneratedFile(filePath, content);
  }
}

if (problems.length) {
  console.error('Generated Notion content validation failed:');
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}

console.log('Generated Notion content validation passed.');

function validateGeneratedFile(filePath: string, content: string) {
  const relative = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  const frontmatter = content.match(/^---\n([\s\S]*?)\n---/)?.[1] || '';
  const title = scalar(frontmatter, 'title');
  const type = scalar(frontmatter, 'type');
  const slug = scalar(frontmatter, 'slug');

  if (/weekly[\s_-]*(brief|report)/i.test(`${title} ${type} ${slug}`) || /주간[\s_-]*(브리프|리포트|보고서)/i.test(title)) {
    problems.push(`${relative}: blacklisted weekly content was generated`);
  }
  if (/secure\.notion-static\.com|prod-files-secure\.s3\./i.test(content)) {
    problems.push(`${relative}: contains an expiring Notion asset URL`);
  }
  if (/&lt;\/?(?:figure|figcaption|span)\b/i.test(content)) {
    problems.push(`${relative}: contains an escaped HTML tag`);
  }
  if (/<span[^>]*>[^<]*(?:\*\*|__)[^<]*<\/span>/i.test(content)) {
    problems.push(`${relative}: Markdown emphasis is trapped inside a span`);
  }
  if (/\*{4}/.test(content)) {
    problems.push(`${relative}: contains adjacent bold markers that can render as literal asterisks`);
  }
  if (filePath.endsWith('.md') && /(?:^|\n)import\s.+from\s+['"]/m.test(content)) {
    problems.push(`${relative}: standard Markdown contains an MDX import`);
  }
  if ((content.match(/^```/gm) || []).length % 2 !== 0) {
    problems.push(`${relative}: has an unclosed fenced code block`);
  }
  if ((content.match(/^\$\$/gm) || []).length % 2 !== 0) {
    problems.push(`${relative}: has an unclosed display-math block`);
  }
}

async function markdownFiles(root: string) {
  const directory = path.join(process.cwd(), root);
  const entries = await fs.readdir(directory, { withFileTypes: true }).catch(() => []);
  return entries
    .filter((entry) => entry.isFile() && /\.mdx?$/.test(entry.name))
    .map((entry) => path.join(directory, entry.name));
}

function scalar(frontmatter: string, key: string) {
  const raw = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]?.trim() || '';
  return raw.replace(/^['"]|['"]$/g, '');
}

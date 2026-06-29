import fs from 'node:fs/promises';
import path from 'node:path';
import { getDatabaseId, printLoadedEnv, queryPublishedPages, syncTargets, type SyncTarget, type SyncTargetKey } from './notion-client';
import { pageToMdx, shouldSyncPage } from './notion-to-mdx';

const debug = process.argv.includes('--debug');
const requestedTargets = parseTargets(process.argv.slice(2));

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  if (debug) printLoadedEnv(requestedTargets);

  for (const target of requestedTargets) {
    await syncTarget(target);
  }
}

async function syncTarget(target: SyncTarget) {
  const databaseId = getDatabaseId(target);
  if (!databaseId) {
    console.warn(`Skipping ${target.label}: ${target.databaseEnv} is not set.`);
    return;
  }

  const pages = (await queryPublishedPages(target, { requirePublishFilter: target.key === 'notes', debug }))
    .filter((page) => shouldSyncPage(page, target.key));
  let written = 0;
  let skipped = 0;
  const syncedSlugs = new Set<string>();

  for (const page of pages) {
    const { slug, mdx } = await pageToMdx(page, target.key);
    syncedSlugs.add(slug);
    const outputPath = path.join(process.cwd(), target.outputDir, `${slug}.mdx`);
    const result = await writeGeneratedFile(outputPath, mdx);

    if (result === 'written') written += 1;
    if (result === 'skipped') skipped += 1;
  }

  const pruned = await pruneGeneratedFiles(target.outputDir, syncedSlugs);
  console.log(`Synced ${written} ${target.label} pages to ${target.outputDir}${skipped ? ` (${skipped} unchanged)` : ''}.`);
  if (pruned > 0) console.log(`Pruned ${pruned} stale generated ${target.label} file(s).`);
}

async function writeGeneratedFile(filePath: string, nextContent: string): Promise<'written' | 'skipped'> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  const previousContent = await readOptional(filePath);
  if (previousContent === nextContent) return 'skipped';

  if (previousContent && !isGenerated(previousContent)) {
    const backupPath = `${filePath}.backup-${timestamp()}`;
    await fs.copyFile(filePath, backupPath);
    console.warn(`Backed up manual file before overwrite: ${relative(backupPath)}`);
  }

  if (previousContent) {
    console.log(diffSummary(filePath, previousContent, nextContent));
  } else {
    console.log(`Create ${relative(filePath)} (${nextContent.split(/\r?\n/).length} lines).`);
  }

  await fs.writeFile(filePath, nextContent, 'utf8');
  return 'written';
}

function parseTargets(args: string[]) {
  const flags = new Set(args);
  const selected: SyncTargetKey[] = [];

  if (flags.has('--projects') || flags.has('projects')) selected.push('projects');
  if (flags.has('--notes') || flags.has('notes')) selected.push('notes');
  if (flags.has('--blog') || flags.has('blog')) selected.push('blog');

  const keys: SyncTargetKey[] = selected.length ? selected : ['projects', 'notes'];
  return keys.map((key) => syncTargets[key]);
}

async function readOptional(filePath: string) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return '';
    throw error;
  }
}

async function pruneGeneratedFiles(outputDir: string, syncedSlugs: Set<string>) {
  const directory = path.join(process.cwd(), outputDir);
  let entries: import('node:fs').Dirent[];
  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return 0;
    throw error;
  }

  let pruned = 0;
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.mdx')) continue;

    const slug = entry.name.replace(/\.mdx$/, '');
    if (syncedSlugs.has(slug)) continue;

    const filePath = path.join(directory, entry.name);
    const content = await readOptional(filePath);
    if (!isGenerated(content)) continue;

    await fs.unlink(filePath);
    console.log(`Prune stale generated file: ${relative(filePath)}`);
    pruned += 1;
  }

  return pruned;
}

function isGenerated(content: string) {
  return /^---[\s\S]*?\ngenerated:\s*true\b/m.test(content)
    || content.includes('This file is generated from Notion. Do not edit directly.');
}

function diffSummary(filePath: string, before: string, after: string) {
  const beforeLines = before.split(/\r?\n/);
  const afterLines = after.split(/\r?\n/);
  const max = Math.max(beforeLines.length, afterLines.length);
  let changed = 0;

  for (let index = 0; index < max; index += 1) {
    if (beforeLines[index] !== afterLines[index]) changed += 1;
  }

  return `Update ${relative(filePath)} (${changed} changed lines, ${beforeLines.length} -> ${afterLines.length}).`;
}

function relative(filePath: string) {
  return path.relative(process.cwd(), filePath).replace(/\\/g, '/');
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

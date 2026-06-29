import {
  getDatabaseId,
  getDataSourceIdFromEnv,
  printLoadedEnv,
  queryDataSource,
  resolveDataSourceId,
  retrieveDatabase,
  syncTargets,
  verifyToken,
  type SyncTarget,
  type SyncTargetKey,
} from './notion-client';
import { richTextToPlain } from './notion-rich-text';

const requestedTargets = parseTargets(process.argv.slice(2));

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  printLoadedEnv(requestedTargets);

  console.log('[notion] verifyToken()');
  const user = await verifyToken();
  console.log(`  ok: ${user.type || user.object || 'user'} ${user.name || user.bot?.owner?.workspace_name || ''}`.trim());

  for (const target of requestedTargets) {
    try {
      await debugTarget(target);
    } catch (error) {
      console.error(`  failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

async function debugTarget(target: SyncTarget) {
  const databaseId = getDatabaseId(target);
  const explicitDataSourceId = getDataSourceIdFromEnv(target);

  console.log(`[notion] ${target.label}`);
  if (!databaseId) {
    console.log(`  skipped: ${target.databaseEnv} is not set`);
    return;
  }

  console.log('  retrieveDatabase(databaseId)');
  let database: any;
  try {
    database = await retrieveDatabase(databaseId);
  } catch (error) {
    console.error(`    failed: ${error instanceof Error ? error.message : String(error)}`);
    console.log('  probe queryDataSource(databaseId)');
    const response = await queryDataSource(databaseId, { page_size: 1 });
    console.log(`    ok: env id works as data_source_id; ${response.results?.length || 0} sample page(s), has_more=${Boolean(response.has_more)}`);
    await listPagesIfRequested(databaseId);
    return;
  }

  console.log(`    ok: ${database.title?.map((item: any) => item.plain_text).join('') || database.id}`);
  console.log(`    properties: ${Object.keys(database.properties || {}).join(', ') || '<none>'}`);
  console.log(`    data_sources: ${formatDataSources(database.data_sources || [])}`);

  console.log('  resolveDataSourceId(databaseId)');
  const dataSourceId = await resolveDataSourceId(databaseId, explicitDataSourceId);
  console.log(`    ok: ${dataSourceId}${explicitDataSourceId ? ' (env)' : ' (resolved)'}`);

  console.log('  queryDataSource(dataSourceId)');
  const response = await queryDataSource(dataSourceId, { page_size: 1 });
  console.log(`    ok: ${response.results?.length || 0} sample page(s), has_more=${Boolean(response.has_more)}`);
  await listPagesIfRequested(dataSourceId);
}

async function listPagesIfRequested(dataSourceId: string) {
  if (process.argv.includes('--list')) {
    const list = await queryDataSource(dataSourceId, { page_size: 20 });
    for (const page of list.results || []) {
      console.log(`    page id=${page.id} title=${getTitle(page.properties)} slug=${getText(page.properties, ['Slug', 'slug']) || '<empty>'}`);
    }
  }
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

function formatDataSources(dataSources: any[]) {
  if (!dataSources.length) return '<none>';
  return dataSources.map((source) => `${source.id}${source.name ? ` (${source.name})` : ''}`).join(', ');
}

function getTitle(properties: Record<string, any> = {}) {
  const titleProperty = Object.values(properties).find((property: any) => property.type === 'title') as any;
  return richTextToPlain(titleProperty?.title || []) || '<empty>';
}

function getText(properties: Record<string, any> = {}, names: string[]) {
  const normalized = names.map((name) => name.toLowerCase());
  const property = Object.entries(properties).find(([name]) => normalized.includes(name.toLowerCase()))?.[1] as any;
  if (!property) return '';
  if (property.type === 'rich_text') return richTextToPlain(property.rich_text);
  if (property.type === 'title') return richTextToPlain(property.title);
  if (property.type === 'formula') return String(property.formula?.string || property.formula?.number || '');
  return '';
}

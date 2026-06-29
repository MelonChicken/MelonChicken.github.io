import { Client } from '@notionhq/client';
import fs from 'node:fs';
import path from 'node:path';

export type AnyNotionObject = Record<string, any>;
export type NotionApiMode = 'legacy' | 'data-source';
export type SyncTargetKey = 'projects' | 'notes' | 'blog';

export type SyncTarget = {
  key: SyncTargetKey;
  label: string;
  databaseEnv: string;
  dataSourceEnv: string;
  outputDir: string;
};

export type NotionDiagnostics = {
  mode: NotionApiMode;
  notionVersion: string;
  endpointKind: 'databases.query' | 'dataSources.query';
  tokenPreview: string;
};

const LEGACY_NOTION_VERSION = '2022-06-28';
const DATA_SOURCE_NOTION_VERSION = '2026-03-11';

export const syncTargets: Record<SyncTargetKey, SyncTarget> = {
  projects: {
    key: 'projects',
    label: 'Projects',
    databaseEnv: 'NOTION_PROJECTS_DATABASE_ID',
    dataSourceEnv: 'NOTION_PROJECTS_DATA_SOURCE_ID',
    outputDir: 'src/content/projects',
  },
  notes: {
    key: 'notes',
    label: 'Lab Notes',
    databaseEnv: 'NOTION_NOTES_DATABASE_ID',
    dataSourceEnv: 'NOTION_NOTES_DATA_SOURCE_ID',
    outputDir: 'src/content/notes',
  },
  blog: {
    key: 'blog',
    label: 'Blog',
    databaseEnv: 'NOTION_BLOG_DATABASE_ID',
    dataSourceEnv: 'NOTION_BLOG_DATA_SOURCE_ID',
    outputDir: 'src/content/blog',
  },
};

loadDotEnv();

const token = process.env.NOTION_API_TOKEN || process.env.NOTION_TOKEN;

if (!token) {
  throw new Error('NOTION_API_TOKEN is required. Copy .env.example to .env and set your Notion integration token.');
}

export const notionMode = getNotionMode();
export const notionVersion = process.env.NOTION_VERSION
  || (notionMode === 'legacy' ? LEGACY_NOTION_VERSION : DATA_SOURCE_NOTION_VERSION);

export const notion = new Client({
  auth: token,
  notionVersion: LEGACY_NOTION_VERSION,
});

export function getDiagnostics(): NotionDiagnostics {
  return {
    mode: notionMode,
    notionVersion,
    endpointKind: notionMode === 'legacy' ? 'databases.query' : 'dataSources.query',
    tokenPreview: maskToken(token || ''),
  };
}

export function getDatabaseId(target: SyncTarget) {
  const raw = process.env[target.databaseEnv];
  return raw ? extractNotionId(raw) : '';
}

export function getDataSourceIdFromEnv(target: SyncTarget) {
  const raw = process.env[target.dataSourceEnv];
  return raw ? extractNotionId(raw) : '';
}

export async function verifyToken() {
  return notionRequest('/users/me', { method: 'GET' });
}

export async function retrieveDatabase(databaseId: string) {
  return notionRequest(`/databases/${databaseId}`, { method: 'GET' });
}

export async function retrieveDataSource(dataSourceId: string) {
  return notionRequest(`/data_sources/${dataSourceId}`, { method: 'GET' });
}

export async function resolveDataSourceId(databaseId: string, explicitDataSourceId = '') {
  if (explicitDataSourceId) return explicitDataSourceId;

  const database = await retrieveDatabase(databaseId);
  const dataSources = database.data_sources || database.dataSources || [];

  if (dataSources.length === 1) {
    return extractNotionId(dataSources[0].id);
  }

  if (dataSources.length > 1) {
    const candidates = dataSources
      .map((source: AnyNotionObject) => `- ${source.id}${source.name ? ` (${source.name})` : ''}`)
      .join('\n');
    throw new Error(`Multiple data sources found for database ${databaseId}. Set the matching data source id in .env.\n${candidates}`);
  }

  throw new Error(`No data_sources array was returned for database ${databaseId}. Use NOTION_API_MODE=legacy, or set NOTION_PROJECTS_DATA_SOURCE_ID / NOTION_NOTES_DATA_SOURCE_ID explicitly.`);
}

export async function queryDataSource(dataSourceId: string, body: AnyNotionObject) {
  return notionRequest(`/data_sources/${dataSourceId}/query`, {
    method: 'POST',
    body,
  });
}

export async function queryPublishedPages(
  target: SyncTarget,
  options: { requirePublishFilter?: boolean; debug?: boolean } = {},
) {
  const databaseId = getDatabaseId(target);
  if (!databaseId) throw new Error(`${target.databaseEnv} is not set.`);

  const explicitDataSourceId = getDataSourceIdFromEnv(target);
  const resolvedSource = await resolveQuerySource(databaseId, explicitDataSourceId, options.debug);
  const filter = getPublishFilter(resolvedSource.schemaSource);
  if (!filter && options.requirePublishFilter) {
    throw new Error(`${target.label} database must have a Published/Public checkbox or Status/Visibility property for safe sync.`);
  }

  const pages: AnyNotionObject[] = [];
  let startCursor: string | undefined;

  if (options.debug) {
    console.log(`[notion] ${target.label}: endpoint=${notionMode === 'legacy' ? 'databases.query' : 'dataSources.query'}`);
    console.log(`[notion] ${target.label}: database_id=${databaseId}`);
    if (resolvedSource.dataSourceId) console.log(`[notion] ${target.label}: data_source_id=${resolvedSource.dataSourceId} (${resolvedSource.source})`);
  }

  do {
    const body = {
      page_size: 100,
      start_cursor: startCursor,
      ...(filter ? { filter } : {}),
    };
    const response = notionMode === 'legacy'
      ? await queryDatabase(databaseId, body)
      : await queryDataSource(resolvedSource.dataSourceId, body);

    pages.push(...response.results.filter((item: AnyNotionObject) => item.object === 'page'));
    startCursor = response.has_more ? response.next_cursor || undefined : undefined;
  } while (startCursor);

  return pages.filter(isPublishedPage);
}

async function resolveQuerySource(databaseId: string, explicitDataSourceId: string, debug = false) {
  if (notionMode === 'legacy') {
    return {
      database: await retrieveDatabase(databaseId),
      dataSourceId: '',
      schemaSource: await retrieveDatabase(databaseId),
      source: 'legacy database' as const,
    };
  }

  try {
    const database = await retrieveDatabase(databaseId);
    const dataSourceId = await resolveDataSourceId(databaseId, explicitDataSourceId);
    return {
      database,
      dataSourceId,
      schemaSource: database,
      source: explicitDataSourceId ? 'env' as const : 'resolved from database' as const,
    };
  } catch (error) {
    if (!isObjectNotFound(error) || explicitDataSourceId) throw error;
    if (debug) {
      console.warn(`[notion] retrieveDatabase failed for ${databaseId}; probing the same id as a data_source_id.`);
    }

    const dataSource = await retrieveDataSource(databaseId);
    return {
      database: undefined,
      dataSourceId: databaseId,
      schemaSource: dataSource,
      source: 'database env treated as data_source_id' as const,
    };
  }
}

export async function listBlockChildren(blockId: string): Promise<AnyNotionObject[]> {
  const blocks: AnyNotionObject[] = [];
  let startCursor: string | undefined;

  do {
    const response = await notion.blocks.children.list({
      block_id: blockId,
      page_size: 100,
      start_cursor: startCursor,
    });

    blocks.push(...response.results);
    startCursor = response.has_more ? response.next_cursor || undefined : undefined;
  } while (startCursor);

  return blocks;
}

export function printLoadedEnv(targets: SyncTarget[]) {
  const diagnostics = getDiagnostics();
  console.log('[notion] Environment');
  console.log(`  NOTION_API_TOKEN=${diagnostics.tokenPreview}`);
  console.log(`  NOTION_VERSION=${diagnostics.notionVersion}`);
  console.log(`  NOTION_API_MODE=${diagnostics.mode}`);
  console.log(`  endpoint=${diagnostics.endpointKind}`);

  for (const target of targets) {
    console.log(`  ${target.databaseEnv}=${getEnvPreview(target.databaseEnv)}`);
    console.log(`  ${target.dataSourceEnv}=${getEnvPreview(target.dataSourceEnv)}`);
  }
}

function queryDatabase(databaseId: string, body: AnyNotionObject) {
  return notionRequest(`/databases/${databaseId}/query`, {
    method: 'POST',
    body,
  });
}

function getPublishFilter(database: AnyNotionObject) {
  const properties = database.properties || {};
  const or: AnyNotionObject[] = [];

  for (const [name, property] of Object.entries<AnyNotionObject>(properties)) {
    const normalized = normalizePropertyName(name);

    if ((normalized === 'published' || normalized === 'public') && property.type === 'checkbox') {
      or.push({ property: name, checkbox: { equals: true } });
    }

    if ((normalized === 'status' || normalized === 'visibility' || normalized === 'publishstatus') && property.type === 'status') {
      for (const option of ['Published', 'Public']) {
        if (hasOption(property, option)) or.push({ property: name, status: { equals: option } });
      }
    }

    if ((normalized === 'status' || normalized === 'visibility' || normalized === 'publishstatus') && property.type === 'select') {
      for (const option of ['Published', 'Public']) {
        if (hasOption(property, option)) or.push({ property: name, select: { equals: option } });
      }
    }
  }

  if (or.length === 0) return undefined;
  return or.length === 1 ? or[0] : { or };
}

async function notionRequest(endpoint: string, options: { method: 'GET' | 'POST'; body?: AnyNotionObject }) {
  let response: Response;
  try {
    response = await fetch(`https://api.notion.com/v1${endpoint}`, {
      method: options.method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Notion-Version': notionVersion,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw enrichNotionError(endpoint, 0, {
      code: 'network_error',
      message,
    });
  }

  const responseBody = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw enrichNotionError(endpoint, response.status, responseBody);
  }

  return responseBody;
}

function enrichNotionError(endpoint: string, status: number, body: AnyNotionObject) {
  const message = body.message || `Notion API request failed with ${status}`;
  const diagnostics = getDiagnostics();
  const hints = [
    `endpoint: ${endpoint}`,
    `mode: ${diagnostics.mode}`,
    `Notion-Version: ${diagnostics.notionVersion}`,
    `token preview: ${diagnostics.tokenPreview}`,
    'possible causes:',
    '- token is invalid or belongs to a different workspace',
    '- this Notion API version requires data_source_id instead of database_id',
    '- the env value is a linked database view id rather than the original database id',
    '- the id loaded from .env differs from the id shown in Notion UI',
    '- a relation target database is not shared with the integration',
  ].join('\n');

  const error = new Error(`${message}\n${diagnosticsHints(body)}\n${hints}`) as Error & {
    code?: string;
    status?: number;
    body?: AnyNotionObject;
  };
  error.code = body.code;
  error.status = status;
  error.body = body;
  return error;
}

function isObjectNotFound(error: unknown) {
  return Boolean(error && typeof error === 'object' && (error as { code?: string }).code === 'object_not_found');
}

function diagnosticsHints(body: AnyNotionObject) {
  if (!body || Object.keys(body).length === 0) return '';
  return `Notion response: ${JSON.stringify(body)}`;
}

function isPublishedPage(page: AnyNotionObject) {
  const properties = page.properties || {};
  const publishProperties = Object.entries<AnyNotionObject>(properties).filter(([name]) => {
    const normalized = normalizePropertyName(name);
    return ['published', 'public', 'status', 'visibility', 'publishstatus'].includes(normalized);
  });

  if (publishProperties.length === 0) return true;

  return publishProperties.some(([, property]) => {
    if (property.type === 'checkbox') return property.checkbox === true;
    if (property.type === 'status') return ['published', 'public'].includes(normalizePropertyName(property.status?.name || ''));
    if (property.type === 'select') return ['published', 'public'].includes(normalizePropertyName(property.select?.name || ''));
    if (property.type === 'multi_select') {
      return property.multi_select?.some((item: AnyNotionObject) => ['published', 'public'].includes(normalizePropertyName(item.name)));
    }
    return false;
  });
}

function hasOption(property: AnyNotionObject, optionName: string) {
  const options = property.status?.options || property.select?.options || [];
  if (options.length === 0) return true;
  return options.some((option: AnyNotionObject) => option.name === optionName);
}

function getNotionMode(): NotionApiMode {
  const raw = String(process.env.NOTION_API_MODE || process.env.NOTION_MODE || '').toLowerCase();
  if (raw === 'legacy' || raw === 'database' || raw === 'databases') return 'legacy';
  return 'data-source';
}

function getEnvPreview(key: string) {
  const value = process.env[key];
  return value ? extractNotionId(value) : '<unset>';
}

function maskToken(value: string) {
  if (!value) return '<unset>';
  return `${value.slice(0, 10)}...`;
}

function normalizePropertyName(value: string) {
  return String(value || '').toLowerCase().replace(/[\s_-]+/g, '').trim();
}

function extractNotionId(value: string) {
  const compactValue = String(value).replace(/-/g, '');
  const ids = compactValue.match(/[0-9a-f]{32}/gi);

  if (!ids?.length) {
    throw new Error('Notion id must be a Notion URL or 32 character ID.');
  }

  return ids[0].replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
}

function loadDotEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

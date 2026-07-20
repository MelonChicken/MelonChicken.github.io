import { notion, type AnyNotionObject, type SyncTargetKey } from './notion-client';
import { fetchNotionBlockAst, normalizeNotionBlocks } from './notion-ast';
import { notionMdxImports, renderNotionBlocks } from './notion-mdx-renderer';
import { richTextToPlain } from './notion-rich-text';

type Frontmatter = Record<string, unknown>;

const statusValues = ['idea', 'work-in-progress', 'completed', 'archived'] as const;
const projectGroups = ['research', 'ml', 'product', 'archived'] as const;
const noteTypes = ['weekly-brief', 'paper-review', 'experiment-log', 'implementation-note', 'learning-note', 'retrospective'] as const;
const trackSlugAliases: Record<string, string> = {
  'animal-pose-estimation': 'animal-pose-estimation',
  'animal-pose-estimation-keypoint-trajectories': 'animal-pose-estimation',
  'animal-pose-estimation-and-keypoint-trajectories': 'animal-pose-estimation',
  'pose': 'animal-pose-estimation',
  'pose-estimation': 'animal-pose-estimation',
  'keypoints': 'animal-pose-estimation',
  'keypoint-trajectories': 'animal-pose-estimation',
  'behavior-recognition': 'behavior-recognition',
  'behaviour-recognition': 'behavior-recognition',
  'behavior-recognition-from-animal-video': 'behavior-recognition',
  'animal-behavior-recognition': 'behavior-recognition',
  'animal-behaviour-recognition': 'behavior-recognition',
  'annotation-efficient-learning': 'annotation-efficient-learning',
  'annotation-efficient': 'annotation-efficient-learning',
  'labeling-automation': 'annotation-efficient-learning',
  'labelling-automation': 'annotation-efficient-learning',
  'weak-supervision': 'annotation-efficient-learning',
  'semi-supervised-learning': 'annotation-efficient-learning',
};

const fallbackProjectTracks: Record<string, string[]> = {
  'architag-ai': ['annotation-efficient-learning', 'behavior-recognition'],
  'be-more-duck-vision-language-embodied-agent': ['animal-pose-estimation', 'behavior-recognition'],
  'wildlife-metadata-fusion': ['animal-pose-estimation', 'annotation-efficient-learning'],
  'wildlifevision-baseline-scikit-learn': ['animal-pose-estimation'],
};

export async function pageToMdx(page: AnyNotionObject, target: SyncTargetKey) {
  const title = getTitle(page.properties);
  const slug = getPageSlug(page, title);
  const frontmatter = await buildFrontmatter(page, target, title, slug);
  const body = await blocksToMdx(page.id, slug);

  return {
    slug,
    mdx: renderMdx(frontmatter, body),
  };
}

export function getPageSlug(page: AnyNotionObject, title = getTitle(page.properties)) {
  const explicitSlug = getPropertyText(page.properties || {}, ['Slug', 'slug']);
  return explicitSlug ? slugify(explicitSlug, page.id) : slugify(title, page.id);
}

export function shouldSyncPage(page: AnyNotionObject, target: SyncTargetKey) {
  if (target !== 'projects') return true;

  const properties = page.properties || {};
  const title = getTitle(properties);
  const titleSlug = slugify(title, page.id);
  const summary = getPropertyText(properties, ['Summary', 'Description', 'Problem', 'One-liner', '문제-해결 one-liner']);
  const stack = getPropertyList(properties, ['Stack', 'Stacks', 'Tech Stack', 'Technologies', '스택 stack']);
  const roles = getPropertyList(properties, ['Roles', 'Role', '역할 role']);
  const domain = getPropertyList(properties, ['Domain', 'Domains', 'Tags']);
  const links = [
    getPropertyUrl(properties, ['Repo', 'Repository', 'Git Repository', 'GitHub']),
    getPropertyUrl(properties, ['Deploy', 'Deployment', '배포 Deploy']),
    getPropertyUrl(properties, ['Demo', 'Demonstration', '시연 및 소개 Demonstration']),
  ];
  if (!title || title === 'Untitled' || titleSlug.startsWith('notion-')) return false;

  return Boolean(
    summary
    || stack.length > 0
    || roles.length > 0
    || domain.length > 0
    || links.some(Boolean)
  );
}

export async function blocksToMdx(blockId: string, slug: string): Promise<string> {
  const blocks = await fetchNotionBlockAst(blockId, slug);
  return renderNotionBlocks(blocks);
}

export async function blocksToMdxFromBlocks(blocks: AnyNotionObject[], slug: string): Promise<string> {
  const ast = await normalizeNotionBlocks(blocks, slug);
  return renderNotionBlocks(ast);
}

async function buildFrontmatter(page: AnyNotionObject, target: SyncTargetKey, title: string, slug: string): Promise<Frontmatter> {
  const properties = page.properties || {};
  const relatedNotes = await getPropertyReferenceSlugs(properties, ['Related Notes', 'Related Note']);
  const common = {
    title,
    slug,
    generated: true,
    status: normalizeStatus(getPropertyText(properties, ['Status', 'State', '상태', '상태 status'])),
    domain: getPropertyList(properties, ['Domain', 'Domains', 'Tags']),
    tags: getPropertyList(properties, ['Tags']),
    relatedNotes,
    summary: getPropertyText(properties, ['Summary', 'Description', 'Problem', 'One-liner', '문제-해결 one-liner']),
  };

  if (target === 'projects') {
    return {
      ...common,
      date: getProjectDate(properties) || page.last_edited_time?.slice(0, 10) || page.created_time?.slice(0, 10),
      group: normalizeProjectGroup(getPropertyText(properties, ['Group', 'Type', '타입'])),
      program: emptyToUndefined(getPropertyText(properties, ['Program', 'Research Program'])),
      tracks: getProjectTracks(properties, slug),
      stack: getPropertyList(properties, ['Stack', 'Stacks', 'Tech Stack', 'Technologies', '스택 stack']),
      roles: getPropertyList(properties, ['Roles', 'Role', '역할 role']),
      dataset: emptyToUndefined(getPropertyText(properties, ['Dataset', 'Period', '시작일 종료일'])),
      output: emptyToUndefined(getPropertyText(properties, ['Output', 'Result', 'Type', '타입'])),
      repo: getPropertyUrl(properties, ['Repo', 'Repository', 'Git Repository', 'GitHub']),
      repoPrivate: getPropertyCheckbox(properties, ['Repo Private', 'Private Repo']),
      deploy: getPropertyUrl(properties, ['Deploy', 'Deployment', '배포 Deploy']),
      demo: getPropertyUrl(properties, ['Demo', 'Demonstration', '시연 및 소개 Demonstration']),
      notion: page.url || '',
      relatedNotes: common.relatedNotes,
      featured: getPropertyCheckbox(properties, ['Featured', '주요 프로젝트', '주요 프로젝트 Featured']) || false,
      problem: common.summary,
    };
  }

  if (target === 'notes') {
    const relatedProject = await getPropertyReferenceSlugs(properties, ['Related Project', 'Project']);
    const sourceNotes = await getPropertyReferenceSlugs(properties, ['Source Notes', 'Source Note']);

    return {
      ...common,
      type: normalizeNoteType(getPropertyText(properties, ['Type'])),
      methods: getPropertyList(properties, ['Methods', 'Method']),
      date: getPropertyDate(properties, ['Date']) || page.created_time?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      readTime: getPropertyNumber(properties, ['Read Time', 'ReadTime']),
      relatedProject: relatedProject[0] || getPropertyText(properties, ['Related Project', 'Project']),
      relatedNotes: common.relatedNotes,
      sourceNotes,
      trackedFields: getPropertyList(properties, ['Tracked Fields']),
      outputs: getPropertyList(properties, ['Outputs']),
      selectedForReview: emptyToUndefined(getPropertyText(properties, ['Selected For Review'])),
      next: emptyToUndefined(getPropertyText(properties, ['Next'])),
      notion: page.url || '',
    };
  }

  return {
    ...common,
    date: getPropertyDate(properties, ['Date', 'Published Date']) || page.created_time?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    featured: getPropertyCheckbox(properties, ['Featured']) || false,
    notion: page.url || '',
  };
}

function renderMdx(frontmatter: Frontmatter, body: string) {
  const yaml = Object.entries(frontmatter)
    .filter(([, value]) => value !== undefined && value !== '' && !(Array.isArray(value) && value.length === 0))
    .map(([key, value]) => `${key}: ${yamlValue(value)}`)
    .join('\n');

  const content = body || '{/* TODO: Add Notion page content. */}';
  return `---\n${yaml}\n---\n\n${notionMdxImports()}\n\n{/* This file is generated from Notion. Do not edit directly. */}\n\n${content.trim()}\n`;
}

function getProperty(properties: AnyNotionObject = {}, names: string[]) {
  const normalizedNames = names.map(normalizePropertyName);
  return Object.entries<AnyNotionObject>(properties).find(([name]) => normalizedNames.includes(normalizePropertyName(name)))?.[1];
}

function getTitle(properties: AnyNotionObject = {}) {
  const named = getProperty(properties, ['Title', 'Name', 'Project', 'Project Name', '프로젝트 이름']);
  const property = named || Object.values<AnyNotionObject>(properties).find((item) => item.type === 'title');
  return richTextToPlain(property?.title || []) || 'Untitled';
}

function getPropertyText(properties: AnyNotionObject, names: string[]) {
  const property = getProperty(properties, names);
  if (!property) return '';
  if (property.type === 'title') return richTextToPlain(property.title);
  if (property.type === 'rich_text') return richTextToPlain(property.rich_text);
  if (property.type === 'select') return property.select?.name || '';
  if (property.type === 'status') return property.status?.name || '';
  if (property.type === 'multi_select') return property.multi_select?.map((item: AnyNotionObject) => item.name).join(', ') || '';
  if (property.type === 'url') return property.url || '';
  if (property.type === 'date') return property.date?.start || '';
  if (property.type === 'number') return String(property.number ?? '');
  if (property.type === 'relation') return property.relation?.map((item: AnyNotionObject) => item.id).join(', ') || '';
  return '';
}

function getPropertyList(properties: AnyNotionObject, names: string[]) {
  const property = getProperty(properties, names);
  if (!property) return [];
  if (property.type === 'multi_select') return property.multi_select?.map((item: AnyNotionObject) => item.name) || [];
  if (property.type === 'select') return property.select?.name ? [property.select.name] : [];
  if (property.type === 'status') return property.status?.name ? [property.status.name] : [];
  if (property.type === 'relation') return property.relation?.map((item: AnyNotionObject) => item.id) || [];
  return splitList(getPropertyText(properties, names));
}

async function getPropertyReferenceSlugs(properties: AnyNotionObject, names: string[]) {
  const property = getProperty(properties, names);
  if (!property || property.type !== 'relation') return getPropertyList(properties, names);

  const slugs = await Promise.all((property.relation || []).map(async (reference: AnyNotionObject) => {
    const page = await retrievePage(reference.id);
    const pageProperties = page?.properties || {};
    const title = getTitle(pageProperties);
    return slugify(getPropertyText(pageProperties, ['Slug', 'slug']) || title || reference.id);
  }));

  return slugs.filter(Boolean);
}

const pageCache = new Map<string, AnyNotionObject>();

async function retrievePage(pageId: string) {
  if (pageCache.has(pageId)) return pageCache.get(pageId);
  const page = await notion.pages.retrieve({ page_id: pageId }) as AnyNotionObject;
  pageCache.set(pageId, page);
  return page;
}

function getPropertyUrl(properties: AnyNotionObject, names: string[]) {
  const value = getPropertyText(properties, names).trim();
  return value.startsWith('http') ? value : '';
}

function getPropertyDate(properties: AnyNotionObject, names: string[]) {
  const property = getProperty(properties, names);
  if (property?.type === 'date') return property.date?.start || '';
  return getPropertyText(properties, names);
}

function getProjectDate(properties: AnyNotionObject) {
  return getPropertyDate(properties, [
    'Date',
    'Start Date',
    'Started',
    'Period',
    '시작일',
    '시작일 종료일',
    '시작일-종료일 startDate - endDate',
    '시작일-종료일  startDate - endDate',
  ]);
}

function getPropertyNumber(properties: AnyNotionObject, names: string[]) {
  const property = getProperty(properties, names);
  if (property?.type === 'number') return property.number ?? undefined;
  const value = Number(getPropertyText(properties, names));
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function getPropertyCheckbox(properties: AnyNotionObject, names: string[]) {
  const property = getProperty(properties, names);
  return property?.type === 'checkbox' ? Boolean(property.checkbox) : undefined;
}

function normalizeStatus(value: string) {
  const normalized = slugify(value);
  const raw = value.trim();
  if (statusValues.includes(normalized as any)) return normalized;
  if (['done', 'complete', 'completed', 'published', 'public', 'deployed', 'ship', 'shipped', 'deployment-complete'].includes(normalized)) return 'completed';
  if (['active', 'progress', 'in-progress', 'wip', 'work-in-progress', 'working', 'ongoing'].includes(normalized)) return 'work-in-progress';
  if (['idea', 'ideation', 'backlog', 'planned', 'planning', 'draft'].includes(normalized)) return 'idea';
  if (['archive', 'old'].includes(normalized)) return 'archived';
  if (['배포완료', '완료'].includes(raw)) return 'completed';
  if (['작업 중', '작업중', '진행중', '진행 중'].includes(raw)) return 'work-in-progress';
  if (['아이디어'].includes(raw)) return 'idea';
  if (['아카이브', '보관'].includes(raw)) return 'archived';
  return 'idea';
}

function getProjectTracks(properties: AnyNotionObject, slug: string) {
  const fromNotion = getPropertyList(properties, [
    'Tracks',
    'Track',
    'Research Tracks',
    'Research Track',
    '연구 트랙',
    '연구 트랙 Research Tracks',
    '연구트랙',
  ])
    .map(normalizeTrackSlug)
    .filter(Boolean);

  const tracks = fromNotion.length > 0 ? fromNotion : fallbackProjectTracks[slug] || [];
  return unique(tracks);
}

function normalizeTrackSlug(value: string) {
  const slug = slugify(value);
  return trackSlugAliases[slug] || slug;
}

function normalizeProjectGroup(value: string) {
  const normalized = slugify(value);
  if (projectGroups.includes(normalized as any)) return normalized;
  if (normalized.includes('research')) return 'research';
  if (normalized.includes('ml') || normalized.includes('machine-learning') || normalized.includes('data')) return 'ml';
  if (normalized.includes('archive')) return 'archived';
  return 'product';
}

function normalizeNoteType(value: string) {
  const normalized = slugify(value);
  return noteTypes.includes(normalized as any) ? normalized : 'learning-note';
}

function slugify(value: string, fallbackId = '') {
  const slug = String(value || '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  const compactId = fallbackId.replace(/-/g, '').slice(-12);
  if (slug && !(slug === 'untitled' && compactId)) return slug;
  return compactId ? `notion-${compactId}` : 'untitled';
}

function normalizePropertyName(value: string) {
  return String(value || '').toLowerCase().replace(/[\s_-]+/g, '').trim();
}

function splitList(value: string) {
  return String(value || '').split(/[,/|]/).map((item) => item.trim()).filter(Boolean);
}

function emptyToUndefined(value: string) {
  return value || undefined;
}

function unique(values: string[]) {
  return [...new Set(values)];
}

function yamlValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.length ? `\n${value.map((item) => `  - ${yamlScalar(item)}`).join('\n')}` : '[]';
  }
  return yamlScalar(value);
}

function yamlScalar(value: unknown) {
  if (typeof value === 'boolean' || typeof value === 'number') return String(value);
  return JSON.stringify(String(value).replace(/\s+/g, ' ').trim());
}

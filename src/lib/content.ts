import { getCollection } from 'astro:content';

const statusRank: Record<string, number> = {
  growing: 0,
  stable: 1,
  seed: 2,
  archived: 3,
};

const groupOrder = ['research', 'ml', 'product', 'archived'];
const featuredOrder = [
  'wildlifevision-baseline',
  'be-more-duck',
  'architag-vlm-labeling',
  'oulad-at-risk-prediction',
];

export async function getAllProjects() {
  const projects = await getCollection('projects');
  return projects.sort((a, b) => {
    const groupDelta = groupOrder.indexOf(a.data.group) - groupOrder.indexOf(b.data.group);
    if (groupDelta !== 0) return groupDelta;
    const statusDelta = statusRank[a.data.status] - statusRank[b.data.status];
    if (statusDelta !== 0) return statusDelta;
    return a.data.title.localeCompare(b.data.title);
  });
}

export async function getProjectsByGroup() {
  const projects = await getAllProjects();
  return groupOrder.map((group) => ({
    group,
    projects: projects.filter((project) => project.data.group === group),
  }));
}

export async function getFeaturedProjects() {
  const projects = await getCollection('projects');
  const featured = projects
    .filter((project) => project.data.featured)
    .sort((a, b) => featuredOrder.indexOf(a.data.slug) - featuredOrder.indexOf(b.data.slug));

  if (featured.length !== 4 || featured.some((project, index) => project.data.slug !== featuredOrder[index])) {
    throw new Error(`Home featured projects must be exactly: ${featuredOrder.join(', ')}`);
  }

  return featured;
}

export async function getAllNotes() {
  const notes = await getCollection('notes');
  return notes.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export async function getRecentNotes(limit = 4) {
  const notes = await getAllNotes();
  return notes.slice(0, limit);
}

export async function getLatestWeeklyBrief() {
  const notes = await getAllNotes();
  return notes.find((note) => note.data.type === 'weekly-brief');
}

export async function getAllPrograms() {
  const programs = await getCollection('researchPrograms');
  return programs.sort((a, b) => a.data.title.localeCompare(b.data.title));
}

export async function getFeaturedPrograms() {
  const programs = await getAllPrograms();
  return programs.filter((program) => program.data.featured);
}

export async function getArchiveEntries() {
  const archive = await getCollection('archive');
  return archive.sort((a, b) => a.data.order - b.data.order);
}

export async function resolveProject(slug?: string) {
  if (!slug) return undefined;
  const projects = await getCollection('projects');
  return projects.find((project) => project.data.slug === slug);
}

export async function resolveProgram(id?: string) {
  if (!id) return undefined;
  const programs = await getCollection('researchPrograms');
  return programs.find((program) => program.data.id === id);
}

export async function resolveNotes(slugs: string[] = []) {
  const notes = await getCollection('notes');
  const resolved = slugs
    .map((slug) => notes.find((note) => note.data.slug === slug))
    .filter((note): note is NonNullable<typeof note> => Boolean(note));

  return resolved;
}

export async function validateContentLinks() {
  const [projects, notes, programs] = await Promise.all([
    getCollection('projects'),
    getCollection('notes'),
    getCollection('researchPrograms'),
  ]);

  const projectSlugs = new Set(projects.map((project) => project.data.slug));
  const noteSlugs = new Set(notes.map((note) => note.data.slug));
  const errors: string[] = [];

  for (const project of projects) {
    if (project.data.group === 'archived' && project.data.status !== 'archived') {
      errors.push(`${project.data.slug}: group archived must have status archived`);
    }
    for (const slug of project.data.relatedNotes) {
      if (!noteSlugs.has(slug)) errors.push(`${project.data.slug}: missing related note ${slug}`);
    }
  }

  for (const note of notes) {
    if (note.data.relatedProject && !projectSlugs.has(note.data.relatedProject)) {
      errors.push(`${note.data.slug}: missing related project ${note.data.relatedProject}`);
    }
    for (const slug of note.data.relatedNotes) {
      if (!noteSlugs.has(slug)) errors.push(`${note.data.slug}: missing related note ${slug}`);
    }
  }

  for (const program of programs) {
    for (const slug of program.data.relatedProjects) {
      if (!projectSlugs.has(slug)) errors.push(`${program.data.id}: missing related project ${slug}`);
    }
    for (const slug of program.data.relatedNotes) {
      if (!noteSlugs.has(slug)) errors.push(`${program.data.id}: missing related note ${slug}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Content reference errors:\n${errors.join('\n')}`);
  }
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date);
}

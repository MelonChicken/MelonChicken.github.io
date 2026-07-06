// src/content/config.ts
// Astro 5 content layer. Each entry's `id` == filename (== the `slug` field),
// so cross-references (relatedNotes / relatedProject / relatedProjects) are
// resolved by matching slugs to entry ids.
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const status = z.enum(['idea', 'work-in-progress', 'completed', 'archived']);
const url = z.string().url().or(z.literal('')).optional();

const projects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    generated: z.boolean().optional(),
    status,                                   // idea | work-in-progress | completed | archived
    date: z.coerce.date().optional(),
    group: z.enum(['research', 'ml', 'product', 'archived']),
    domain: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    program: z.string().optional(),           // research-program id (abx, pose, label, video, sys)
    stack: z.array(z.string()).default([]),
    roles: z.array(z.string()).default([]),
    dataset: z.string().optional(),
    output: z.string().optional(),
    repo: url,
    repoPrivate: z.boolean().optional(),
    deploy: url,
    demo: url,
    notion: url,
    relatedNotes: z.array(z.string()).default([]),
    featured: z.boolean().default(false),     // Home shows featured projects
    summary: z.string().optional(),
    problem: z.string().optional(),
  }),
});

const notes = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    generated: z.boolean().optional(),
    type: z.enum([
      'weekly-brief', 'paper-review', 'experiment-log',
      'implementation-note', 'learning-note', 'retrospective',
    ]),
    status,
    domain: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    methods: z.array(z.string()).default([]),
    date: z.coerce.date(),
    readTime: z.number().optional(),
    relatedProject: z.string().optional().or(z.literal('')),
    relatedNotes: z.array(z.string()).default([]),
    sourceNotes: z.array(z.string()).default([]),
    notion: url,
    summary: z.string().optional(),
    // weekly-brief only:
    trackedFields: z.array(z.string()).optional(),
    outputs: z.array(z.string()).optional(),
    selectedForReview: z.string().optional(),
    next: z.string().optional(),
  }),
});

const researchPrograms = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/research-programs' }),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    status,
    statusLabel: z.string().optional(),
    question: z.string(),
    matters: z.string(),
    methods: z.array(z.string()).default([]),
    relatedProjects: z.array(z.string()).default([]),
    relatedNotes: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
  }),
});

const archive = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/archive' }),
  schema: z.object({
    category: z.string(),
    order: z.number().default(0),
  }),
});

export const collections = { projects, notes, researchPrograms, archive };

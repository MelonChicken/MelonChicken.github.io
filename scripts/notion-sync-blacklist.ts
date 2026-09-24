import type { SyncTargetKey } from './notion-client';

type BlacklistCandidate = {
  target: SyncTargetKey;
  title: string;
  slug: string;
  type: string;
};

// Keep this list explicit and reviewable. Add exact slugs here when a single
// Notion page must never be published, even if it is marked Published.
export const notionSyncBlacklist = {
  exactSlugs: new Set<string>([]),
  noteTypes: new Set(['weekly-brief', 'weekly-report']),
  titlePatterns: [
    /\bweekly[\s_-]*(brief|report)\b/i,
    /주간[\s_-]*(브리프|리포트|보고서)/i,
  ],
};

export function getNotionBlacklistReason(candidate: BlacklistCandidate) {
  if (notionSyncBlacklist.exactSlugs.has(candidate.slug)) return `slug:${candidate.slug}`;

  if (candidate.target === 'notes' && notionSyncBlacklist.noteTypes.has(candidate.type)) {
    return `type:${candidate.type}`;
  }

  const matchedPattern = notionSyncBlacklist.titlePatterns.find((pattern) => pattern.test(candidate.title));
  return matchedPattern ? `title:${matchedPattern.source}` : '';
}

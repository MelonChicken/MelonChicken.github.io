import assert from 'node:assert/strict';
import { NotionToMarkdown } from 'notion-to-md';
import { getNotionBlacklistReason } from './notion-sync-blacklist';

const n2m = new NotionToMarkdown({ notionClient: {} as any });
const annotations = {
  bold: false,
  italic: false,
  strikethrough: false,
  underline: false,
  code: false,
  color: 'default' as const,
};

assert.equal(n2m.annotatePlainText('literal **bold** marker', annotations), 'literal **bold** marker');
assert.equal(
  getNotionBlacklistReason({
    target: 'notes',
    title: 'Animal Behaviour Analysis Weekly Brief',
    slug: 'animal-behaviour-analysis-weekly-brief',
    type: 'learning-note',
  }),
  'title:\\bweekly[\\s_-]*(brief|report)\\b',
);
assert.equal(
  getNotionBlacklistReason({
    target: 'notes',
    title: 'Ordinary title',
    slug: 'ordinary-title',
    type: 'weekly-report',
  }),
  'type:weekly-report',
);
assert.equal(
  getNotionBlacklistReason({
    target: 'notes',
    title: 'Reading note',
    slug: 'reading-note',
    type: 'learning-note',
  }),
  '',
);

console.log('notion-to-md adapter assertions passed');

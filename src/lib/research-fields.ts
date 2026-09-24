export const researchFields = [
  'Computer Vision',
  'Video Understanding',
  'Self-supervised Learning',
  'ML',
] as const;

export type ResearchField = typeof researchFields[number];

type ResearchFieldInput = {
  title?: string;
  summary?: string;
  domains?: string[];
  tags?: string[];
};

const rules: Array<{ field: ResearchField; terms: RegExp[] }> = [
  {
    field: 'Video Understanding',
    terms: [
      /video/i, /action recognition/i, /temporal/i, /spatiotemporal/i,
      /two[- ]stream/i, /videomae/i, /motion/i,
    ],
  },
  {
    field: 'Self-supervised Learning',
    terms: [
      /self[- ]supervised/i, /representation learning/i, /contrastive/i,
      /masked autoencoder/i, /\bmae\b/i, /\bjepa\b/i, /pretext/i,
    ],
  },
  {
    field: 'Computer Vision',
    terms: [
      /computer vision/i, /vision[- ]language/i, /\bvlm\b/i, /\bclip\b/i,
      /image/i, /visual/i, /vision transformer/i, /\bvit\b/i, /cnn/i,
      /pose estimation/i, /deeplabcut/i, /object detection/i, /segmentation/i,
    ],
  },
];

export function classifyResearchFields(input: ResearchFieldInput): ResearchField[] {
  const source = [
    input.title || '',
    input.summary || '',
    ...(input.domains || []),
    ...(input.tags || []),
  ].join(' ');

  const matches = rules
    .filter((rule) => rule.terms.some((term) => term.test(source)))
    .map((rule) => rule.field);

  return matches.length > 0 ? matches.slice(0, 2) : ['ML'];
}

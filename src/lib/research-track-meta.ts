export type ResearchTrack = {
  slug: string;
  title: string;
  status: 'idea' | 'work-in-progress' | 'completed' | 'archived';
  statusLabel?: string;
  question: string;
  matters: string;
  methods: string[];
  relatedProjects: string[];
  relatedNotes: string[];
  featured: boolean;
};

const trackMeta: Record<string, Omit<ResearchTrack, 'slug'>> = {
  'animal-pose-estimation': {
    title: 'Animal pose estimation & keypoint trajectories',
    status: 'work-in-progress',
    statusLabel: 'active',
    question: 'How can animal body movement be represented from raw video using pose and keypoint trajectories?',
    matters: 'Pose and trajectory representations reduce the complexity of raw video and provide a structured basis for behavior analysis.',
    methods: ['pose estimation', 'keypoints', 'trajectory modeling', 'temporal features'],
    relatedProjects: ['wildlifevision-baseline-scikit-learn', 'wildlife-metadata-fusion'],
    relatedNotes: [],
    featured: true,
  },
  'behavior-recognition': {
    title: 'Behavior recognition from animal video',
    status: 'work-in-progress',
    statusLabel: 'active',
    question: 'How can short and long animal behaviors be classified from video, pose sequences, or multimodal features?',
    matters: 'Behavior recognition connects low-level visual signals to interpretable animal behavior analysis.',
    methods: ['video understanding', 'action recognition', 'temporal modeling', 'sequence classification'],
    relatedProjects: ['be-more-duck-vision-language-embodied-agent'],
    relatedNotes: ['animal-behaviour-analysis-weekly-brief-20260706'],
    featured: true,
  },
  'annotation-efficient-learning': {
    title: 'Annotation-efficient learning',
    status: 'work-in-progress',
    statusLabel: 'active',
    question: 'How can labeling cost be reduced when building animal behavior datasets?',
    matters: 'Animal behavior datasets are expensive to label, so weak supervision, pseudo-labeling, semi-supervised learning, and active learning can make experiments more scalable.',
    methods: ['weak supervision', 'semi-supervised learning', 'pseudo-labeling', 'active learning', 'labeling automation'],
    relatedProjects: ['architag-ai', 'wildlife-metadata-fusion'],
    relatedNotes: ['animal-behaviour-analysis-weekly-brief-2026-06-29'],
    featured: true,
  },
};

export function getResearchTrackMeta(slug: string): ResearchTrack {
  const meta = trackMeta[slug];
  if (meta) return { slug, ...meta };

  return {
    slug,
    title: humanizeTrackSlug(slug),
    status: 'idea',
    statusLabel: 'active',
    question: 'Research track details will be refined from linked Notion content.',
    matters: 'This track is present in the synced project data and can be expanded with track-specific notes and projects.',
    methods: [],
    relatedProjects: [],
    relatedNotes: [],
    featured: false,
  };
}

export function humanizeTrackSlug(slug: string) {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

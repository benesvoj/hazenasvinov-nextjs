export const postStatuses = {
  draft: 'draft',
  published: 'published',
  archived: 'archived',
} as const;

export const postStatusLabels = {
  draft: 'Koncept',
  published: 'Publikováno',
  archived: 'Archivováno',
} as const;

export const adminStatusFilterOptions = {
  all: 'Všechny stavy',
  ...postStatusLabels,
} as const;

// Mapping from filter keys to database values
export const statusFilterToDbValue = {
  all: 'all',
  draft: 'draft',
  published: 'published',
  archived: 'archived',
} as const;

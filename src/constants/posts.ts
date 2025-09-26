/**
 * @deprecated need to be refactored
 */
export const postStatuses = {
  draft: 'draft',
  published: 'published',
  archived: 'archived',
} as const;

/**
 * @deprecated need to be refactored
 */
export const postStatusLabels = {
  draft: 'Koncept',
  published: 'Publikováno',
  archived: 'Archivováno',
} as const;

/**
 * @deprecated need to be refactored
 */
export const adminStatusFilterOptions = {
  all: 'Všechny stavy',
  ...postStatusLabels,
} as const;

/**
 * @deprecated need to be refactored
 */
// Mapping from filter keys to database values
export const statusFilterToDbValue = {
  all: 'all',
  draft: 'draft',
  published: 'published',
  archived: 'archived',
} as const;

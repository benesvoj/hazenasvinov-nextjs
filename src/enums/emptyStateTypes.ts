import {translations} from '@/lib/translations';

const t = translations.common.emptyStateTypes;

export enum EmptyStateTypes {
  TODOS = 'todos',
  POSTS = 'posts',
  USERS = 'users',
  MATCHES = 'matches',
  PHOTOS = 'photos',
  CATEGORIES = 'categories',
  SETTINGS = 'settings',
  COMMITTEES = 'committees',
}

export const EMPTY_STATE_TYPES_LABELS: Record<EmptyStateTypes, string> = {
  [EmptyStateTypes.TODOS]: t.todos,
  [EmptyStateTypes.POSTS]: t.posts,
  [EmptyStateTypes.USERS]: t.users,
  [EmptyStateTypes.MATCHES]: t.matches,
  [EmptyStateTypes.PHOTOS]: t.photos,
  [EmptyStateTypes.CATEGORIES]: t.categories,
  [EmptyStateTypes.SETTINGS]: t.settings,
  [EmptyStateTypes.COMMITTEES]: t.committees,
};

export const getEmptyStateTypeOptions = () => {
  return Object.entries(EMPTY_STATE_TYPES_LABELS).map(([value, label]) => ({
    value: value as EmptyStateTypes,
    label,
  }));
};

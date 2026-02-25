import {translations} from '@/lib/translations/index';

export enum EmptyStateTypes {
  TODOS = 'todos',
  POSTS = 'posts',
  USERS = 'users',
  MATCHES = 'matches',
  PHOTOS = 'photos',
  CATEGORIES = 'categories',
  SETTINGS = 'settings',
  COMMITTEES = 'committees',
  BIRTHDAYS = 'birthdays',
  TRAINING_SESSION = 'trainingSession',
}

export const EMPTY_STATE_TYPES_LABELS: Record<EmptyStateTypes, string> = {
  [EmptyStateTypes.TODOS]: translations.common.emptyStateTypes.todos,
  [EmptyStateTypes.POSTS]: translations.common.emptyStateTypes.posts,
  [EmptyStateTypes.USERS]: translations.common.emptyStateTypes.users,
  [EmptyStateTypes.MATCHES]: translations.common.emptyStateTypes.matches,
  [EmptyStateTypes.PHOTOS]: translations.common.emptyStateTypes.photos,
  [EmptyStateTypes.CATEGORIES]: translations.common.emptyStateTypes.categories,
  [EmptyStateTypes.SETTINGS]: translations.common.emptyStateTypes.settings,
  [EmptyStateTypes.COMMITTEES]: translations.common.emptyStateTypes.committees,
  [EmptyStateTypes.BIRTHDAYS]: translations.common.emptyStateTypes.birthdays,
  [EmptyStateTypes.TRAINING_SESSION]: translations.trainingSessions.noTrainingSession,
};

export const getEmptyStateTypeOptions = () => {
  return Object.entries(EMPTY_STATE_TYPES_LABELS).map(([value, label]) => ({
    value: value as EmptyStateTypes,
    label,
  }));
};

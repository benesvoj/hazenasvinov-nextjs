import {translations} from '@/lib/translations';

const t = translations.common.todoCategory;

export enum TodoCategories {
  FEATURE = 'feature',
  BUG = 'bug',
  IMPROVEMENT = 'improvement',
  TECHNICAL = 'technical',
}

export const TODO_CATEGORIES_LABELS: Record<TodoCategories, string> = {
  [TodoCategories.FEATURE]: t.feature,
  [TodoCategories.BUG]: t.bug,
  [TodoCategories.IMPROVEMENT]: t.improvement,
  [TodoCategories.TECHNICAL]: t.technical,
};

export const getTodoCategoriesOptions = () =>
  Object.entries(TODO_CATEGORIES_LABELS).map(([value, label]) => ({
    value: value as TodoCategories,
    label,
  }));

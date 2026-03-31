import {TodoCategories} from '@/enums/todoCategories';

import {translations} from '@/lib/translations';

export function todoCategoriesLabels() {
  const t = translations.todos.enums.todoCategory;

  return {
    [TodoCategories.FEATURE]: t.feature,
    [TodoCategories.BUG]: t.bug,
    [TodoCategories.IMPROVEMENT]: t.improvement,
    [TodoCategories.TECHNICAL]: t.technical,
  };
}

export const getTodoCategoriesOptions = () => {
  const labels = todoCategoriesLabels();

  return Object.entries(labels).map(([value, label]) => ({
    value: value as TodoCategories,
    label,
  }));
};

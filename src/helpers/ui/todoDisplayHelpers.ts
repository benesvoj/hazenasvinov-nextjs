import {TodoCategories, TodoPriorities, TodoStatuses} from '@/enums';
import {TodoItem} from '@/types';

/**
 * UI helper functions for todo display and formatting
 * These functions handle the presentation layer concerns for todos
 */

/**
 * Get color for todo priority
 */
export const getPriorityColor = (priority: TodoItem['priority']): string => {
  switch (priority) {
    case TodoPriorities.URGENT:
      return 'danger';
    case TodoPriorities.HIGH:
      return 'warning';
    case TodoPriorities.MEDIUM:
      return 'primary';
    case TodoPriorities.LOW:
      return 'default';
    default:
      return 'default';
  }
};

/**
 * Get color for todo status
 */
export const getStatusColor = (status: TodoItem['status']): string => {
  switch (status) {
    case TodoStatuses.DONE:
      return 'success';
    case TodoStatuses.IN_PROGRESS:
      return 'primary';
    case TodoStatuses.TODO:
      return 'default';
    default:
      return 'default';
  }
};

/**
 * Get color for todo category
 */
export const getCategoryColor = (category: TodoItem['category']): string => {
  switch (category) {
    case TodoCategories.FEATURE:
      return 'success';
    case TodoCategories.BUG:
      return 'danger';
    case TodoCategories.IMPROVEMENT:
      return 'primary';
    case TodoCategories.TECHNICAL:
      return 'secondary';
    default:
      return 'default';
  }
};

/**
 * Get CSS classes for priority styling
 */
export const getPriorityClasses = (priority: TodoItem['priority']): string => {
  const color = getPriorityColor(priority);
  return `text-${color}-600 dark:text-${color}-400`;
};

/**
 * Get CSS classes for status styling
 */
export const getTodoStatusClasses = (status: TodoItem['status']): string => {
  const color = getStatusColor(status);
  return `text-${color}-600 dark:text-${color}-400`;
};

/**
 * Get CSS classes for category styling
 */
export const getCategoryClasses = (category: TodoItem['category']): string => {
  const color = getCategoryColor(category);
  return `text-${color}-600 dark:text-${color}-400`;
};

/**
 * Get badge variant for priority
 */
export const getPriorityBadgeVariant = (priority: TodoItem['priority']): string => {
  switch (priority) {
    case TodoPriorities.URGENT:
      return 'solid';
    case TodoPriorities.HIGH:
      return 'bordered';
    case TodoPriorities.MEDIUM:
      return 'flat';
    case TodoPriorities.LOW:
      return 'faded';
    default:
      return 'faded';
  }
};

/**
 * Get badge variant for status
 */
export const getStatusBadgeVariant = (status: TodoItem['status']): string => {
  switch (status) {
    case TodoStatuses.DONE:
      return 'solid';
    case TodoStatuses.IN_PROGRESS:
      return 'bordered';
    case TodoStatuses.TODO:
      return 'flat';
    default:
      return 'flat';
  }
};

/**
 * Get badge variant for category
 */
export const getCategoryBadgeVariant = (category: TodoItem['category']): string => {
  switch (category) {
    case TodoCategories.FEATURE:
      return 'solid';
    case TodoCategories.BUG:
      return 'bordered';
    case TodoCategories.IMPROVEMENT:
      return 'flat';
    case TodoCategories.TECHNICAL:
      return 'faded';
    default:
      return 'faded';
  }
};

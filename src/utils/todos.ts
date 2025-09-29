import {TodoCategories, TodoPriorities, TodoStatuses} from '@/enums';
import {TodoItem} from '@/types';

export const getPriorityColor = (priority: TodoItem['priority']) => {
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

export const getStatusColor = (status: TodoItem['status']) => {
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

export const getCategoryColor = (category: TodoItem['category']) => {
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
 *
 * @default use getTodoPrioritiesOptions
 */
export const getPriorityLabel = (priority: TodoItem['priority']) => {
  switch (priority) {
    case TodoPriorities.URGENT:
      return 'Urgent';
    case TodoPriorities.HIGH:
      return 'High';
    case TodoPriorities.MEDIUM:
      return 'Medium';
    case TodoPriorities.LOW:
      return 'Low';
    default:
      return 'Unknown';
  }
};

/**
 *
 * @default use getTodoStatusesOptions
 */
export const getStatusLabel = (status: TodoItem['status']) => {
  switch (status) {
    case 'done':
      return 'Done';
    case 'in-progress':
      return 'In Progress';
    case 'todo':
      return 'To Do';
    default:
      return 'Unknown';
  }
};

/**
 *
 * @default use getTodoCategoriesOptions
 */
export const getCategoryLabel = (category: TodoItem['category']) => {
  switch (category) {
    case 'feature':
      return 'Feature';
    case 'bug':
      return 'Bug';
    case 'improvement':
      return 'Improvement';
    case 'technical':
      return 'Technical';
    default:
      return 'Unknown';
  }
};

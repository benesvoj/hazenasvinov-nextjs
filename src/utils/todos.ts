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

// Note: For labels, use the enum options instead:
// - getTodoPrioritiesOptions() for priority labels
// - getTodoStatusesOptions() for status labels
// - getTodoCategoriesOptions() for category labels

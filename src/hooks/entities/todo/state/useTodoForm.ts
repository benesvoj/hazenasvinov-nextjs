'use client';

import {translations} from '@/lib/translations/index';

import {TodoCategories, TodoPriorities, TodoStatuses} from '@/enums';
import {createFormHook} from '@/hooks';
import {TodoFormData, TodoItem} from '@/types';

const initialFormData: TodoFormData = {
  title: '',
  description: '',
  priority: TodoPriorities.MEDIUM,
  status: TodoStatuses.TODO,
  category: TodoCategories.IMPROVEMENT,
  due_date: new Date().toISOString().split('T')[0],
  user_email: '',
  assigned_to: '',
  created_by: '',
};

export function useTodoForm() {
  return createFormHook<TodoItem, TodoFormData>({
    initialFormData,
    validationRules: [
      {field: 'title', message: translations.todos.responseMessages.mandatoryTitle},
      {field: 'description', message: translations.todos.responseMessages.mandatoryDescription},
    ],
  })();
}

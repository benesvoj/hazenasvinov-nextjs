'use client';

import {TodoCategories, TodoPriorities, TodoStatuses} from '@/enums';
import {createFormHook} from '@/hooks';
import {translations} from '@/lib';
import {TodoFormData, TodoItem} from '@/types';

const t = translations.admin.todos.responseMessages;

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
      {field: 'title', message: t.mandatoryTitle},
      {field: 'description', message: t.mandatoryDescription},
    ],
  })();
}

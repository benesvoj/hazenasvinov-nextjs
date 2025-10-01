import {translations} from '@/lib/translations';

import {UnifiedCard} from '@/components';
import {ActionTypes, TodoStatuses} from '@/enums';
import {
  getPriorityLabel,
  getStatusLabel,
  getCategoryLabel,
  getStatusIcon,
  getPriorityIcon,
  getCategoryIcon,
  formatDateString,
} from '@/helpers';
import {TodoListItemProps} from '@/types';

export const TodoListItem = ({
  todo,
  handleEditTodo,
  updateTodoStatus,
  deleteTodo,
}: TodoListItemProps) => {
  const t = translations;
  const tAction = translations.action;

  const todoListItemSubtitle = (
    <div className="flex items-center gap-2 mb-2">
      <div
        className="flex items-center gap-1"
        title={`${t.common.todoList.item.priority}: ${getPriorityLabel(todo.priority)}`}
      >
        {getPriorityIcon(todo.priority)}
        <span className="text-xs text-gray-500">{getPriorityLabel(todo.priority)}</span>
      </div>
      <div
        className="flex items-center gap-1"
        title={`${t.common.todoList.item.status}: ${getStatusLabel(todo.status)}`}
      >
        {getStatusIcon(todo.status)}
        <span className="text-xs text-gray-500">{getStatusLabel(todo.status)}</span>
      </div>
      <div
        className="flex items-center gap-1"
        title={`${t.common.todoList.item.category}: ${getCategoryLabel(todo.category)}`}
      >
        {getCategoryIcon(todo.category)}
        <span className="text-xs text-gray-500">{getCategoryLabel(todo.category)}</span>
      </div>
    </div>
  );

  const todoListItemFooter = (
    <div className="grid gap-4 text-xs text-gray-500 mt-3 grid-cols-1 md:grid-cols-12">
      {todo.due_date && (
        <div className="md:col-span-3 min-w-0">
          <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t.common.todoList.item.dueDate}
          </div>
          <div className="truncate">{todo.due_date}</div>
        </div>
      )}
      <div className={`min-w-0 ${todo.due_date ? 'md:col-span-6' : 'md:col-span-8'}`}>
        <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t.common.createdBy}
        </div>
        <div className="truncate">{todo.user_email}</div>
      </div>
      <div className={`min-w-0 ${todo.due_date ? 'md:col-span-3' : 'md:col-span-4'}`}>
        <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t.common.createdAt}
        </div>
        <div className="truncate">{formatDateString(todo.created_at)}</div>
      </div>
    </div>
  );

  return (
    <UnifiedCard
      key={todo.id}
      title={todo.title}
      titleSize={4}
      subtitle={todoListItemSubtitle}
      footer={todoListItemFooter}
      actions={[
        {
          label: tAction.edit,
          onClick: () => handleEditTodo(todo),
          variant: 'light',
          buttonType: ActionTypes.UPDATE,
          isIconOnly: true,
          isDisabled: todo.status !== TodoStatuses.TODO,
        },
        {
          label: tAction.statusTransition,
          buttonType: ActionTypes.STATUS_TRANSITION,
          statusTransition: {
            currentStatus: todo.status,
            onStatusChange: updateTodoStatus,
            itemId: todo.id,
          },
        },
        {
          label: tAction.delete,
          onClick: () => deleteTodo(todo.id),
          variant: 'light',
          buttonType: ActionTypes.DELETE,
          color: 'danger',
          isIconOnly: true,
          isDisabled: todo.status !== TodoStatuses.TODO,
        },
      ]}
    >
      {todo.description ? (
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{todo.description}</p>
      ) : (
        <></>
      )}
    </UnifiedCard>
  );
};

import {Card, CardBody, Button} from '@heroui/react';

import {PencilIcon, TrashIcon} from '@heroicons/react/24/outline';

import {showToast} from '@/components';
import {TodoStatuses} from '@/enums';
import {
  getPriorityLabel,
  getStatusLabel,
  getCategoryLabel,
  getStatusIcon,
  getPriorityIcon,
  getCategoryIcon,
  getNextStatus,
  getStatusButtonInfo,
} from '@/helpers';
import {TodoItem} from '@/types';

export interface TodoListItemProps {
  todo: TodoItem;
  handleEditTodo: (todo: TodoItem) => void;
  updateTodoStatus: (id: string, status: TodoStatuses) => void;
  deleteTodo: (id: string) => void;
}

export const TodoListItem = ({
  todo,
  handleEditTodo,
  updateTodoStatus,
  deleteTodo,
}: TodoListItemProps) => {
  return (
    <Card key={todo.id} className="hover:shadow-md transition-shadow">
      <CardBody>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="flex items-center gap-1"
                title={`Priority: ${getPriorityLabel(todo.priority)}`}
              >
                {getPriorityIcon(todo.priority)}
                <span className="text-xs text-gray-500">{getPriorityLabel(todo.priority)}</span>
              </div>
              <div
                className="flex items-center gap-1"
                title={`Status: ${getStatusLabel(todo.status)}`}
              >
                {getStatusIcon(todo.status)}
                <span className="text-xs text-gray-500">{getStatusLabel(todo.status)}</span>
              </div>
              <div
                className="flex items-center gap-1"
                title={`Category: ${getCategoryLabel(todo.category)}`}
              >
                {getCategoryIcon(todo.category)}
                <span className="text-xs text-gray-500">{getCategoryLabel(todo.category)}</span>
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{todo.title}</h3>
            {todo.description && (
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{todo.description}</p>
            )}
            <div className="grid gap-4 text-xs text-gray-500 mt-3 grid-cols-1 md:grid-cols-12">
              {todo.due_date && (
                <div className="md:col-span-3 min-w-0">
                  <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</div>
                  <div className="truncate">{todo.due_date}</div>
                </div>
              )}
              <div className={`min-w-0 ${todo.due_date ? 'md:col-span-6' : 'md:col-span-8'}`}>
                <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Created by</div>
                <div className="truncate">{todo.user_email}</div>
              </div>
              <div className={`min-w-0 ${todo.due_date ? 'md:col-span-3' : 'md:col-span-4'}`}>
                <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Created</div>
                <div className="truncate">
                  {new Date(todo.created_at).toLocaleDateString('en-CA', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  })}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="light"
              color="primary"
              isIconOnly
              onPress={() => handleEditTodo(todo)}
              title="Edit todo"
            >
              <PencilIcon className="w-4 h-4" />
            </Button>

            {/* Status transition button */}
            {(() => {
              const buttonInfo = getStatusButtonInfo(todo.status);
              if (!buttonInfo) return null;

              return (
                <Button
                  size="sm"
                  variant="light"
                  color={buttonInfo.color}
                  isIconOnly
                  onPress={() => {
                    const nextStatus = getNextStatus(todo.status);
                    if (nextStatus) {
                      showToast.success(
                        `Todo moved from ${getStatusLabel(todo.status)} to ${getStatusLabel(nextStatus)}`
                      );
                      updateTodoStatus(todo.id, nextStatus);
                    }
                  }}
                  title={`${buttonInfo.text} todo`}
                >
                  {buttonInfo.icon}
                </Button>
              );
            })()}

            <Button
              size="sm"
              variant="light"
              color="danger"
              isIconOnly
              onPress={() => deleteTodo(todo.id)}
              title="Delete todo"
            >
              <TrashIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

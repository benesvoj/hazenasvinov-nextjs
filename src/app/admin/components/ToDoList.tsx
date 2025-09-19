import {Card, CardHeader, CardBody, Button} from '@heroui/react';
import {
  ClockIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  FireIcon,
  FlagIcon,
  BoltIcon,
  WrenchScrewdriverIcon,
  BugAntIcon,
  SparklesIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import {TodoItem, getPriorityLabel, getStatusLabel, getCategoryLabel} from '@/utils/todos';
import {LoadingSpinner} from '@/components';
import {PencilIcon, CheckCircleIcon, TrashIcon} from '@heroicons/react/24/outline';

interface ToDoListProps {
  todos: TodoItem[];
  todosLoading: boolean;
  handleAddTodo: () => void;
  updateTodoStatus: (id: string, status: string) => void;
  deleteTodo: (id: string) => void;
  handleEditTodo: (todo: TodoItem) => void;
}

const getStatusIcon = (status: TodoItem['status']) => {
  switch (status) {
    case 'done':
      return <CheckCircleIcon className="w-4 h-4" />;
    case 'in-progress':
      return <ClockIcon className="w-4 h-4" />;
    case 'todo':
      return <ExclamationTriangleIcon className="w-4 h-4" />;
    default:
      return <ExclamationTriangleIcon className="w-4 h-4" />;
  }
};

const getPriorityIcon = (priority: TodoItem['priority']) => {
  switch (priority) {
    case 'urgent':
      return <FireIcon className="w-4 h-4" />;
    case 'high':
      return <FlagIcon className="w-4 h-4" />;
    case 'medium':
      return <BoltIcon className="w-4 h-4" />;
    case 'low':
      return <ExclamationTriangleIcon className="w-4 h-4" />;
    default:
      return <BoltIcon className="w-4 h-4" />;
  }
};

const getCategoryIcon = (category: TodoItem['category']) => {
  switch (category) {
    case 'feature':
      return <SparklesIcon className="w-4 h-4" />;
    case 'bug':
      return <BugAntIcon className="w-4 h-4" />;
    case 'improvement':
      return <WrenchScrewdriverIcon className="w-4 h-4" />;
    case 'technical':
      return <Cog6ToothIcon className="w-4 h-4" />;
    default:
      return <WrenchScrewdriverIcon className="w-4 h-4" />;
  }
};

export default function ToDoList({
  todos,
  todosLoading,
  handleAddTodo,
  updateTodoStatus,
  deleteTodo,
  handleEditTodo,
}: ToDoListProps) {
  return (
    <div>
      <Card>
        <CardHeader className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-semibold">Todo List ({todos.length})</h2>
          </div>
          <Button
            color="primary"
            size="sm"
            isIconOnly
            aria-label="Add Todo"
            startContent={<PlusIcon className="w-4 h-4" />}
            onPress={handleAddTodo}
          />
        </CardHeader>
        <CardBody>
          {todosLoading ? (
            <div className="text-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="space-y-4 max-h-64 overflow-y-auto p-2">
              {todos
                .sort((a, b) => {
                  // First sort by priority (urgent > high > medium > low)
                  const priorityOrder = {urgent: 0, high: 1, medium: 2, low: 3};
                  const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
                  if (priorityDiff !== 0) return priorityDiff;

                  // Then sort by due date (earliest first, null dates last)
                  if (!a.due_date && !b.due_date) return 0;
                  if (!a.due_date) return 1;
                  if (!b.due_date) return -1;
                  return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
                })
                .map((todo) => (
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
                              <span className="text-xs text-gray-500">
                                {getPriorityLabel(todo.priority)}
                              </span>
                            </div>
                            <div
                              className="flex items-center gap-1"
                              title={`Status: ${getStatusLabel(todo.status)}`}
                            >
                              {getStatusIcon(todo.status)}
                              <span className="text-xs text-gray-500">
                                {getStatusLabel(todo.status)}
                              </span>
                            </div>
                            <div
                              className="flex items-center gap-1"
                              title={`Category: ${getCategoryLabel(todo.category)}`}
                            >
                              {getCategoryIcon(todo.category)}
                              <span className="text-xs text-gray-500">
                                {getCategoryLabel(todo.category)}
                              </span>
                            </div>
                          </div>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            {todo.title}
                          </h3>
                          {todo.description && (
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                              {todo.description}
                            </p>
                          )}
                          <div className="grid gap-4 text-xs text-gray-500 mt-3 grid-cols-1 md:grid-cols-12">
                            {todo.due_date && (
                              <div className="md:col-span-3 min-w-0">
                                <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Due Date
                                </div>
                                <div className="truncate">{todo.due_date}</div>
                              </div>
                            )}
                            <div
                              className={`min-w-0 ${todo.due_date ? 'md:col-span-6' : 'md:col-span-8'}`}
                            >
                              <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Created by
                              </div>
                              <div className="truncate">{todo.user_email}</div>
                            </div>
                            <div
                              className={`min-w-0 ${todo.due_date ? 'md:col-span-3' : 'md:col-span-4'}`}
                            >
                              <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Created
                              </div>
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
                          >
                            <PencilIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="light"
                            color="success"
                            isIconOnly
                            onPress={() => updateTodoStatus(todo.id, 'done')}
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="light"
                            color="danger"
                            isIconOnly
                            onPress={() => deleteTodo(todo.id)}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              {todos.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No todos found. Create your first todo!
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

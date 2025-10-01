import {Card, CardBody} from '@heroui/react';

import {
  ClockIcon,
  FireIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

import {UseTodosReturn} from '@/hooks/admin/useTodos';

import {translations} from '@/lib/translations';

import {TodoFilter} from '@/enums';

export const TodoStatsCards = ({todos}: {todos: UseTodosReturn}) => {
  const t = translations.common.todoFilter;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card
        className={`cursor-pointer transition-all hover:shadow-lg ${todos.todoFilter === TodoFilter.TODO ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
      >
        <CardBody
          className="text-center"
          onClick={() =>
            todos.setTodoFilter(
              todos.todoFilter === TodoFilter.TODO ? TodoFilter.ALL : TodoFilter.TODO
            )
          }
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <ExclamationTriangleIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600">{todos.todoStats.todo}</div>
          <div className="text-sm text-gray-600">{t.todo}</div>
        </CardBody>
      </Card>
      <Card
        className={`cursor-pointer transition-all hover:shadow-lg ${todos.todoFilter === TodoFilter.IN_PROGRESS ? 'ring-2 ring-orange-500 bg-orange-50' : ''}`}
      >
        <CardBody
          className="text-center"
          onClick={() =>
            todos.setTodoFilter(
              todos.todoFilter === TodoFilter.IN_PROGRESS ? TodoFilter.ALL : TodoFilter.IN_PROGRESS
            )
          }
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <ClockIcon className="w-6 h-6 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-orange-600">{todos.todoStats.inProgress}</div>
          <div className="text-sm text-gray-600">{t.in_progress}</div>
        </CardBody>
      </Card>
      <Card
        className={`cursor-pointer transition-all hover:shadow-lg ${todos.todoFilter === TodoFilter.DONE ? 'ring-2 ring-green-500 bg-green-50' : ''}`}
      >
        <CardBody
          className="text-center"
          onClick={() =>
            todos.setTodoFilter(
              todos.todoFilter === TodoFilter.DONE ? TodoFilter.ALL : TodoFilter.DONE
            )
          }
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircleIcon className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-600">{todos.todoStats.done}</div>
          <div className="text-sm text-gray-600">{t.done}</div>
        </CardBody>
      </Card>
      <Card
        className={`cursor-pointer transition-all hover:shadow-lg ${todos.todoFilter === TodoFilter.HIGH_PRIORITY ? 'ring-2 ring-red-500 bg-red-50' : ''}`}
      >
        <CardBody
          className="text-center"
          onClick={() =>
            todos.setTodoFilter(
              todos.todoFilter === TodoFilter.HIGH_PRIORITY
                ? TodoFilter.ALL
                : TodoFilter.HIGH_PRIORITY
            )
          }
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <FireIcon className="w-6 h-6 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-600">{todos.todoStats.highPriority}</div>
          <div className="text-sm text-gray-600">{t.high_priority}</div>
        </CardBody>
      </Card>
    </div>
  );
};

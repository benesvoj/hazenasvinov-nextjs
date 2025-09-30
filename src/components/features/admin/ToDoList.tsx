'use client';

import {useState, useMemo, useEffect} from 'react';

import {Card, CardHeader, CardBody, Button, Pagination} from '@heroui/react';

import {PlusCircleIcon} from '@heroicons/react/16/solid';
import {PencilIcon, TrashIcon} from '@heroicons/react/24/outline';

import {LoadingSpinner, showToast, UnifiedCard, TodoListItem} from '@/components';
import {EmptyStateTypes, TodoFilter} from '@/enums';
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
import {ToDoListProps} from '@/types';

export default function ToDoList({
  todos,
  todosLoading,
  handleAddTodo,
  updateTodoStatus,
  deleteTodo,
  handleEditTodo,
  currentFilter = TodoFilter.ALL,
}: ToDoListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Sort todos first (todos are already filtered by parent component)
  const sortedTodos = useMemo(() => {
    return [...todos].sort((a, b) => {
      // First sort by priority (urgent > high > medium > low)
      const priorityOrder = {urgent: 0, high: 1, medium: 2, low: 3};
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then sort by due date (earliest first, null dates last)
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
  }, [todos]);

  // Calculate pagination
  const totalPages = Math.ceil(sortedTodos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTodos = sortedTodos.slice(startIndex, endIndex);

  // Reset to first page when todos change
  useEffect(() => {
    setCurrentPage(1);
  }, [todos.length]);

  const todoCardTitle = `Todo List (${todos.length})`;
  const todoCardCurrentFilter =
    currentFilter !== TodoFilter.ALL ? `- Filtered by ${currentFilter.replace('-', ' ')}` : '';
  const todoCardTotalPages = totalPages > 1 ? `(Page ${currentPage} of ${totalPages})` : '';

  const todoCardFooter = !todosLoading && totalPages > 1 && (
    <div className="flex justify-center p-4 border-t">
      <Pagination
        total={totalPages}
        page={currentPage}
        onChange={setCurrentPage}
        showControls
        showShadow
        color="primary"
      />
    </div>
  );

  return (
    <div>
      <UnifiedCard
        title={`${todoCardTitle} ${todoCardCurrentFilter} ${todoCardTotalPages}`}
        titleSize={2}
        footer={todoCardFooter}
        isLoading={todosLoading}
        emptyStateType={EmptyStateTypes.TODOS}
      >
        <div className="space-y-4 overflow-y-auto p-2">
          {paginatedTodos.map((todo) => (
            <TodoListItem
              key={todo.id}
              todo={todo}
              handleEditTodo={handleEditTodo}
              updateTodoStatus={updateTodoStatus}
              deleteTodo={deleteTodo}
            />
          ))}
        </div>
      </UnifiedCard>
      <Card>
        <CardHeader className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 text-blue-500">📝</div>
            <h2 className="text-xl font-semibold">
              Todo List ({todos.length})
              {currentFilter !== TodoFilter.ALL && (
                <span className="text-sm font-normal text-blue-600 ml-2">
                  - Filtered by {currentFilter.replace('-', ' ')}
                </span>
              )}
              {totalPages > 1 && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  (Page {currentPage} of {totalPages})
                </span>
              )}
            </h2>
          </div>
          <Button
            color="primary"
            size="sm"
            isIconOnly
            aria-label="Add Todo"
            startContent={<PlusCircleIcon className="w-4 h-4" />}
            onPress={handleAddTodo}
          />
        </CardHeader>
        <CardBody>
          {todosLoading ? (
            <div className="text-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="space-y-4 overflow-y-auto p-2">
              {paginatedTodos.map((todo) => (
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
              ))}
              {todos.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No todos found. Create your first todo!
                </div>
              )}
            </div>
          )}
        </CardBody>
        {!todosLoading && totalPages > 1 && (
          <div className="flex justify-center p-4 border-t">
            <Pagination
              total={totalPages}
              page={currentPage}
              onChange={setCurrentPage}
              showControls
              showShadow
              color="primary"
            />
          </div>
        )}
      </Card>
    </div>
  );
}

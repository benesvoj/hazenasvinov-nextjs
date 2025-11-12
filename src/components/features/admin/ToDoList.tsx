'use client';

import {useState, useMemo, useEffect} from 'react';

import {Pagination} from '@heroui/react';

import {RectangleStackIcon} from '@heroicons/react/24/outline';

import {translations} from '@/lib/translations';

import {UnifiedCard, TodoListItem} from '@/components';
import {ActionTypes, EmptyStateTypes, TodoFilter} from '@/enums';
import {ToDoListProps} from '@/types';

export default function ToDoList({
  todos,
  todosLoading,
  handleAddTodo,
  updateTodoStatus,
  deleteTodo,
  handleEditTodo,
}: ToDoListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const t = translations.common;

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

  const todoCardTitle = (
    <>
      <RectangleStackIcon className="w-5 h-5 text-green-500" />
      {t.todoList.title} ({todos.length})
    </>
  );

  const todoCardTotalPages =
    totalPages > 1 ? `(${t.page} ${currentPage} ${t.of} ${totalPages})` : '';

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
    <UnifiedCard
      title={todoCardTitle}
      subtitle={todoCardTotalPages}
      titleSize={2}
      footer={todoCardFooter}
      isLoading={todosLoading}
      emptyStateType={todos.length === 0 ? EmptyStateTypes.TODOS : undefined}
      onPress={handleAddTodo}
      actions={[
        {
          label: t.todoList.addTodo,
          onClick: handleAddTodo,
          variant: 'solid',
          buttonType: ActionTypes.CREATE,
        },
      ]}
    >
      <div className="flex flex-col gap-4">
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
  );
}

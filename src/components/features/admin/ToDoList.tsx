'use client';

import {useEffect, useMemo, useState} from 'react';

import {Button, Pagination} from '@heroui/react';

import {RectangleStackIcon} from '@heroicons/react/24/outline';

import {PlusIcon} from "@/lib/icons/PlusIcon";
import {translations} from '@/lib/translations';

import {ContentCard, EmptyState, HStack, TodoListItem, VStack} from '@/components';
import {ToDoListProps} from '@/types';
import {isEmpty} from "@/utils";

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
	const t = translations.todos;

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
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setCurrentPage(1);
	}, [todos.length]);

	const todoCardTitle = (
		<HStack spacing={2}>
			<RectangleStackIcon className="w-5 h-5 text-green-500"/>
			{t.todoList.title} ({todos.length})
		</HStack>
	);

	const todoCardTotalPages =
		totalPages > 1
			? `(${translations.common.page} ${currentPage} ${translations.common.of} ${totalPages})`
			: '';

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

	const actions = (
		<>
			<Button onPress={handleAddTodo} variant={'solid'} startContent={<PlusIcon/>} color={'primary'}>
				{t.todoList.addTodo}
			</Button>
		</>
	)

	const emptyState = (
		<EmptyState
			type={'todos'}
			title={translations.todos.emptyState.title}
			description={translations.todos.emptyState.description}
			action={actions}
		/>
	)

	return (
		<ContentCard
			title={todoCardTitle}
			subtitle={todoCardTotalPages}
			titleSize={2}
			footer={todoCardFooter}
			isLoading={todosLoading}
			emptyState={isEmpty(todos) && emptyState}
			actions={actions}
		>
			<VStack spacing={4}>
				{paginatedTodos.map((todo) => (
					<TodoListItem
						key={todo.id}
						todo={todo}
						handleEditTodo={handleEditTodo}
						updateTodoStatus={updateTodoStatus}
						deleteTodo={deleteTodo}
					/>
				))}
			</VStack>
		</ContentCard>
	);
}

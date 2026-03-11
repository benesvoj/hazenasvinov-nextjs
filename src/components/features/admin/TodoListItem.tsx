'use client';

import {Button} from "@heroui/react";

import {translations} from '@/lib/translations';

import {ContentCard, HStack} from '@/components';
import {TodoStatuses} from '@/enums';
import {
	formatDateString,
	getCategoryIcon,
	getCategoryLabel,
	getNextStatus,
	getPriorityIcon,
	getPriorityLabel,
	getStatusButtonInfo,
	getStatusIcon,
	getStatusLabel,
} from '@/helpers';
import {EditIcon, TrashIcon} from "@/lib";
import {TodoListItemProps} from '@/types';

export const TodoListItem = ({
								 todo,
								 handleEditTodo,
								 updateTodoStatus,
								 deleteTodo,
							 }: TodoListItemProps) => {
	const t = translations.todos;
	const tAction = translations.common.actions;

	const todoItemAfterDueDate = todo.due_date && new Date(todo.due_date) < new Date();

	const todoListItemSubtitle = (
		<div className="flex items-center gap-2 mb-2">
			<div
				className="flex items-center gap-1"
				title={`${t.todoList.item.priority}: ${getPriorityLabel(todo.priority)}`}
			>
				{getPriorityIcon(todo.priority)}
				<span className="text-xs text-gray-500">{getPriorityLabel(todo.priority)}</span>
			</div>
			<div
				className="flex items-center gap-1"
				title={`${t.todoList.item.status}: ${getStatusLabel(todo.status)}`}
			>
				{getStatusIcon(todo.status)}
				<span className="text-xs text-gray-500">{getStatusLabel(todo.status)}</span>
			</div>
			<div
				className="flex items-center gap-1"
				title={`${t.todoList.item.category}: ${getCategoryLabel(todo.category)}`}
			>
				{getCategoryIcon(todo.category)}
				<span className="text-xs text-gray-500">{getCategoryLabel(todo.category)}</span>
			</div>
		</div>
	);

	const todoListItemFooter = (
		<div className="flex justify-between gap-4 text-xs text-gray-500 mt-3 w-full">
			{todo.due_date && (
				<div className="md:col-span-3 min-w-0">
					<div className="font-medium text-gray-700 dark:text-gray-300 mb-1">
						{t.todoList.item.dueDate}
					</div>
					<div className={`${todoItemAfterDueDate ? 'text-red-500' : ''} truncate`}>
						{todo.due_date}
					</div>
				</div>
			)}
			<div className="flex gap-4">
				<div className="flex flex-col min-w-0">
					<div className="font-medium text-gray-700 dark:text-gray-300 mb-1">
						{translations.common.createdBy}
					</div>
					<div className="truncate">{todo.user_email}</div>
				</div>
				<div className="flex flex-col min-w-0">
					<div className="font-medium text-gray-700 dark:text-gray-300 mb-1">
						{translations.common.createdAt}
					</div>
					<div className="truncate">
						{todo.created_at ? formatDateString(todo.created_at) : '-'}
					</div>
				</div>
			</div>
		</div>
	);

	const buttonInfo = getStatusButtonInfo(todo.status);

	const actions = (
		<HStack spacing={0}>
			<Button
				isIconOnly
				isDisabled={todo.status !== TodoStatuses.TODO}
				variant={'light'}
				name={tAction.edit}
				onPress={() => handleEditTodo(todo)}
			>
				<EditIcon className="w-4 h-4"/>
			</Button>
			{buttonInfo && (
				<Button
					isIconOnly
					variant={'light'}
					color={buttonInfo?.color}
					name={buttonInfo?.text || ''}
					onPress={() => {
						const nextStatus = getNextStatus(todo.status);
						if (nextStatus) {
							updateTodoStatus(todo.id, nextStatus);
						}
					}}
					title={`${buttonInfo.text} item`}
				>
					{buttonInfo?.icon}
				</Button>

			)}
			<Button
				isIconOnly
				isDisabled={todo.status !== TodoStatuses.TODO}
				variant={'light'}
				color={'danger'}
				name={tAction.delete}
				onPress={() => deleteTodo(todo.id)}
			>
				<TrashIcon className="w-4 h-4"/>
			</Button>
		</HStack>
	)

	return (
		<ContentCard
			key={todo.id}
			title={todo.title}
			titleSize={4}
			subtitle={todoListItemSubtitle}
			footer={todoListItemFooter}
			className={'w-full'}
			actions={actions}
		>
			{todo.description ? (
				<p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{todo.description}</p>
			) : (
				<></>
			)}
		</ContentCard>
	);
};

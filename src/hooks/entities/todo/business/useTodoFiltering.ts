import {useMemo} from "react";

import {TodoFilter, TodoPriorities, TodoStatuses} from "@/enums";
import {TodoItem, TodoStats} from "@/types";

export interface TodoFilteringProps {
	todos: TodoItem[];
	todoFilter?: TodoFilter;
}

export const useTodoFiltering = ({todos, todoFilter}: TodoFilteringProps) => {

	const filteredTodos = useMemo(() => {
		return todos.filter((todo) => {
			switch (todoFilter) {
				case TodoFilter.TODO:
					return todo.status === TodoStatuses.TODO;
				case TodoFilter.IN_PROGRESS:
					return todo.status === TodoStatuses.IN_PROGRESS;
				case TodoFilter.DONE:
					return todo.status === TodoStatuses.DONE;
				case TodoFilter.HIGH_PRIORITY:
					return (
						(todo.priority === TodoPriorities.HIGH || todo.priority === TodoPriorities.URGENT) &&
						todo.status !== TodoStatuses.DONE
					);
				default:
					return true;
			}
		});
	}, [todos, todoFilter])

	const todoStats: TodoStats = useMemo(() => ({
		total: todos.length,
		todo: todos.filter((t) => t.status === TodoStatuses.TODO).length,
		inProgress: todos.filter((t) => t.status === TodoStatuses.IN_PROGRESS).length,
		done: todos.filter((t) => t.status === TodoStatuses.DONE).length,
		highPriority: todos.filter(
			(t) =>
				(t.priority === TodoPriorities.HIGH || t.priority === TodoPriorities.URGENT) &&
				t.status !== TodoStatuses.DONE
		).length,
	}), [todos])

	return {
		filteredTodos,
		todoStats,
	}
}
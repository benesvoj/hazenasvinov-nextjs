import {CheckCircleIcon, ClockIcon, ExclamationTriangleIcon, FireIcon,} from '@heroicons/react/24/outline';

import {translations} from '@/lib/translations';

import {Grid} from "@/components";
import {TodoFilter} from '@/enums';

import {TodoStatsCard} from "./TodoStatsCard";

interface TodoFilteringProps {
	todoFilter: TodoFilter;
	setTodoFilter: (filter: TodoFilter) => void;
	stats: {
		total: number;
		todo: number;
		inProgress: number;
		done: number;
		highPriority: number;
	};
}

export const TodoStatsList = ({todoFilter, setTodoFilter, stats}: TodoFilteringProps) => {
	const t = translations.todos.enums.todoFilter;

	return (
		<Grid columns={4}>
			<TodoStatsCard
				icon={<ExclamationTriangleIcon className="w-6 h-6 text-blue-600"/>}
				count={stats.todo}
				label={t.todo}
				filter={TodoFilter.TODO}
				activeFilter={todoFilter}
				setTodoFilter={setTodoFilter}
			/>
			<TodoStatsCard
				icon={<ClockIcon className="w-6 h-6 text-orange-600"/>}
				count={stats.inProgress}
				label={t.in_progress}
				filter={TodoFilter.IN_PROGRESS}
				activeFilter={todoFilter}
				setTodoFilter={setTodoFilter}
			/>
			<TodoStatsCard
				icon={<CheckCircleIcon className="w-6 h-6 text-green-600"/>}
				count={stats.done}
				label={t.done}
				filter={TodoFilter.DONE}
				activeFilter={todoFilter}
				setTodoFilter={setTodoFilter}
			/>
			<TodoStatsCard
				icon={<FireIcon className="w-6 h-6 text-red-600"/>}
				count={stats.highPriority}
				label={t.high_priority}
				filter={TodoFilter.HIGH_PRIORITY}
				activeFilter={todoFilter}
				setTodoFilter={setTodoFilter}
			/>
		</Grid>
	);
};

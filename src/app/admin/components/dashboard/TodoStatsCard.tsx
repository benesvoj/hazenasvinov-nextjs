'use client';

import {twMerge} from "tailwind-merge";
import {match} from "ts-pattern";

import {ContentCard, VStack} from "@/components";
import {TodoFilter} from "@/enums";

interface TodoStatsCardProps {
	icon: React.ReactElement;
	count: number;
	label: string;
	filter: TodoFilter;
	activeFilter: TodoFilter;
	setTodoFilter: (filter: TodoFilter) => void;
}


export const TodoStatsCard = (props: TodoStatsCardProps) => {
	const isActive = props.filter === props.activeFilter;

	const classNamesByFilter = match(isActive && props.filter)
		.with(TodoFilter.TODO, () => 'ring-2 ring-blue-500 bg-blue-50')
		.with(TodoFilter.IN_PROGRESS, () => 'ring-2 ring-orange-500 bg-orange-50')
		.with(TodoFilter.DONE, () => 'ring-2 ring-green-500 bg-green-50')
		.with(TodoFilter.HIGH_PRIORITY, () => 'ring-2 ring-red-500 bg-red-50')
		.with(TodoFilter.ALL, () => '')
		.otherwise(() => '');

	const colorByFilter = match(props.filter)
		.with(TodoFilter.TODO, () => 'text-blue-600')
		.with(TodoFilter.IN_PROGRESS, () => 'text-orange-600')
		.with(TodoFilter.DONE, () => 'text-green-600')
		.with(TodoFilter.HIGH_PRIORITY, () => 'text-red-600')
		.otherwise(() => 'text-gray-600');


	return (
		<ContentCard
			className={twMerge(`transition-all hover:shadow-lg ${classNamesByFilter}`)}
			onPress={() => props.setTodoFilter(isActive ? TodoFilter.ALL : props.filter)}
			isPressable
		>
			<VStack spacing={2} justify={'center'}>
				{props.icon}
				<div className={`text-2xl font-bold ${colorByFilter}`}>{props.count}</div>
				<div className="text-sm text-gray-600">{props.label}</div>
			</VStack>
		</ContentCard>
	)
}
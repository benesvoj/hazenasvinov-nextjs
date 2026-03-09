import {
	CalendarIcon,
	ChatBubbleLeftRightIcon,
	CheckCircleIcon,
	CogIcon,
	DocumentTextIcon,
	PhotoIcon,
	TrophyIcon,
	UserGroupIcon,
} from '@heroicons/react/24/outline';

import {Heading} from '@/components';
import {EmptyStateProps, EmptyStateType} from '@/types';

const ICON_MAP: Record<EmptyStateType,
	React.ComponentType<{ className?: string }>> = {
	posts: DocumentTextIcon,
	users: UserGroupIcon,
	matches: CalendarIcon,
	photos: PhotoIcon,
	categories: TrophyIcon,
	settings: CogIcon,
	todos: CheckCircleIcon,
	committees: UserGroupIcon,
	birthdays: CalendarIcon,
	trainingSession: CalendarIcon,
	comments: ChatBubbleLeftRightIcon,
}

export default function EmptyState({
									   title,
									   description,
									   icon,
									   action,
									   className = '',
									   type,
								   }: EmptyStateProps) {

	const DEFAULT_ICON = DocumentTextIcon;

	const IconComponent = (type && ICON_MAP[type]) || DEFAULT_ICON;

	return (
		<div
			role='status'
			aria-live={'polite'}
			className={` flex flex-col items-center justify-center text-center py-12 px-4 ${className}`}
		>
			<div
				className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gray-100 dark:bg-gray-800 mb-6">
				{icon || <IconComponent className={'w-12 h-12'}/>}
			</div>

			<Heading size={3}>{title}</Heading>

			<p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">{description}</p>

			{action}
		</div>
	);
}

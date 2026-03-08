'use client';

import {Button} from "@heroui/react";

import {translations} from '@/lib/translations';

import {HStack, ContentCard} from '@/components';
import {formatDateString, getCommentTypeIcon, getCommentTypeLabel} from '@/helpers';
import {EditIcon, TrashIcon} from "@/lib";
import {CommentsZoneItemProps} from '@/types';

export const CommentsZoneItem = ({
									 comment,
									 handleEditComment,
									 deleteComment,
								 }: CommentsZoneItemProps) => {
	const tAction = translations.common.actions;
	const tCommon = translations.comments;

	const commentTitle = () => (
		<HStack spacing={2}>
			{getCommentTypeIcon(comment.type)}
			<span className="text-xs text-gray-500">{getCommentTypeLabel(comment.type)}</span>
		</HStack>
	);

	const actions = (
		<HStack spacing={0}>
			<Button
				onPress={() => handleEditComment(comment)}
				variant={'light'}
				isIconOnly
				aria-label={tAction.edit}
			><EditIcon className="w-4 h-4"/></Button>
			<Button
				onPress={() => deleteComment(comment.id)}
				variant={'light'}
				color={'danger'}
				isIconOnly
				aria-label={tAction.delete}
			><TrashIcon className="w-4 h-4"/></Button>
		</HStack>
	)

	return (
		<ContentCard
			title={commentTitle()}
			actions={actions}
			className={'w-full'}
		>
			<div className="flex justify-between items-start">
				<div className="flex-1">
					<p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{comment.content}</p>
					<div className="grid gap-4 text-xs text-gray-500 mt-3 grid-cols-1 md:grid-cols-12">
						<div className="md:col-span-6 min-w-0">
							<div className="font-medium text-gray-700 dark:text-gray-300 mb-1">
								{tCommon.commentsZoneItem.createdBy}
							</div>
							<div className="truncate">{comment.user_email}</div>
						</div>
						<div className="md:col-span-6 min-w-0">
							<div className="font-medium text-gray-700 dark:text-gray-300 mb-1">
								{tCommon.commentsZoneItem.createdAt}
							</div>
							<div className="truncate">
								{comment.created_at ? formatDateString(comment.created_at) : '-'}
							</div>
						</div>
					</div>
				</div>
			</div>
		</ContentCard>
	);
};

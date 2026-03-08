'use client';

import {Button} from "@heroui/react";

import {ChatBubbleLeftRightIcon} from '@heroicons/react/24/outline';

import {translations} from '@/lib/translations';

import {CommentsZoneItem, ContentCard, EmptyState, HStack, VStack} from '@/components';
import {EmptyStateTypes} from "@/enums";
import {PlusIcon} from "@/lib";
import {CommentsZoneProps} from '@/types';
import {emptyStateTypeOptions, isEmpty} from "@/utils";

export default function CommentsZone({
										 comments,
										 commentsLoading,
										 handleEditComment,
										 onAddCommentOpen,
										 deleteComment,
									 }: CommentsZoneProps) {
	const t = translations.comments;

	const commentCardTitle = (
		<HStack spacing={2}>
			<ChatBubbleLeftRightIcon className="w-5 h-5 text-purple-500"/>
			{t.commentList.title} ({comments.length})
		</HStack>
	);

	const actions = (
		<Button
			onPress={onAddCommentOpen}
			color={'primary'}
			variant={'solid'}
			startContent={<PlusIcon/>}
		>{t.commentList.addComment}</Button>
	)

	const emptyOptionTitle = emptyStateTypeOptions[EmptyStateTypes.COMMENTS];

	return (
		<ContentCard
			title={commentCardTitle}
			isLoading={commentsLoading}
			actions={actions}
			emptyState={isEmpty(comments)
				? <EmptyState
					type={EmptyStateTypes.COMMENTS}
					title={emptyOptionTitle}
					description={translations.comments.commentList.noCommentsDescription}
					action={actions}
				/>
				: undefined}
		>
			<VStack spacing={4}>
				{comments.map((comment) => (
					<CommentsZoneItem
						key={comment.id}
						comment={comment}
						handleEditComment={handleEditComment}
						deleteComment={deleteComment}
					/>
				))}
			</VStack>
		</ContentCard>
	);
}

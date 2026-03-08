'use client';

import React from 'react';

import {translations} from "@/lib/translations";

import {Dialog} from '@/components';

interface DeleteDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: () => void;
	title: string;
	message: string;
	isLoading: boolean;
	size?: 'sm' | 'md' | 'lg';
}

export default function DeleteDialog({
										 isOpen,
										 onClose,
										 onSubmit,
										 title,
										 message,
										 isLoading = false,
										 size = 'md'
									 }: DeleteDialogProps) {

	return (
		<Dialog
			isOpen={isOpen}
			onClose={onClose}
			onSubmit={onSubmit}
			isLoading={isLoading}
			title={title}
			size={size}
			dangerAction
			submitButtonLabel={translations.common.actions.delete}
		>
			{message}
		</Dialog>
	);
}

'use client';

import {useCallback, useState} from "react";

import {CommentTypes, ModalMode} from "@/enums";
import {CommentFormData, BaseComment} from "@/types";

const initialFormData: CommentFormData = {
	content: '',
	author: '',
	user_email: '',
	type: CommentTypes.GENERAL,
}

export const useCommentForm = () => {
	const [formData, setFormData] = useState<CommentFormData>(initialFormData);
	const [selectedComment, setSelectedComment] = useState<BaseComment | null>(null);
	const [modalMode, setModalMode] = useState<ModalMode>(ModalMode.ADD);

	const openAddMode = useCallback(() => {
		setModalMode(ModalMode.ADD);
		setSelectedComment(null);
		setFormData(initialFormData);
	}, []);

	const openEditMode = useCallback((item: BaseComment) => {
		setModalMode(ModalMode.EDIT);
		setSelectedComment(item);
		const {id, created_at, updated_at, ...editableFields} = item;
		setFormData(editableFields);
	}, []);

	const resetForm = useCallback(() => {
		setFormData(initialFormData);
		setSelectedComment(null);
		setModalMode(ModalMode.ADD);
	}, []);

	const validateForm = useCallback((): {valid: boolean; errors: string[]} => {
		const errors: string[] = [];

		if (!formData.content?.trim()) {
			errors.push('Content is mandatory');
		}
		if (!formData.type?.trim()) {
			errors.push('Type is mandatory');
		}

		return {
			valid: errors.length === 0,
			errors,
		};
	}, [formData]);


	return {
		formData,
		setFormData,
		selectedComment,
		modalMode,
		openAddMode,
		openEditMode,
		resetForm,
		validateForm,
	}
}
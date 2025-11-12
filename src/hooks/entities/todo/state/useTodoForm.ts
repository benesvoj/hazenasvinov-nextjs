'use client';

import {useCallback, useState} from "react";

import {ModalMode, TodoCategories, TodoPriorities, TodoStatuses} from "@/enums";
import {TodoFormData, TodoItem} from "@/types";

const initialFormData:TodoFormData =  {
	title: '',
	description: '',
	priority: TodoPriorities.MEDIUM,
	status: TodoStatuses.TODO,
	category: TodoCategories.IMPROVEMENT,
	due_date: new Date().toISOString().split('T')[0],
	user_email: '',
	assigned_to: '',
	created_by: ''
}

export const useTodoForm = () => {
	const [formData, setFormData] = useState<TodoFormData>(initialFormData);
	const [selectedTodo, setSelectedTodo] = useState<TodoItem | null>(null);
	const [modalMode, setModalMode] = useState<ModalMode>(ModalMode.ADD);

	const openAddMode = useCallback(() => {
		setModalMode(ModalMode.ADD);
		setSelectedTodo(null);
		setFormData(initialFormData);
	}, []);

	const openEditMode = useCallback((item: TodoItem) => {
		setModalMode(ModalMode.EDIT);
		setSelectedTodo(item);
		const {id, created_at, updated_at, ...editableFields} = item;
		setFormData(editableFields);
	}, []);

	const resetForm = useCallback(() => {
		setFormData(initialFormData);
		setSelectedTodo(null);
		setModalMode(ModalMode.ADD);
	}, []);

	const validateForm = useCallback((): {valid: boolean; errors: string[]} => {
		const errors: string[] = [];

		if (!formData.title?.trim()) {
			errors.push('Title is mandatory');
		}
		if (!formData.description?.trim()) {
			errors.push('Description is mandatory');
		}

		return {
			valid: errors.length === 0,
			errors,
		};
	}, [formData]);

	return {
		// State
		formData,
		setFormData,
		selectedTodo,
		modalMode,
		// Actions
		openAddMode,
		openEditMode,
		resetForm,
		validateForm,
	};
}
'use client'

import {useCallback, useState} from "react";

import {ModalMode} from "@/enums";
import {CategoryLineupFormData} from "@/types";

const initialFormData: CategoryLineupFormData = {
	name: '',
	description: '',
	category_id: '',
	season_id: '',
	is_active: true,
	created_by: '',
}

export function useCategoryLineupForm() {
	const [formData, setFormData] = useState<CategoryLineupFormData>(initialFormData);
	const [selectedLineupId, setSelectedLineupId] = useState<string | null>(null);
	const [modalMode, setModalMode] = useState<ModalMode>(ModalMode.ADD);

	const openAddMode = useCallback(() => {
		setModalMode(ModalMode.ADD);
		setSelectedLineupId(null);
		setFormData(initialFormData);
	}, []);

	const openEditMode = useCallback((lineupId: string, lineupData: CategoryLineupFormData) => {
		setModalMode(ModalMode.EDIT);
		setSelectedLineupId(lineupId);
		const {...editableFields} = lineupData;
		setFormData(editableFields)
	}, []);

	const resetForm = useCallback(() => {
		setFormData(initialFormData);
		setSelectedLineupId(null);
		setModalMode(ModalMode.ADD);
	}, []);

	const validateForm = useCallback((): {valid: boolean, errors: string[]} => {
		const errors: string[] = [];

		if (!formData.name?.trim()) {
			errors.push('name is required');
		}

		if (!formData.description?.trim()) {
			errors.push('description is required');
		}

		return {
			valid: errors.length === 0,
			errors,
		};
	}, [formData])

	return {
		// State
		formData,
		modalMode,
		selectedLineupId,

		// Setters
		setFormData,

		// Handlers
		openAddMode,
		openEditMode,
		resetForm,
		validateForm,
	}
}
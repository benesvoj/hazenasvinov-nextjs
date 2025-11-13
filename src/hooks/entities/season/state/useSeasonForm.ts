'use client';

import {useCallback, useState} from "react";

import {ModalMode} from "@/enums";
import {Season, SeasonFormData} from "@/types";

const initialFormData: SeasonFormData = {
	name: '',
	start_date: '',
	end_date: '',
	is_active: false,
	is_closed: false,
}

export const useSeasonForm = () => {
	const [formData, setFormData] = useState<SeasonFormData>(initialFormData);
	const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
	const [modalMode, setModalMode] = useState<ModalMode>(ModalMode.ADD)

	const openAddMode = useCallback(() => {
		setModalMode(ModalMode.ADD);
		setSelectedSeason(null);;
		setFormData(initialFormData);
	},[])

	const openEditMode = useCallback((item: Season) => {
		setModalMode(ModalMode.EDIT);
		setSelectedSeason(item);
		const {id, created_at, updated_at, ...editableFields} = item;
		setFormData(editableFields);
	},[])

	const resetForm = useCallback(() => {
		setFormData(initialFormData);
		setSelectedSeason(null);
		setModalMode(ModalMode.ADD);
	},[])

	const validateForm = useCallback((): {valid: boolean; errors: string[]} => {
		const errors: string[] = [];

		if (!formData.name?.trim()) {
			errors.push('Name is mandatory');
		}
		if (!formData.start_date?.trim()) {
			errors.push('Start date is mandatory');
		}

		return {
			valid: errors.length === 0,
			errors,
		};
	}, [formData]);

	return {
		formData,
		setFormData,
		selectedSeason,
		modalMode,
		openAddMode,
		openEditMode,
		resetForm,
		validateForm,
	}
}
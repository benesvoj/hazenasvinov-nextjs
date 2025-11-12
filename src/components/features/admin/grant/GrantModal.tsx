'use client';

import React, {useEffect, useState} from 'react';

import {Input, Select, SelectItem, Textarea} from '@heroui/react';

import UnifiedModal from '@/components/ui/modals/UnifiedModal';

import {translations} from '@/lib';
import {Grant} from '@/types';

interface GrantModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (grantData: { name: string; description?: string; month: number }) => Promise<void>;
	grant?: Grant | null;
	mode: 'create' | 'edit';
}

export default function GrantModal({isOpen, onClose, onSave, grant, mode}: GrantModalProps) {
	const t = translations.grantCalendar;
	const tAction = translations.action;

	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [month, setMonth] = useState<number>(1);
	const [isLoading, setIsLoading] = useState(false);
	const [errors, setErrors] = useState<{ name?: string; month?: string }>({});

	const months = [
		{value: 1, label: t.months.january},
		{value: 2, label: t.months.february},
		{value: 3, label: t.months.march},
		{value: 4, label: t.months.april},
		{value: 5, label: t.months.may},
		{value: 6, label: t.months.june},
		{value: 7, label: t.months.july},
		{value: 8, label: t.months.august},
		{value: 9, label: t.months.september},
		{value: 10, label: t.months.october},
		{value: 11, label: t.months.november},
		{value: 12, label: t.months.december},
	];

	useEffect(() => {
		if (isOpen) {
			if (mode === 'edit' && grant) {
				setName(grant.name);
				setDescription(grant.description || '');
				setMonth(grant.month);
			} else {
				// Reset form for create mode
				setName('');
				setDescription('');
				setMonth(1);
			}
			setErrors({});
		}
	}, [isOpen, mode, grant]);

	const validate = () => {
		const newErrors: { name?: string; month?: string } = {};

		if (!name.trim()) {
			newErrors.name = t.validation.nameRequired;
		}

		if (!month || month < 1 || month > 12) {
			newErrors.month = t.validation.monthRequired;
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSave = async () => {
		if (!validate()) {
			return;
		}

		setIsLoading(true);
		try {
			await onSave({
				name: name.trim(),
				description: description.trim() || undefined,
				month,
			});
			onClose();
		} catch (error) {
			console.error('Error saving grant:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleClose = () => {
		setName('');
		setDescription('');
		setMonth(1);
		setErrors({});
		onClose();
	};

	return (
		<UnifiedModal
			isOpen={isOpen}
			onClose={handleClose}
			title={mode === 'create' ? t.modal.addTitle : t.modal.editTitle}
			subtitle={mode === 'create' ? t.modal.addSubtitle : t.modal.editSubtitle}
			size="2xl"
			isFooterWithActions
			onPress={handleSave}
			isDisabled={isLoading}
			isLoading={isLoading}
		>
			<div className="flex flex-col gap-4">
				<Input
					label={t.form.name}
					placeholder={t.form.namePlaceholder}
					value={name}
					onValueChange={setName}
					isRequired
					errorMessage={errors.name}
					isInvalid={!!errors.name}
					variant="bordered"
				/>

				<Select
					label={t.form.month}
					placeholder={t.form.monthPlaceholder}
					selectedKeys={[month.toString()]}
					onChange={(e) => setMonth(parseInt(e.target.value, 10))}
					isRequired
					errorMessage={errors.month}
					isInvalid={!!errors.month}
					variant="bordered"
				>
					{months.map((m) => (
						<SelectItem key={m.value.toString()}>{m.label}</SelectItem>
					))}
				</Select>

				<Textarea
					label={t.form.description}
					placeholder={t.form.descriptionPlaceholder}
					value={description}
					onValueChange={setDescription}
					minRows={3}
					maxRows={6}
					variant="bordered"
				/>
			</div>
		</UnifiedModal>
	);
}

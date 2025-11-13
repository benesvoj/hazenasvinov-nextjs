import {Button, Checkbox, Input} from '@heroui/react';

import {translations} from '@/lib/translations';

import {UnifiedModal} from '@/components';
import {ModalMode} from '@/enums';
import {SeasonFormData} from "@/types";


interface SeasonModalProps {
	isOpen: boolean;
	onClose: () => void;
	formData: SeasonFormData;
	setFormData: (data: SeasonFormData) => void;
	onSubmit: () => void;
	mode: ModalMode;
	loading?: boolean;
}

export const SeasonModal = ({
								isOpen,
								onClose,
								formData,
								setFormData,
								onSubmit,
								mode,
								loading,
							}: SeasonModalProps) => {
	const t = translations.season;
	const tAction = translations.action;
	const isEditMode = mode === ModalMode.EDIT;
	const modalTitle = isEditMode ? t.editSeason : t.addSeason;

	return (
		<UnifiedModal
			isOpen={isOpen}
			onClose={onClose}
			title={modalTitle}
			size="2xl"
			footer={
				<div className="flex justify-end gap-2">
					<Button variant="flat" onPress={onClose} isDisabled={loading}>
						{tAction.cancel}
					</Button>
					<Button color="primary" onPress={onSubmit} isLoading={loading} isDisabled={loading}>
						{isEditMode ? tAction.save : tAction.add}
					</Button>
				</div>
			}
			classNames={{
				body: 'grid grid-cols-2 gap-4',
			}}
		>
			<div className="col-span-2">
				<Input
					label={t.input.name}
					placeholder={t.input.namePlaceholder}
					value={formData.name}
					onChange={(e) => setFormData({...formData, name: e.target.value})}
					isRequired
				/>
			</div>

			<Input
				label={t.input.startDate}
				type="date"
				value={formData.start_date}
				onChange={(e) => setFormData({...formData, start_date: e.target.value})}
				isRequired
			/>

			<Input
				label={t.input.endDate}
				type="date"
				value={formData.end_date}
				onChange={(e) => setFormData({...formData, end_date: e.target.value})}
				isRequired
			/>

			<Checkbox
				title={t.active}
				isSelected={formData.is_active === null ? false : formData.is_active}
				onValueChange={(value) => setFormData({...formData, is_active: value})}
			>
				{t.active}
			</Checkbox>

			<Checkbox
				title={t.closed}
				className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
				isSelected={formData.is_closed === null ? false : formData.is_closed}
				onValueChange={(value) => setFormData({...formData, is_closed: value})}
			>
				{t.closed}
			</Checkbox>
		</UnifiedModal>
	);
};

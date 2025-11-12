import {Button, Checkbox, Input} from '@heroui/react';

import {translations} from '@/lib/translations';

import {UnifiedModal} from '@/components';
import {ModalMode} from '@/enums';
import {CommitteeFormData} from '@/types';

interface CommitteeModalProps {
	isOpen: boolean;
	onClose: () => void;
	formData: CommitteeFormData;
	setFormData: (data: CommitteeFormData) => void;
	onSubmit: () => void;
	isLoading: boolean;
	mode: ModalMode;
}

export const CommitteeModal = ({
								   isOpen,
								   onClose,
								   formData,
								   setFormData,
								   onSubmit,
								   mode,
								   isLoading,
							   }: CommitteeModalProps) => {
	const t = translations.admin.committees;
	const tAction = translations.action;
	const isEditMode = mode === ModalMode.EDIT;
	const modalTitle = isEditMode ? t.modal.titleEdit : t.modal.titleAdd;

	return (
		<UnifiedModal
			isOpen={isOpen}
			onClose={onClose}
			title={modalTitle}
			size="2xl"
			footer={
				<div className="flex justify-end gap-2">
					<Button variant="flat" onPress={onClose} isDisabled={isLoading}>
						{tAction.cancel}
					</Button>
					<Button color="primary" onPress={onSubmit} isLoading={isLoading} isDisabled={isLoading}>
						{isEditMode ? tAction.save : tAction.add}
					</Button>
				</div>
			}
		>
			<div className="space-y-4">
				<Input
					label={t.modal.code}
					value={formData.code}
					onChange={(e) => setFormData({...formData, code: e.target.value})}
					isRequired
					placeholder={t.modal.codePlaceholder}
					isDisabled={isEditMode}
					description={isEditMode ? 'Kód komise nelze změnit po vytvoření' : undefined}
				/>
				<Input
					label={t.modal.name}
					value={formData.name}
					onChange={(e) => setFormData({...formData, name: e.target.value})}
					isRequired
					placeholder={t.modal.namePlaceholder}
				/>
				<Input
					label={t.modal.description}
					value={formData?.description ?? ''}
					onChange={(e) => setFormData({...formData, description: e.target.value})}
					placeholder={t.modal.descriptionPlaceholder}
				/>
				<Input
					label={t.modal.sortOrder}
					type="number"
					value={formData.sort_order?.toString()}
					onChange={(e) =>
						setFormData({
							...formData,
							sort_order: parseInt(e.target.value) || 0,
						})
					}
					placeholder="0"
				/>
				<Checkbox
					isSelected={formData.is_active ?? true}
					onValueChange={(checked) => setFormData({...formData, is_active: checked})}
				>
					{t.modal.active}
				</Checkbox>
			</div>
		</UnifiedModal>
	);
};

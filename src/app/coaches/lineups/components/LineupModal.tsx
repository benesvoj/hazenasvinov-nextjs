import React from "react";

import {Button, Input, Textarea} from "@heroui/react";

import {UnifiedModal} from "@/components";
import {ModalMode} from "@/enums";
import {translations} from "@/lib";
import {CategoryLineupFormData} from "@/types";

interface LineupModalProps {
	isOpen: boolean;
	onClose: () => void;
	formData: CategoryLineupFormData;
	setFormData: (data: CategoryLineupFormData) => void;
	onSubmit: () => void;
	isLoading?: boolean;
	mode: ModalMode;
}

export const LineupModal = ({
	isOpen,
	onClose,
	formData,
	setFormData,
	onSubmit,
	isLoading,
	mode,
}: LineupModalProps ) => {

	const tAction = translations.action;
	const isEditMode = mode === ModalMode.EDIT;
	const modalTitle = isEditMode ? 'Upravit soupisku' : 'Nová soupiska';

	return (
		<UnifiedModal
			isOpen={isOpen}
			onClose={onClose}
			title={modalTitle}
			footer={
				<>
					<Button variant="light" onPress={onClose} isDisabled={isLoading}>
						{tAction.cancel}
					</Button>
					<Button
						color="primary"
						onPress={onSubmit}
						isLoading={isLoading}
						isDisabled={isLoading || !formData.name.trim()}
					>
						{isEditMode ? tAction.save : tAction.add}
					</Button>
				</>
			}
		>
			<div className="space-y-4">
				<Input
					label="Název soupisky"
					placeholder="Zadejte název soupisky"
					value={formData.name}
					onChange={(e) => setFormData({...formData, name: e.target.value})}
					isRequired
				/>

				<Textarea
					label="Popis"
					placeholder="Zadejte popis soupisky"
					value={formData?.description ?? ''}
					onChange={(e) =>
						setFormData({...formData, description: e.target.value})
					}
				/>
			</div>
		</UnifiedModal>
	)
}
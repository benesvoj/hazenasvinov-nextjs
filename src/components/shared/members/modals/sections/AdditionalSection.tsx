import React from "react";

import {Input, Textarea} from "@heroui/input";

import {translations} from "@/lib/translations";

import {UnifiedCard} from "@/components";
import {MemberMetadataFormData} from "@/types";

interface AdditionalSectionProps {
	handleInputChange: (field: keyof MemberMetadataFormData, value: string) => void;
	formData: {
		preferred_position: string;
		jersey_size: string;
		shoe_size: string;
		notes: string;
	}
}

export const AdditionalSection = ({
									  handleInputChange,
									  formData
								  }: AdditionalSectionProps) => {
	return (
		<UnifiedCard
			title={translations.members.labels.additionalSection.title}
			padding={'none'}
			titleSize={3}
			titleClassName='text-orange-600'
		>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<Input
					label={translations.members.labels.additionalSection.preferredPosition}
					value={formData.preferred_position}
					onValueChange={(value) => handleInputChange('preferred_position', value)}
					placeholder={translations.members.placeholders.additionalSection.preferredPosition}
					size='sm'
				/>
				<Input
					label={translations.members.labels.additionalSection.jerseySize}
					value={formData.jersey_size}
					onValueChange={(value) => handleInputChange('jersey_size', value)}
					placeholder={translations.members.placeholders.additionalSection.jerseySize}
					size='sm'
				/>
				<Input
					label={translations.members.labels.additionalSection.shoeSize}
					value={formData.shoe_size}
					onValueChange={(value) => handleInputChange('shoe_size', value)}
					placeholder={translations.members.placeholders.additionalSection.shoeSize}
					size='sm'
				/>
				<Textarea
					label={translations.members.labels.additionalSection.notes}
					value={formData.notes}
					onValueChange={(value) => handleInputChange('notes', value)}
					placeholder={translations.members.placeholders.additionalSection.notes}
					minRows={2}
					className="md:col-span-2"
					size='sm'
				/>
			</div>
		</UnifiedCard>
	)
}
import React from "react";

import {Input} from "@heroui/input";

import {translations} from "@/lib/translations";

import {ContentCard} from "@/components";
import {MemberMetadataFormData} from "@/types";

interface ContactSection {
	handleInputChange: (field: keyof MemberMetadataFormData, value: string) => void;
	formData: {
		phone: string;
		email: string;
		address: string;
	}
}

export const ContactSection = ({handleInputChange, formData}: ContactSection) => {
	return (
		<ContentCard
			title={translations.members.labels.contactSection.title}
			padding={'none'}
			titleSize={3}
			titleClassName='text-green-700'
		>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<Input
					label={translations.members.labels.contactSection.phone}
					value={formData.phone}
					onValueChange={(value) => handleInputChange('phone', value)}
					placeholder={translations.members.placeholders.contactSection.phone}
					size='sm'
				/>
				<Input
					label={translations.members.labels.contactSection.email}
					type="email"
					value={formData.email}
					onValueChange={(value) => handleInputChange('email', value)}
					placeholder={translations.members.placeholders.contactSection.email}
					size='sm'
				/>
				<Input
					label={translations.members.labels.contactSection.address}
					value={formData.address}
					onValueChange={(value) => handleInputChange('address', value)}
					placeholder={translations.members.placeholders.contactSection.address}
					className="md:col-span-2"
					size='sm'
				/>
			</div>
		</ContentCard>
	)
}
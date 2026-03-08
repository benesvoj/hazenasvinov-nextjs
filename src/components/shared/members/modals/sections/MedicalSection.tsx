'use client';

import React from "react";

import {Input, Textarea} from "@heroui/input";

import {translations} from "@/lib/translations";

import {ContentCard} from "@/components";
import {MemberMetadataFormData} from "@/types";

interface MedicalSectionProps {
	handleInputChange: (field: keyof MemberMetadataFormData, value: string) => void;
	formData: {
		medical_notes: string;
		allergies: string;
		emergency_contact_name: string;
		emergency_contact_phone: string;
	}
}

export const MedicalSection = ({handleInputChange, formData}: MedicalSectionProps) => {
	return (
		<ContentCard
			title={translations.members.labels.medicalSection.title}
			padding={'none'}
			titleSize={3}
			titleClassName='text-red-700'
		>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<Textarea
					label={translations.members.labels.medicalSection.medicalNotes}
					value={formData.medical_notes}
					onValueChange={(value) => handleInputChange('medical_notes', value)}
					placeholder={translations.members.placeholders.medicalSection.medicalNotes}
					minRows={2}
					className="md:col-span-2"
					size='sm'
				/>
				<Textarea
					label={translations.members.labels.medicalSection.allergies}
					value={formData.allergies}
					onValueChange={(value) => handleInputChange('allergies', value)}
					placeholder={translations.members.placeholders.medicalSection.allergies}
					minRows={2}
					className="md:col-span-2"
					size='sm'
				/>
				<Input
					label={translations.members.labels.medicalSection.emergencyContactName}
					value={formData.emergency_contact_name}
					onValueChange={(value) => handleInputChange('emergency_contact_name', value)}
					placeholder={translations.members.placeholders.medicalSection.emergencyContactName}
					description={translations.members.helpers.medicalSection.emergencyContactName}
					size='sm'
				/>
				<Input
					label={translations.members.labels.medicalSection.emergencyContactPhone}
					value={formData.emergency_contact_phone}
					onValueChange={(value) => handleInputChange('emergency_contact_phone', value)}
					placeholder={translations.members.placeholders.medicalSection.emergencyContactPhone}
					description={translations.members.helpers.medicalSection.emergencyContactPhone}
					size='sm'
				/>
			</div>
		</ContentCard>
	)
}
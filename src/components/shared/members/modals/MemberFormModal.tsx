'use client';

import {useState} from "react";

import {AdditionalSection, BasicInfoSection, ContactSection, Dialog, MedicalSection, ParentSection} from "@/components";
import {Genders, MemberFunction} from "@/enums";
import {MemberMetadataFormData} from "@/types";

interface MemberFormModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (data: any) => void; // Replace 'any' with your form data type
	initialData?: any; // Replace 'any' with your form data type
	title: string;
	selectedCategoryName?: string;
}

const INITIAL_FORM_DATA: MemberMetadataFormData = {
	// Basic Information
	name: '',
	surname: '',
	registration_number: '',
	date_of_birth: '',
	sex: Genders.MALE,
	functions: MemberFunction.PLAYER,

	// Contact Information
	phone: '',
	email: '',
	address: '',

	// Parent/Guardian Information
	parent_name: '',
	parent_phone: '',
	parent_email: '',

	// Medical Information
	medical_notes: '',
	allergies: '',
	emergency_contact_name: '',
	emergency_contact_phone: '',

	// Additional Information
	notes: '',
	preferred_position: '',
	jersey_size: '',
	shoe_size: '',
};

export const MemberFormModal = ({
									isOpen,
									onClose,
									onSubmit,
									initialData,
									title,
									selectedCategoryName
								}: MemberFormModalProps) => {
	const [formData, setFormData] = useState<MemberMetadataFormData>(INITIAL_FORM_DATA);

	const handleInputChange = (field: keyof MemberMetadataFormData, value: string) => {
		setFormData((prev) => ({...prev, [field]: value}));
	};

	return (
		<Dialog
			isOpen={isOpen}
			onClose={onClose}
			onSubmit={onSubmit}
			title={title}
			subtitle={`Kategorie: ${selectedCategoryName}`}
			size="2xl"
			scrollBehavior="inside"
		>
			<div className="space-y-4">
				<BasicInfoSection handleInputChange={handleInputChange} formData={formData}/>
				<ContactSection handleInputChange={handleInputChange} formData={formData}/>
				<ParentSection handleInputChange={handleInputChange} formData={formData}/>
				<MedicalSection handleInputChange={handleInputChange} formData={formData}/>
				<AdditionalSection handleInputChange={handleInputChange} formData={formData}/>
			</div>
		</Dialog>
	)
}
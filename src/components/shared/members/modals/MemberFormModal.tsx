'use client';

import {useState} from "react";

import {
	AdditionalSection,
	BasicInfoSection,
	ContactSection,
	Dialog,
	MedicalSection,
	ParentSection,
	Show
} from "@/components";
import {Genders, MemberFunction} from "@/enums";
import {MemberFormModalProps, MemberMetadataFormData} from "@/types";

import {QUICK_CREATE} from "./config/memberFormConfig";

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
									onSuccess,
									sections = QUICK_CREATE
								}: MemberFormModalProps) => {
	const [formData, setFormData] = useState<MemberMetadataFormData>(INITIAL_FORM_DATA);

	const handleInputChange = (field: keyof MemberMetadataFormData, value: string) => {
		setFormData((prev) => ({...prev, [field]: value}));
	};

	const title = 'Member Form Modal with sections (refactored)'

	return (
		<Dialog
			isOpen={isOpen}
			onClose={onClose}
			onSubmit={onSuccess as () => void} // Type assertion since onSuccess expects a Member, but Dialog expects void
			title={title}
			size="2xl"
			scrollBehavior="inside"
		>
			<div className="space-y-4">
				<BasicInfoSection handleInputChange={handleInputChange} formData={formData}/>
				<Show when={sections.contact}>
					<ContactSection handleInputChange={handleInputChange} formData={formData}/>
				</Show>
				<Show when={sections.parent}>
					<ParentSection handleInputChange={handleInputChange} formData={formData}/>
				</Show>
				<Show when={sections.medical}>
					<MedicalSection handleInputChange={handleInputChange} formData={formData}/>
				</Show>
				<Show when={sections.additional}>
					<AdditionalSection handleInputChange={handleInputChange} formData={formData}/>
				</Show>
			</div>
		</Dialog>
	)
}
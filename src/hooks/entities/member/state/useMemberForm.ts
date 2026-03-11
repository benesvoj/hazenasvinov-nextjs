'use client';

import {useState} from 'react';

import {createFormHook} from '@/hooks/factories';

import {translations} from '@/lib/translations';

import {Genders, MemberFunction, ModalMode} from '@/enums';
import {useMemberMetadata, useMembers} from '@/hooks';
import {Member, MemberMetadataFormData} from '@/types';

const initialFormData: MemberMetadataFormData = {
  // Basic Information
  name: '',
  surname: '',
  registration_number: '',
  date_of_birth: '',
  sex: Genders.MALE,
  functions: MemberFunction.PLAYER,
  category_id: '',

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

export function useMemberForm() {
  const form = createFormHook<Member, MemberMetadataFormData>({
    initialFormData,
    validationRules: [
      {field: 'name', message: translations.members.validations.mandatoryName},
      {field: 'surname', message: translations.members.validations.mandatorySurname},
      {field: 'date_of_birth', message: translations.members.validations.mandatoryDateOfBirth},
    ],
  })();
  const {updateMember, createInternalMember} = useMembers();
  const {updateMemberMetadata} = useMemberMetadata();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async () => {
    const {valid} = form.validateForm();
    if (!valid) return;

    setIsLoading(true);

    try {
      if (form.modalMode === ModalMode.EDIT && !form.selectedItem) {
        throw new Error('No member selected for edit');
      }

      const member =
        form.modalMode === ModalMode.ADD
          ? await createInternalMember(
              {
                name: form.formData.name,
                surname: form.formData.surname,
                registration_number: form.formData.registration_number,
                date_of_birth: form.formData.date_of_birth,
                gender: form.formData.sex,
                functions: [form.formData.functions as MemberFunction],
              },
              form.formData.category_id
            )
          : await updateMember({
              id: form.selectedItem!.id,
              name: form.formData.name,
              surname: form.formData.surname,
              registration_number: form.formData.registration_number,
              date_of_birth: form.formData.date_of_birth,
              gender: form.formData.sex,
              functions: [form.formData.functions as MemberFunction],
            });

      const {
        name,
        surname,
        registration_number,
        date_of_birth,
        sex,
        functions,
        category_id,
        ...metadataFields
      } = form.formData;

      await updateMemberMetadata(member.id, metadataFields);

      return member;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    ...form,
    isLoading,
    handleSubmit,
  };
}

'use client';

import {useCallback, useRef, useState} from 'react';

import {createFormHook} from '@/hooks/factories';

import {translations} from '@/lib/translations';

import {Genders, MemberFunction, ModalMode} from '@/enums';
import {useMemberMetadata, useMembers} from '@/hooks';
import {Member, MemberMetadata, MemberMetadataFormData} from '@/types';

/**
 * Form fields backed by the `member_metadata` table — they live on a separate
 * row than the member itself and therefore have to be loaded (and reset)
 * independently of the member record.
 */
const METADATA_FIELDS = [
  'phone',
  'email',
  'address',
  'parent_name',
  'parent_phone',
  'parent_email',
  'medical_notes',
  'allergies',
  'emergency_contact_name',
  'emergency_contact_phone',
  'notes',
  'preferred_position',
  'jersey_size',
  'shoe_size',
] as const;

type MetadataField = (typeof METADATA_FIELDS)[number];

/** Maps a metadata row onto form fields; `null` yields a cleared set. */
const toFormMetadata = (
  metadata: MemberMetadata | null
): Pick<MemberMetadataFormData, MetadataField> =>
  METADATA_FIELDS.reduce(
    (acc, field) => {
      acc[field] = metadata?.[field] ?? '';
      return acc;
    },
    {} as Pick<MemberMetadataFormData, MetadataField>
  );

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
  const {updateMemberMetadata, getMemberMetadata} = useMemberMetadata();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMetadataLoading, setIsMetadataLoading] = useState<boolean>(false);

  const {openEditMode, updateFormData} = form;

  /** Guards against a late metadata response overwriting a newer selection. */
  const editedMemberIdRef = useRef<string | null>(null);

  /**
   * Opens edit mode and loads the member's `member_metadata` row into the form.
   *
   * Without this the contact / parent / medical / additional sections would
   * render empty even though the data exists in the database.
   */
  const openEditModeWithMetadata = useCallback(
    async (member: Member) => {
      editedMemberIdRef.current = member.id;

      openEditMode(member);
      // The member row carries no metadata columns — start from a cleared set
      // so no values leak in from a previously edited member.
      updateFormData(toFormMetadata(null));

      setIsMetadataLoading(true);
      try {
        const metadata = await getMemberMetadata(member.id);
        if (editedMemberIdRef.current !== member.id) return;
        updateFormData(toFormMetadata(metadata));
      } finally {
        if (editedMemberIdRef.current === member.id) setIsMetadataLoading(false);
      }
    },
    [openEditMode, updateFormData, getMemberMetadata]
  );

  const handleSubmit = async () => {
    const {valid} = form.validateForm();
    if (!valid) return;

    setIsLoading(true);

    try {
      if (form.modalMode === ModalMode.EDIT && !form.selectedItem) {
        throw new Error('No member selected for edit');
      }

      const functionsArray = Array.isArray(form.formData.functions)
        ? (form.formData.functions as unknown as MemberFunction[])
        : [form.formData.functions as MemberFunction];

      const member =
        form.modalMode === ModalMode.ADD
          ? await createInternalMember(
              {
                name: form.formData.name,
                surname: form.formData.surname,
                registration_number: form.formData.registration_number,
                date_of_birth: form.formData.date_of_birth,
                gender: form.formData.sex,
                functions: functionsArray,
              },
              form.formData.category_id
            )
          : await updateMember({
              id: form.selectedItem!.id,
              name: form.formData.name,
              surname: form.formData.surname,
              registration_number: form.formData.registration_number,
              date_of_birth: form.formData.date_of_birth,
              sex: form.formData.sex,
              functions: functionsArray,
              category_id: form.formData.category_id || undefined,
            });

      const {
        phone,
        email,
        address,
        parent_name,
        parent_phone,
        parent_email,
        medical_notes,
        allergies,
        emergency_contact_name,
        emergency_contact_phone,
        notes,
        preferred_position,
        jersey_size,
        shoe_size,
      } = form.formData;

      await updateMemberMetadata(member.id, {
        phone,
        email,
        address,
        parent_name,
        parent_phone,
        parent_email,
        medical_notes,
        allergies,
        emergency_contact_name,
        emergency_contact_phone,
        notes,
        preferred_position,
        jersey_size,
        shoe_size,
      });

      return member;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    ...form,
    openEditModeWithMetadata,
    isMetadataLoading,
    isLoading,
    handleSubmit,
  };
}

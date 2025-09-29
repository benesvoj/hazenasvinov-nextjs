'use client';

import {useState, useEffect} from 'react';

import {Input, Select, SelectItem} from '@heroui/react';

import {translations} from '@/lib/translations';

import {UnifiedModal} from '@/components';
import {Genders, MemberFunction} from '@/enums';
import {useMembers} from '@/hooks';
import {CreateMemberModalProps, MemberFormData} from '@/types';

export default function CreateMemberModal({
  isOpen,
  onClose,
  onMemberCreated,
  categoryId,
  clubId,
}: CreateMemberModalProps) {
  const [formData, setFormData] = useState<MemberFormData>({
    name: '',
    surname: '',
    registration_number: '',
    date_of_birth: '',
    sex: Genders.MALE,
    functions: [MemberFunction.PLAYER],
  });

  const t = translations.createMemberModal;
  const {isLoading, errors, createMember, clearFieldError, reset} = useMembers();

  const handleSave = async () => {
    try {
      const result = await createMember(formData, categoryId, clubId);
      onMemberCreated(result);
      onClose();
    } catch (error) {
      // Error handling is done in the hook
      console.error('Error creating member:', error);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({...prev, [field]: value}));
    // Clear error when user starts typing
    clearFieldError(field);
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        surname: '',
        registration_number: '',
        date_of_birth: '',
        sex: Genders.MALE,
        functions: [MemberFunction.PLAYER],
      });
      reset();
    }
  }, [isOpen, reset]);

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={t.title}
      size="lg"
      isFooterWithActions
      isLoading={isLoading}
      onPress={handleSave}
      isDisabled={
        !formData.name.trim() || !formData.surname.trim() || !formData.registration_number.trim()
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t.registrationNumber}
            value={formData.registration_number}
            onChange={(e) => updateField('registration_number', e.target.value)}
            isRequired
            isInvalid={!!errors.registration_number}
            errorMessage={errors.registration_number}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t.surname}
            value={formData.surname}
            onChange={(e) => updateField('surname', e.target.value)}
            isRequired
            isInvalid={!!errors.surname}
            errorMessage={errors.surname}
          />

          <Input
            label={t.name}
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            isRequired
            isInvalid={!!errors.name}
            errorMessage={errors.name}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t.dateOfBirth}
            type="date"
            value={formData.date_of_birth}
            onChange={(e) => updateField('date_of_birth', e.target.value)}
            isInvalid={!!errors.date_of_birth}
            errorMessage={errors.date_of_birth}
          />
          <Select
            label={t.sex}
            value={formData.sex}
            onSelectionChange={(keys) => {
              const selectedKey = Array.from(keys)[0] as Genders;
              updateField('sex', selectedKey);
            }}
          >
            <SelectItem key={Genders.MALE} textValue="Muž">
              Muž
            </SelectItem>
            <SelectItem key={Genders.FEMALE} textValue="Žena">
              Žena
            </SelectItem>
          </Select>
        </div>
      </div>
    </UnifiedModal>
  );
}

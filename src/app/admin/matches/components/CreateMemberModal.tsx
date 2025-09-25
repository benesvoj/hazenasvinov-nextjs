'use client';

import {useState, useEffect} from 'react';
import {UnifiedModal} from '@/components';
import {Input, Select, SelectItem} from '@heroui/react';
import {createClient} from '@/utils/supabase/client';
import {showToast} from '@/components';
import {translations} from '@/lib/translations';

interface CreateMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemberCreated: (member: {
    id: string;
    name: string;
    surname: string;
    registration_number: string;
  }) => void;
  categoryId?: string;
}

export default function CreateMemberModal({
  isOpen,
  onClose,
  onMemberCreated,
  categoryId,
}: CreateMemberModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    registration_number: '',
    date_of_birth: '',
    sex: 'male' as 'male' | 'female',
    functions: ['player'] as string[],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const t = translations.createMemberModal;

  const supabase = createClient();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Jméno je povinné';
    }
    if (!formData.surname.trim()) {
      newErrors.surname = 'Příjmení je povinné';
    }
    if (!formData.registration_number.trim()) {
      newErrors.registration_number = 'Registrační číslo je povinné';
    }
    if (!formData.date_of_birth) {
      newErrors.date_of_birth = 'Datum narození je povinné';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const {data, error} = await supabase
        .from('members')
        .insert({
          name: formData.name.trim(),
          surname: formData.surname.trim(),
          registration_number: formData.registration_number.trim(),
          date_of_birth: formData.date_of_birth,
          sex: formData.sex,
          functions: formData.functions,
          category_id: categoryId,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating member:', error);
        showToast.danger(`Chyba při vytváření člena: ${error.message}`);
        return;
      }

      showToast.success('Člen byl úspěšně vytvořen');
      onMemberCreated({
        id: data.id,
        name: data.name,
        surname: data.surname,
        registration_number: data.registration_number,
      });
      onClose();
    } catch (error) {
      console.error('Error creating member:', error);
      showToast.danger('Chyba při vytváření člena');
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({...prev, [field]: value}));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({...prev, [field]: ''}));
    }
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        surname: '',
        registration_number: '',
        date_of_birth: '',
        sex: 'male',
        functions: ['player'],
      });
      setErrors({});
    }
  }, [isOpen]);

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
            label={t.name}
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            isRequired
            isInvalid={!!errors.name}
            errorMessage={errors.name}
          />
          <Input
            label={t.surname}
            value={formData.surname}
            onChange={(e) => updateField('surname', e.target.value)}
            isRequired
            isInvalid={!!errors.surname}
            errorMessage={errors.surname}
          />
        </div>

        <Input
          label={t.registrationNumber}
          value={formData.registration_number}
          onChange={(e) => updateField('registration_number', e.target.value)}
          isRequired
          isInvalid={!!errors.registration_number}
          errorMessage={errors.registration_number}
        />

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
              const selectedKey = Array.from(keys)[0] as string;
              updateField('sex', selectedKey);
            }}
          >
            <SelectItem key="male" textValue="Muž">
              Muž
            </SelectItem>
            <SelectItem key="female" textValue="Žena">
              Žena
            </SelectItem>
          </Select>
        </div>
      </div>
    </UnifiedModal>
  );
}

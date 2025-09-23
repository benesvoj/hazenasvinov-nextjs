'use client';

import {useState, useEffect} from 'react';
import {UnifiedModal} from '@/components';
import {Input, Select, SelectItem, Checkbox} from '@heroui/react';
import {CreateExternalPlayerModalProps, ExternalPlayerFormData} from '@/types';
import {useExternalPlayerCreation} from '@/hooks';
import {Genders, PlayerPosition} from '@/enums';

export default function CreateExternalPlayerModal({
  isOpen,
  onClose,
  onPlayerCreated,
  teamName,
  categoryId,
}: CreateExternalPlayerModalProps) {
  const [formData, setFormData] = useState<ExternalPlayerFormData>({
    name: '',
    surname: '',
    registration_number: '',
    position: 'field_player',
    jersey_number: '',
    club_name: '',
    is_captain: false,
    sex: Genders.MALE,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Use the external player creation hook
  const {isLoading, categoryGender, createExternalPlayer, loadCategoryGender} =
    useExternalPlayerCreation();

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
    if (!formData.club_name.trim()) {
      newErrors.club_name = 'Název klubu je povinný';
    }
    if (!formData.sex) {
      newErrors.sex = 'Pohlaví je povinné';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const externalPlayer = await createExternalPlayer(formData, categoryId);
      onPlayerCreated(externalPlayer);
      onClose();
    } catch (error) {
      // Error handling is done in the hook
      console.error('Error in handleSave:', error);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({...prev, [field]: value}));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({...prev, [field]: ''}));
    }
  };

  // Fetch category gender when modal opens
  useEffect(() => {
    if (isOpen && categoryId) {
      loadCategoryGender(categoryId, (gender) => {
        // Set form gender to match category gender as default
        setFormData((prev) => ({
          ...prev,
          sex: gender,
        }));
      });
    }
  }, [isOpen, categoryId, loadCategoryGender]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        surname: '',
        registration_number: '',
        position: PlayerPosition.FIELD_PLAYER,
        jersey_number: '',
        club_name: teamName || '',
        is_captain: false,
        sex: Genders.MALE,
      });
      setErrors({});
    }
  }, [isOpen, teamName]);

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Vytvořit externího hráče"
      size="lg"
      isFooterWithActions
      isLoading={isLoading}
      onPress={handleSave}
      isDisabled={
        !formData.name.trim() ||
        !formData.surname.trim() ||
        !formData.registration_number.trim() ||
        !formData.club_name.trim()
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Jméno"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            isRequired
            isInvalid={!!errors.name}
            errorMessage={errors.name}
          />
          <Input
            label="Příjmení"
            value={formData.surname}
            onChange={(e) => updateField('surname', e.target.value)}
            isRequired
            isInvalid={!!errors.surname}
            errorMessage={errors.surname}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Registrační číslo"
            value={formData.registration_number}
            onChange={(e) => updateField('registration_number', e.target.value)}
            isRequired
            isInvalid={!!errors.registration_number}
            errorMessage={errors.registration_number}
          />
          <Input
            label="Číslo dresu"
            type="number"
            value={formData.jersey_number}
            onChange={(e) => updateField('jersey_number', e.target.value)}
            min="1"
            max="99"
            placeholder="1-99"
          />
        </div>

        <Input
          label="Název klubu"
          value={formData.club_name}
          onChange={(e) => updateField('club_name', e.target.value)}
          isRequired
          isInvalid={!!errors.club_name}
          errorMessage={errors.club_name}
          aria-label="Club name"
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Pozice"
            selectedKeys={formData.position ? [formData.position] : ['field_player']}
            onSelectionChange={(keys) => {
              const selectedKey = Array.from(keys)[0] as string;
              updateField('position', selectedKey);
            }}
          >
            <SelectItem key="field_player" textValue="Hráč v poli">
              Hráč v poli
            </SelectItem>
            <SelectItem key="goalkeeper" textValue="Brankář">
              Brankář
            </SelectItem>
          </Select>

          <Select
            label="Pohlaví"
            selectedKeys={formData.sex ? [formData.sex] : []}
            onSelectionChange={(keys) => {
              const selectedKey = Array.from(keys)[0] as string;
              updateField('sex', selectedKey as 'male' | 'female');
            }}
            isRequired
            isInvalid={!!errors.sex}
            errorMessage={errors.sex}
            description={
              categoryGender
                ? `Doporučeno podle kategorie: ${categoryGender === 'male' ? 'Muž' : 'Žena'}`
                : undefined
            }
          >
            <SelectItem key="male" textValue="Muž">
              Muž
            </SelectItem>
            <SelectItem key="female" textValue="Žena">
              Žena
            </SelectItem>
          </Select>
        </div>

        <div className="flex items-center space-x-4">
          <Checkbox
            isSelected={formData.is_captain}
            onValueChange={(isSelected) => updateField('is_captain', isSelected)}
          >
            Kapitán týmu
          </Checkbox>
        </div>
      </div>
    </UnifiedModal>
  );
}

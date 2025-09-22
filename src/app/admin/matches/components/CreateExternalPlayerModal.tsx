'use client';

import {useState, useEffect} from 'react';
import {UnifiedModal} from '@/components';
import {Input, Select, SelectItem, Button, Checkbox} from '@heroui/react';
import {PlayerSearchResult} from '@/types/unifiedPlayer';

interface CreateExternalPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayerCreated: (player: PlayerSearchResult) => void;
  teamName?: string;
}

export default function CreateExternalPlayerModal({
  isOpen,
  onClose,
  onPlayerCreated,
  teamName,
}: CreateExternalPlayerModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    registration_number: '',
    position: 'field_player' as 'goalkeeper' | 'field_player',
    jersey_number: '',
    club_name: '',
    is_captain: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    // Create a PlayerSearchResult for external player
    const externalPlayer: PlayerSearchResult = {
      id: `external_${Date.now()}`, // Generate temporary ID
      name: formData.name.trim(),
      surname: formData.surname.trim(),
      registration_number: formData.registration_number.trim(),
      position: formData.position,
      jersey_number: formData.jersey_number ? parseInt(formData.jersey_number) : undefined,
      is_external: true,
      current_club_name: formData.club_name.trim(),
      display_name: `${formData.surname.trim()} ${formData.name.trim()} (${formData.registration_number.trim()})`,
      is_captain: formData.is_captain,
    };

    onPlayerCreated(externalPlayer);
    onClose();
    setIsLoading(false);
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
        position: 'field_player',
        jersey_number: '',
        club_name: teamName || '',
        is_captain: false,
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
        />

        <Select
          label="Pozice"
          value={formData.position}
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

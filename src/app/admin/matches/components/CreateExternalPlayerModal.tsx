'use client';

import {useState, useEffect} from 'react';
import {UnifiedModal, showToast} from '@/components';
import {Input, Select, SelectItem, Button, Checkbox} from '@heroui/react';
import {PlayerSearchResult} from '@/types/unifiedPlayer';

interface CreateExternalPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayerCreated: (player: PlayerSearchResult) => void;
  teamName?: string;
  categoryId?: string; // Add categoryId to determine gender
}

export default function CreateExternalPlayerModal({
  isOpen,
  onClose,
  onPlayerCreated,
  teamName,
  categoryId,
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
  const [categoryGender, setCategoryGender] = useState<'male' | 'female' | null>(null);

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

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Import Supabase client
      const {createClient} = await import('@/utils/supabase/client');
      const supabase = createClient();

      // First, find or create the club
      let clubId: string;
      const {data: existingClub, error: clubSearchError} = await supabase
        .from('clubs')
        .select('id')
        .eq('name', formData.club_name.trim())
        .single();

      if (clubSearchError && clubSearchError.code !== 'PGRST116') {
        throw new Error(`Chyba při hledání klubu: ${clubSearchError.message}`);
      }

      if (existingClub) {
        clubId = existingClub.id;
      } else {
        // Create new club if it doesn't exist
        const {data: newClub, error: clubCreateError} = await supabase
          .from('clubs')
          .insert({
            name: formData.club_name.trim(),
            is_active: true,
          })
          .select()
          .single();

        if (clubCreateError) {
          throw new Error(`Chyba při vytváření klubu: ${clubCreateError.message}`);
        }
        clubId = newClub.id;
      }

      // Create member record in database (no position field needed - it's in lineup_players)
      const {data: memberData, error: memberError} = await supabase
        .from('members')
        .insert({
          name: formData.name.trim(),
          surname: formData.surname.trim(),
          registration_number: formData.registration_number.trim(),
          functions: ['player'], // External players are players
          sex: categoryGender || 'male', // Use category gender, fallback to male
          category_id: categoryId, // Set category_id from the match category
        })
        .select()
        .single();

      if (memberError) {
        console.error('Error creating external player:', memberError);
        throw new Error(`Chyba při vytváření externího hráče: ${memberError.message}`);
      }

      // Create member-club relationship
      const {error: relationshipError} = await supabase.from('member_club_relationships').insert({
        member_id: memberData.id,
        club_id: clubId,
        relationship_type: 'permanent', // External players are permanent members of their club
        status: 'active',
        valid_from: new Date().toISOString().split('T')[0],
      });

      if (relationshipError) {
        console.error('Error creating member-club relationship:', relationshipError);
        throw new Error(`Chyba při vytváření vztahu hráč-klub: ${relationshipError.message}`);
      }

      // Create a PlayerSearchResult for the created member
      const externalPlayer: PlayerSearchResult = {
        id: memberData.id,
        name: memberData.name,
        surname: memberData.surname,
        registration_number: memberData.registration_number,
        position: formData.position, // Use position from form data, not from member data
        jersey_number: formData.jersey_number ? parseInt(formData.jersey_number) : undefined,
        is_external: true,
        current_club_name: formData.club_name.trim(),
        display_name: `${memberData.surname} ${memberData.name} (${memberData.registration_number})`,
        is_captain: formData.is_captain,
      };

      showToast.success('Externí hráč byl úspěšně vytvořen');
      onPlayerCreated(externalPlayer);
      onClose();
    } catch (error) {
      console.error('Error creating external player:', error);
      showToast.danger(
        `Chyba při vytváření externího hráče: ${error instanceof Error ? error.message : 'Neznámá chyba'}`
      );
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

  // Fetch category gender when modal opens
  useEffect(() => {
    const fetchCategoryGender = async () => {
      if (isOpen && categoryId) {
        try {
          const {createClient} = await import('@/utils/supabase/client');
          const supabase = createClient();

          const {data: category, error} = await supabase
            .from('categories')
            .select('gender')
            .eq('id', categoryId)
            .single();

          if (error) {
            console.error('Error fetching category gender:', error);
            setCategoryGender('male'); // Default fallback
          } else {
            setCategoryGender(category.gender);
          }
        } catch (error) {
          console.error('Error fetching category gender:', error);
          setCategoryGender('male'); // Default fallback
        }
      }
    };

    fetchCategoryGender();
  }, [isOpen, categoryId]);

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
          aria-label="Club name"
        />

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

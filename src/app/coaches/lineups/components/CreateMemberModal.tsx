'use client';

import React, {useState} from 'react';
import {Input, Select, SelectItem, Card, CardBody, Button} from '@heroui/react';
import {UserPlusIcon} from '@heroicons/react/24/outline';
import {createClient} from '@/utils/supabase/client';
import {useFetchMembers} from '@/hooks/useFetchMembers';
import {UnifiedModal} from '@/components';

interface CreateMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemberCreated: (memberId: string) => void;
  selectedCategoryId: string;
  selectedCategoryName: string;
}

interface MemberFormData {
  name: string;
  surname: string;
  registration_number: string;
  date_of_birth: string;
  sex: 'male' | 'female';
  functions: string;
}

export default function CreateMemberModal({
  isOpen,
  onClose,
  onMemberCreated,
  selectedCategoryId,
  selectedCategoryName,
}: CreateMemberModalProps) {
  const [formData, setFormData] = useState<MemberFormData>({
    name: '',
    surname: '',
    registration_number: '',
    date_of_birth: '',
    sex: 'male',
    functions: 'player',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {fetchMembers} = useFetchMembers();

  const handleInputChange = (field: keyof MemberFormData, value: string) => {
    setFormData((prev) => ({...prev, [field]: value}));
  };

  const generateRegistrationNumber = () => {
    // Generate a simple registration number based on category and timestamp
    const timestamp = Date.now().toString().slice(-4);
    const categoryCode = selectedCategoryName.replace(/\D/g, ''); // Extract numbers from category name
    return `${categoryCode}${timestamp}`;
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Validate required fields
      if (!formData.name || !formData.surname || !formData.date_of_birth) {
        throw new Error('Jméno, příjmení a datum narození jsou povinné');
      }

      // Generate registration number if not provided
      const registrationNumber = formData.registration_number || generateRegistrationNumber();

      const supabase = createClient();

      const {data, error} = await supabase
        .from('members')
        .insert({
          name: formData.name,
          surname: formData.surname,
          registration_number: registrationNumber,
          date_of_birth: formData.date_of_birth,
          sex: formData.sex,
          functions: formData.functions || null,
          category_id: selectedCategoryId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh members list
      await fetchMembers();

      // Call the callback with the new member ID
      onMemberCreated(data.id);

      // Reset form and close modal
      setFormData({
        name: '',
        surname: '',
        registration_number: '',
        date_of_birth: '',
        sex: 'male',
        functions: '',
      });
      onClose();
    } catch (err) {
      console.error('Error creating member:', err);
      setError(err instanceof Error ? err.message : 'Chyba při vytváření člena');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setFormData({
      name: '',
      surname: '',
      registration_number: '',
      date_of_birth: '',
      sex: 'male',
      functions: 'player',
    });
    onClose();
  };

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Přidat nového člena"
      subtitle={`Kategorie: ${selectedCategoryName}`}
      size="2xl"
      scrollBehavior="inside"
      isFooterWithActions
      onPress={handleSubmit}
      isDisabled={!formData.name || !formData.surname || !formData.date_of_birth || isSubmitting}
    >
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardBody className="p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </CardBody>
        </Card>
      )}

      <div className="space-y-4">
        {/* Basic Information */}
        <Card>
          <CardBody className="p-4">
            <h4 className="font-semibold mb-3 text-blue-700">Základní informace</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Jméno *"
                value={formData.name}
                onValueChange={(value) => handleInputChange('name', value)}
                placeholder="Zadejte jméno"
                isRequired
              />
              <Input
                label="Příjmení *"
                value={formData.surname}
                onValueChange={(value) => handleInputChange('surname', value)}
                placeholder="Zadejte příjmení"
                isRequired
              />
              <Input
                label="Registrační číslo"
                value={formData.registration_number}
                onValueChange={(value) => handleInputChange('registration_number', value)}
                placeholder="Nechte prázdné pro automatické vygenerování"
                description="Pokud nevyplníte, bude vygenerováno automaticky"
              />
              <Input
                label="Datum narození *"
                type="date"
                value={formData.date_of_birth}
                onValueChange={(value) => handleInputChange('date_of_birth', value)}
                isRequired
              />
              <Select
                label="Pohlaví"
                selectedKeys={[formData.sex]}
                onSelectionChange={(keys) => {
                  const sex = Array.from(keys)[0] as 'male' | 'female';
                  handleInputChange('sex', sex);
                }}
              >
                <SelectItem key="male">Muž</SelectItem>
                <SelectItem key="female">Žena</SelectItem>
              </Select>
            </div>
          </CardBody>
        </Card>
      </div>
    </UnifiedModal>
  );
}

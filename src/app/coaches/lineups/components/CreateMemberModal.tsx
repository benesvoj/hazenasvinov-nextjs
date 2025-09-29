'use client';

import React, {useState} from 'react';

import {Input, Select, SelectItem, Card, CardBody, Button, Textarea} from '@heroui/react';

import {UserPlusIcon} from '@heroicons/react/24/outline';

import {createClient} from '@/utils/supabase/client';

import {UnifiedModal} from '@/components';
import {Genders, getGenderOptions, MemberFunction} from '@/enums';
import {useFetchMembers, useMemberMetadata} from '@/hooks';
import {MemberMetadaFormData} from '@/types';

interface CreateMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemberCreated: (memberId: string) => void;
  selectedCategoryId: string;
  selectedCategoryName: string;
}

export default function CreateMemberModal({
  isOpen,
  onClose,
  onMemberCreated,
  selectedCategoryId,
  selectedCategoryName,
}: CreateMemberModalProps) {
  const [formData, setFormData] = useState<MemberMetadaFormData>({
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
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {fetchMembers} = useFetchMembers();
  const {createMemberMetadata} = useMemberMetadata();

  const handleInputChange = (field: keyof MemberMetadaFormData, value: string) => {
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

      // Create member metadata
      await createMemberMetadata(data.id, {
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        address: formData.address || undefined,
        parent_name: formData.parent_name || undefined,
        parent_phone: formData.parent_phone || undefined,
        parent_email: formData.parent_email || undefined,
        medical_notes: formData.medical_notes || undefined,
        allergies: formData.allergies || undefined,
        emergency_contact_name: formData.emergency_contact_name || undefined,
        emergency_contact_phone: formData.emergency_contact_phone || undefined,
        notes: formData.notes || undefined,
        preferred_position: formData.preferred_position || undefined,
        jersey_size: formData.jersey_size || undefined,
        shoe_size: formData.shoe_size || undefined,
      });

      // Refresh members list
      await fetchMembers();

      // Call the callback with the new member ID
      onMemberCreated(data.id);

      // Reset form and close modal
      setFormData({
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
                  const sex = Array.from(keys)[0] as Genders;
                  handleInputChange('sex', sex);
                }}
              >
                {getGenderOptions().map(({value, label}) => (
                  <SelectItem key={value}>{label}</SelectItem>
                ))}
              </Select>
            </div>
          </CardBody>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardBody className="p-4">
            <h4 className="font-semibold mb-3 text-green-700">Kontaktní informace</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Telefon"
                value={formData.phone}
                onValueChange={(value) => handleInputChange('phone', value)}
                placeholder="+420 xxx xxx xxx"
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onValueChange={(value) => handleInputChange('email', value)}
                placeholder="email@example.com"
              />
              <Input
                label="Adresa"
                value={formData.address}
                onValueChange={(value) => handleInputChange('address', value)}
                placeholder="Ulice, město, PSČ"
                className="md:col-span-2"
              />
            </div>
          </CardBody>
        </Card>

        {/* Parent/Guardian Information */}
        <Card>
          <CardBody className="p-4">
            <h4 className="font-semibold mb-3 text-purple-700">Informace o zákonném zástupci</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Jméno zákonného zástupce"
                value={formData.parent_name}
                onValueChange={(value) => handleInputChange('parent_name', value)}
                placeholder="Jméno a příjmení"
              />
              <Input
                label="Telefon zákonného zástupce"
                value={formData.parent_phone}
                onValueChange={(value) => handleInputChange('parent_phone', value)}
                placeholder="+420 xxx xxx xxx"
              />
              <Input
                label="Email zákonného zástupce"
                type="email"
                value={formData.parent_email}
                onValueChange={(value) => handleInputChange('parent_email', value)}
                placeholder="email@example.com"
                className="md:col-span-2"
              />
            </div>
          </CardBody>
        </Card>

        {/* Medical Information */}
        <Card>
          <CardBody className="p-4">
            <h4 className="font-semibold mb-3 text-red-700">Zdravotní informace</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Textarea
                label="Zdravotní poznámky"
                value={formData.medical_notes}
                onValueChange={(value) => handleInputChange('medical_notes', value)}
                placeholder="Zdravotní omezení, chronické nemoci, atd."
                minRows={2}
                className="md:col-span-2"
              />
              <Textarea
                label="Alergie"
                value={formData.allergies}
                onValueChange={(value) => handleInputChange('allergies', value)}
                placeholder="Seznam alergií a jejich závažnost"
                minRows={2}
                className="md:col-span-2"
              />
              <Input
                label="Název kontaktní osoby pro případ nouze"
                value={formData.emergency_contact_name}
                onValueChange={(value) => handleInputChange('emergency_contact_name', value)}
                placeholder="Jméno a příjmení"
              />
              <Input
                label="Telefon kontaktní osoby pro případ nouze"
                value={formData.emergency_contact_phone}
                onValueChange={(value) => handleInputChange('emergency_contact_phone', value)}
                placeholder="+420 xxx xxx xxx"
              />
            </div>
          </CardBody>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardBody className="p-4">
            <h4 className="font-semibold mb-3 text-orange-700">Dodatečné informace</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Preferovaná pozice"
                value={formData.preferred_position}
                onValueChange={(value) => handleInputChange('preferred_position', value)}
                placeholder="např. Brankář, Obránce, Záložník, Útočník"
              />
              <Input
                label="Velikost dresu"
                value={formData.jersey_size}
                onValueChange={(value) => handleInputChange('jersey_size', value)}
                placeholder="např. S, M, L, XL"
              />
              <Input
                label="Velikost bot"
                value={formData.shoe_size}
                onValueChange={(value) => handleInputChange('shoe_size', value)}
                placeholder="např. 40, 41, 42"
              />
              <Textarea
                label="Poznámky"
                value={formData.notes}
                onValueChange={(value) => handleInputChange('notes', value)}
                placeholder="Další poznámky o členovi"
                minRows={2}
                className="md:col-span-2"
              />
            </div>
          </CardBody>
        </Card>
      </div>
    </UnifiedModal>
  );
}

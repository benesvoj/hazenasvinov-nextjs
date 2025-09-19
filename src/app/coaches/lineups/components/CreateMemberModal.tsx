'use client';

import React, {useState} from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Card,
  CardBody,
} from '@heroui/react';
import {UserPlusIcon} from '@heroicons/react/24/outline';
import {createClient} from '@/utils/supabase/client';
import {useFetchMembers} from '@/hooks/useFetchMembers';

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
  birth_date: string;
  gender: 'male' | 'female';
  phone: string;
  email: string;
  address: string;
  parent_name: string;
  parent_phone: string;
  parent_email: string;
  medical_notes: string;
  notes: string;
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
    birth_date: '',
    gender: 'male',
    phone: '',
    email: '',
    address: '',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
    medical_notes: '',
    notes: '',
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
      if (!formData.name || !formData.surname || !formData.birth_date) {
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
          birth_date: formData.birth_date,
          gender: formData.gender,
          phone: formData.phone || null,
          email: formData.email || null,
          address: formData.address || null,
          parent_name: formData.parent_name || null,
          parent_phone: formData.parent_phone || null,
          parent_email: formData.parent_email || null,
          medical_notes: formData.medical_notes || null,
          notes: formData.notes || null,
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
        birth_date: '',
        gender: 'male',
        phone: '',
        email: '',
        address: '',
        parent_name: '',
        parent_phone: '',
        parent_email: '',
        medical_notes: '',
        notes: '',
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
      birth_date: '',
      gender: 'male',
      phone: '',
      email: '',
      address: '',
      parent_name: '',
      parent_phone: '',
      parent_email: '',
      medical_notes: '',
      notes: '',
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <UserPlusIcon className="w-6 h-6 text-blue-500" />
            <h3 className="text-lg font-semibold">Přidat nového člena</h3>
          </div>
          <p className="text-sm text-gray-600">Kategorie: {selectedCategoryName}</p>
        </ModalHeader>
        <ModalBody>
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
                    value={formData.birth_date}
                    onValueChange={(value) => handleInputChange('birth_date', value)}
                    isRequired
                  />
                  <Select
                    label="Pohlaví"
                    selectedKeys={[formData.gender]}
                    onSelectionChange={(keys) => {
                      const gender = Array.from(keys)[0] as 'male' | 'female';
                      handleInputChange('gender', gender);
                    }}
                  >
                    <SelectItem key="male">Muž</SelectItem>
                    <SelectItem key="female">Žena</SelectItem>
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
                <h4 className="font-semibold mb-3 text-purple-700">
                  Informace o zákonném zástupci
                </h4>

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

            {/* Additional Information */}
            <Card>
              <CardBody className="p-4">
                <h4 className="font-semibold mb-3 text-orange-700">Dodatečné informace</h4>
                <div className="space-y-4">
                  <Input
                    label="Zdravotní poznámky"
                    value={formData.medical_notes}
                    onValueChange={(value) => handleInputChange('medical_notes', value)}
                    placeholder="Alergie, zdravotní omezení, atd."
                  />
                  <Input
                    label="Poznámky"
                    value={formData.notes}
                    onValueChange={(value) => handleInputChange('notes', value)}
                    placeholder="Další poznámky o členovi"
                  />
                </div>
              </CardBody>
            </Card>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={handleClose} disabled={isSubmitting}>
            Zrušit
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={isSubmitting}
            startContent={!isSubmitting && <UserPlusIcon className="w-4 h-4" />}
          >
            {isSubmitting ? 'Vytváření...' : 'Vytvořit člena'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

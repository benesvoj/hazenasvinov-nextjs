'use client';

import React, {useState} from 'react';

import {Card, CardBody} from '@heroui/react';

import {AdditionalSection} from '@/components/shared/members/modals/sections/AdditionalSection';
import {BasicInfoSection} from '@/components/shared/members/modals/sections/BasicInfoSection';
import {ContactSection} from '@/components/shared/members/modals/sections/ContactSection';
import {MedicalSection} from '@/components/shared/members/modals/sections/MedicalSection';
import {ParentSection} from '@/components/shared/members/modals/sections/ParentSection';

import {Dialog} from '@/components';
import {Genders, MemberFunction} from '@/enums';
import {useFetchMembers, useMemberMetadata, useSupabaseClient} from '@/hooks';
import {MemberMetadataFormData} from '@/types';

interface CreateMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemberCreated: (memberId: string) => void;
  selectedCategoryId: string;
  selectedCategoryName: string;
}

const INITIAL_FORM_DATA: MemberMetadataFormData = {
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

//** @deprecated Use MemberFormModal instead, which uses react-hook-form and has better validation and performance */
export default function CreateMemberModal({
  isOpen,
  onClose,
  onMemberCreated,
  selectedCategoryId,
  selectedCategoryName,
}: CreateMemberModalProps) {
  const [formData, setFormData] = useState<MemberMetadataFormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {refetch: fetchMembers} = useFetchMembers();
  const {createMemberMetadata} = useMemberMetadata();
  const supabase = useSupabaseClient();

  const handleInputChange = (field: keyof MemberMetadataFormData, value: string) => {
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
      setFormData(INITIAL_FORM_DATA);
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
    setFormData(INITIAL_FORM_DATA);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Přidat nového člena"
      subtitle={`Kategorie: ${selectedCategoryName}`}
      size="2xl"
      scrollBehavior="inside"
      onSubmit={handleSubmit}
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
        <BasicInfoSection
          handleInputChange={handleInputChange}
          formData={formData}
          categories={[]}
        />

        {/* Contact Information */}
        <ContactSection handleInputChange={handleInputChange} formData={formData} />

        {/* Parent/Guardian Information */}
        <ParentSection handleInputChange={handleInputChange} formData={formData} />

        {/* Medical Information */}
        <MedicalSection handleInputChange={handleInputChange} formData={formData} />

        {/* Additional Information */}
        <AdditionalSection handleInputChange={handleInputChange} formData={formData} />
      </div>
    </Dialog>
  );
}

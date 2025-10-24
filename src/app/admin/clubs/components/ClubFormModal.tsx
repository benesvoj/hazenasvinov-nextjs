import React from 'react';

import {Button, Checkbox, Input} from '@heroui/react';

import {UnifiedModal, LogoUpload} from '@/components';
import {ModalMode} from '@/enums';
import {translations} from '@/lib';
import {ClubFormData} from '@/types';

interface ClubFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: ClubFormData;
  setFormData: (data: ClubFormData) => void;
  onSubmit: () => void;
  isLoading: boolean;
  mode: ModalMode;
}

const tAction = translations.action;

export const ClubFormModal = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
  isLoading,
  mode,
}: ClubFormModalProps) => {
  const isEditMode = mode === ModalMode.EDIT;
  const modalTitle = isEditMode ? 'Editace klubu' : 'Přidat nový klub';

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      onSubmit={onSubmit}
      size="2xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="flat" onPress={onClose} isDisabled={isLoading}>
            {tAction.cancel}
          </Button>
          <Button color="primary" onPress={onSubmit} isLoading={isLoading} isDisabled={isLoading}>
            {isEditMode ? tAction.save : tAction.add}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Název klubu"
          placeholder="např. Hazena Švínov"
          isRequired
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
        />
        <Input
          label="Krátký název"
          placeholder="např. Švínov"
          value={formData.short_name ?? ''}
          onChange={(e) => setFormData({...formData, short_name: e.target.value})}
        />
        <Input
          label="Město"
          placeholder="např. Svinov"
          value={formData.city ? formData.city : ''}
          onChange={(e) => setFormData({...formData, city: e.target.value})}
        />
        <Input
          label="Rok založení"
          type="number"
          placeholder="např. 1920"
          value={formData.founded_year?.toString() || ''}
          onChange={(e) => setFormData({...formData, founded_year: parseInt(e.target.value)})}
        />
        <LogoUpload
          value={formData.logo_url ? formData.logo_url : ''}
          onChange={(logoUrl) => setFormData({...formData, logo_url: logoUrl})}
          label="Logo klubu"
          description="Nahrajte logo klubu (max 5MB, JPG/PNG)"
        />
        <Input
          label="Hřiště/venue"
          placeholder="např. Sportovní hala Švínov"
          value={formData.venue ? formData.venue : ''}
          onChange={(e) => setFormData({...formData, venue: e.target.value})}
        />
        <Input
          label="Webové stránky"
          placeholder="https://example.com"
          value={formData.web ? formData.web : ''}
          onChange={(e) => setFormData({...formData, web: e.target.value})}
        />
        <Input
          label="Email"
          type="email"
          placeholder="info@example.com"
          value={formData.email ? formData.email : ''}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
        />
        <Input
          label="Telefon"
          placeholder="+420 123 456 789"
          value={formData.phone ? formData.phone : ''}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
        />
        <Input
          label="Adresa"
          placeholder="ulice, město, PSČ"
          value={formData.address ? formData.address : ''}
          onChange={(e) => setFormData({...formData, address: e.target.value})}
        />
        <Input
          label="Popis"
          placeholder="Krátký popis klubu..."
          value={formData.description ? formData.description : ''}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
        />
        <Input
          label="Kontaktní osoba"
          placeholder="Jméno a příjmení"
          value={formData.contact_person ? formData.contact_person : ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              contact_person: e.target.value,
            })
          }
        />
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="create-is-own-club"
            checked={!!formData.is_own_club}
            onChange={(e) =>
              setFormData({
                ...formData,
                is_own_club: e.target.checked,
              })
            }
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="create-is-own-club" className="text-sm font-medium text-gray-700">
            Tento klub je náš domácí klub (pro filtrování zápasů a tabulek)
          </label>
        </div>
      </div>
    </UnifiedModal>
  );
};

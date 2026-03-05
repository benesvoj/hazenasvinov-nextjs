import React from 'react';

import {Checkbox} from '@heroui/checkbox';
import {Input} from '@heroui/input';

import {LogoUpload} from '@/components/ui/client';

import {translations} from '@/lib/translations';

import {Dialog} from '@/components';
import {ModalMode} from '@/enums';
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

const tAction = translations.common.actions;

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
  const modalTitle = isEditMode
    ? translations.clubs.dialogs.edit.title
    : translations.clubs.dialogs.add.title;
  const submitButtonLabel = isEditMode ? tAction.save : tAction.add;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      onSubmit={onSubmit}
      isLoading={isLoading}
      submitButtonLabel={submitButtonLabel}
      size="2xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label={translations.clubs.labels.name}
          placeholder={translations.clubs.placeholders.name}
          isRequired
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          size="sm"
        />
        <Input
          label={translations.clubs.labels.shortName}
          placeholder={translations.clubs.placeholders.shortName}
          value={formData.short_name ?? ''}
          onChange={(e) => setFormData({...formData, short_name: e.target.value})}
          size="sm"
        />
        <Input
          label={translations.clubs.labels.city}
          placeholder={translations.clubs.placeholders.city}
          value={formData.city ? formData.city : ''}
          onChange={(e) => setFormData({...formData, city: e.target.value})}
          size="sm"
        />
        <Input
          label={translations.clubs.labels.foundedYear}
          type="number"
          placeholder={translations.clubs.placeholders.foundedYear}
          value={formData.founded_year?.toString() || ''}
          onChange={(e) => setFormData({...formData, founded_year: parseInt(e.target.value)})}
          size="sm"
        />
        <LogoUpload
          value={formData.logo_url ? formData.logo_url : ''}
          onChange={(logoUrl) => setFormData({...formData, logo_url: logoUrl})}
          label={translations.clubs.labels.logo}
          description={translations.clubs.placeholders.logo}
        />
        <Input
          label={translations.clubs.labels.venue}
          placeholder={translations.clubs.placeholders.venue}
          value={formData.venue ? formData.venue : ''}
          onChange={(e) => setFormData({...formData, venue: e.target.value})}
          size="sm"
        />
        <Input
          label={translations.clubs.labels.web}
          placeholder={translations.clubs.placeholders.web}
          value={formData.web ? formData.web : ''}
          onChange={(e) => setFormData({...formData, web: e.target.value})}
          size="sm"
        />
        <Input
          label={translations.clubs.labels.email}
          type="email"
          placeholder={translations.clubs.placeholders.email}
          value={formData.email ? formData.email : ''}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          size="sm"
        />
        <Input
          label={translations.clubs.labels.phone}
          placeholder={translations.clubs.placeholders.phone}
          value={formData.phone ? formData.phone : ''}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
          size="sm"
        />
        <Input
          label={translations.clubs.labels.address}
          placeholder={translations.clubs.placeholders.address}
          value={formData.address ? formData.address : ''}
          onChange={(e) => setFormData({...formData, address: e.target.value})}
          size="sm"
        />
        <Input
          label={translations.clubs.labels.description}
          placeholder={translations.clubs.placeholders.description}
          value={formData.description ? formData.description : ''}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          size="sm"
        />
        <Input
          label={translations.clubs.labels.contactPerson}
          placeholder={translations.clubs.placeholders.contactPerson}
          value={formData.contact_person ? formData.contact_person : ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              contact_person: e.target.value,
            })
          }
          size="sm"
        />
        <div className="flex items-center space-x-2">
          <Checkbox
            id="create-is-own-club"
            checked={!!formData.is_own_club}
            onChange={(e) =>
              setFormData({
                ...formData,
                is_own_club: e.target.checked,
              })
            }
            size={'sm'}
          >
            {translations.clubs.labels.isOwnClub}
          </Checkbox>
        </div>
      </div>
    </Dialog>
  );
};
